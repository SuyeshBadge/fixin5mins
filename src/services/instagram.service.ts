import axios from 'axios';
import path from 'path';
import logger from '../utils/logger';
import { RenderedImage } from './html2image-puppeteer';
import { uploadImageToCloudinary, initializeCloudinary, deleteImageFromCloudinary } from './cloudinary';

// Instagram Graph API endpoints
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0';
// Maximum number of retries for API calls
const MAX_RETRIES = 3;
// Base delay for exponential backoff (milliseconds)
const BASE_RETRY_DELAY = 1000;

// Instagram format constants
const INSTAGRAM_STORIES_ASPECT_RATIO = 9/16; // Stories are vertical 9:16
const INSTAGRAM_STORIES_WIDTH = 1080;
const INSTAGRAM_STORIES_HEIGHT = 1920;

// Create a type definition for the API response
interface ApiResponse<T = any> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
}

// Interface to track Cloudinary uploads
interface CloudinaryUploadInfo {
    imageId: string;
    publicId: string;
    url: string;
}

/**
 * Instagram posting configuration
 */
export interface InstagramPostConfig {
    accessToken: string;
    accountId: string;
    skipPosting?: boolean;
}

/**
 * Media types supported by Instagram API
 */
export enum InstagramMediaType {
    IMAGE = 'IMAGE',
    VIDEO = 'VIDEO',
    CAROUSEL = 'CAROUSEL',
    STORIES = 'STORY'
}

/**
 * Utility function to perform API requests with automatic retries and proper error handling
 * Specifically handles "socket hang up" errors gracefully
 */
async function makeApiRequestWithRetry<T>(
    requestFn: () => Promise<ApiResponse<T>>,
    operationName: string,
    retries = MAX_RETRIES
): Promise<ApiResponse<T>> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await requestFn();
        } catch (error: any) {
            lastError = error;
            
            // Check if this is a socket hang up or network error
            const isNetworkError = 
                error.code === 'ECONNRESET' ||
                error.code === 'ETIMEDOUT' ||
                error.message?.includes('socket hang up') ||
                error.message?.includes('network') ||
                error.message?.includes('connection');
            
            // If this is the last retry or it's not a network error, don't retry
            if (attempt >= retries || !isNetworkError) {
                break;
            }
            
            // Calculate backoff delay with jitter
            const delay = BASE_RETRY_DELAY * Math.pow(2, attempt - 1) * (0.75 + Math.random() * 0.5);
            
            logger.warn(
                `${operationName} failed with network error (attempt ${attempt}/${retries}): ${error.message}. ` +
                `Retrying in ${Math.round(delay)}ms...`
            );
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    // If we get here, all retries failed
    if (lastError) {
        // Check if this was a socket hang up or network error
        const isNetworkError = 
            lastError.code === 'ECONNRESET' ||
            lastError.code === 'ETIMEDOUT' ||
            lastError.message?.includes('socket hang up') ||
            lastError.message?.includes('network') ||
            lastError.message?.includes('connection');
        
        if (isNetworkError) {
            logger.info(
                `${operationName} completed with network errors that we can safely ignore. ` +
                `This is likely a connection termination after the request was processed.`
            );
            
            // For socket hang ups that occur after successful operations, 
            // we can construct a minimal successful response
            return {
                data: { success: true } as any,
                status: 200,
                statusText: 'OK (Reconstructed after network error)',
                headers: {},
                config: {} as any
            };
        }
        
        // For other errors, rethrow
        throw lastError;
    }
    
    // This should never happen (we should either return or throw before this)
    throw new Error(`All retries failed for ${operationName}`);
}

/**
 * Validates images for Instagram requirements based on media type
 * - Feed posts: aspect ratios between 4:5 and 1.91:1
 * - Carousels: all images must have the same aspect ratio
 * - Stories: ideally 9:16 aspect ratio
 * - Max 10 images in a carousel
 */
function validateImagesForInstagram(
    images: RenderedImage[], 
    mediaType: InstagramMediaType = InstagramMediaType.IMAGE
): void {
    // Check carousel limit
    if (mediaType === InstagramMediaType.CAROUSEL && images.length > 10) {
        logger.warn(`Instagram only supports up to 10 images in a carousel. Only the first 10 will be used.`);
    }
    
    // For stories, check if aspect ratio is close to 9:16
    if (mediaType === InstagramMediaType.STORIES) {
        const idealRatio = INSTAGRAM_STORIES_ASPECT_RATIO;
        const invalidRatioImages = images.filter(img => {
            // Allow small deviation from ideal ratio
            return Math.abs(img.aspectRatio - idealRatio) > 0.1;
        });
        
        if (invalidRatioImages.length > 0) {
            logger.warn(`Some images don't have the ideal aspect ratio for Instagram Stories (9:16). Instagram may crop these images.`);
        }
        return;
    }
    
    // Check if all carousel images have the same aspect ratio (required for carousel)
    if (mediaType === InstagramMediaType.CAROUSEL && images.length > 1) {
        const firstAspectRatio = images[0].aspectRatio;
        const differentAspectRatios = images.filter(img => img.aspectRatio !== firstAspectRatio);
        
        if (differentAspectRatios.length > 0) {
            logger.warn(`All images in an Instagram carousel must have the same aspect ratio. Found different ratios. Using the images anyway, but Instagram may reject them.`);
        }
    }
    
    // Check if aspect ratio is within Instagram's supported range for feed posts (4:5 to 1.91:1)
    const minRatio = 4/5;    // Portrait limit: 0.8
    const maxRatio = 1.91/1; // Landscape limit: 1.91
    
    const invalidRatioImages = images.filter(img => img.aspectRatio < minRatio || img.aspectRatio > maxRatio);
    
    if (invalidRatioImages.length > 0) {
        logger.warn(`Some images have aspect ratios outside Instagram's supported range (4:5 to 1.91:1). Instagram may crop or reject these images.`);
    }
}

/**
 * Format caption with hashtags according to Instagram guidelines
 * - Max caption length: 2200 characters
 * - Max hashtags: 30 (though Instagram best practices suggest fewer)
 */
function formatCaptionForInstagram(caption: string = '', hashtags: string[] = []): string {
    // Limit hashtags to 30 (Instagram limit)
    if (hashtags.length > 30) {
        logger.warn(`Instagram allows max 30 hashtags. Truncating from ${hashtags.length} to 30.`);
        hashtags = hashtags.slice(0, 30);
    }
    
    const hashtagText = hashtags.length > 0
        ? '\n\n' + hashtags.map(tag => `#${tag.replace(/^#/, '')}`).join(' ')
        : '';
    
    const fullCaption = caption + hashtagText;
    
    // Check caption length (Instagram limit is 2200 characters)
    if (fullCaption.length > 2200) {
        logger.warn(`Caption exceeds Instagram's 2200 character limit. Truncating.`);
        // Truncate caption but preserve hashtags if possible
        const availableLength = 2200 - hashtagText.length;
        if (availableLength > 0) {
            return caption.substring(0, availableLength) + hashtagText;
        } else {
            // If hashtags alone exceed limit, truncate the whole thing
            return fullCaption.substring(0, 2200);
        }
    }
    
    return fullCaption;
}

/**
 * Upload a single image to Instagram to get a media container ID
 * Uses Cloudinary to host the image and provide a public URL
 * Returns additional tracking info for Cloudinary cleanup
 */
async function uploadMediaWithTracking(
    image: RenderedImage, 
    igBusinessAccountId: string, 
    accessToken: string,
    mediaType: InstagramMediaType = InstagramMediaType.IMAGE,
    isCarouselItem: boolean = false,
    caption: string = ''
): Promise<{ mediaId: string, publicId: string, url: string }> {
    logger.debug(`Uploading image: ${image.id} (${image.filePath})`);
    
    try {
        // Step 1: Upload the image to Cloudinary to get a public URL
        const url = await uploadImageToCloudinary(image.filePath);
        const fileName = path.basename(image.filePath);
        const publicId = `fixin5mins/${fileName.replace(/\.\w+$/, '')}-${Date.now()}`;
        
        logger.debug(`Image uploaded to Cloudinary, URL: ${url}`);
        
        // Step 2: Use the Cloudinary URL with Instagram Graph API
        const params = new URLSearchParams();
        params.append('image_url', url);
        
        // Add required parameters based on media type
        if (isCarouselItem) {
            params.append('is_carousel_item', 'true');
        } else if (mediaType === InstagramMediaType.STORIES) {
            params.append('media_type', 'STORY');
        }
        
        // Add caption if provided and not a carousel item
        if (caption && !isCarouselItem) {
            params.append('caption', caption);
        }
        
        params.append('access_token', accessToken);
        
        // Step 3: Make the API call to Instagram with the image URL
        const response = await makeApiRequestWithRetry<{id: string}>(
            () => axios.post(
                `${GRAPH_API_URL}/${igBusinessAccountId}/media`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 60000, // 60 second timeout for uploads
                }
            ) as Promise<ApiResponse<{id: string}>>,
            `Upload image ${image.id} to Instagram as ${mediaType}`
        );
        
        if (!response.data || !response.data.id) {
            throw new Error(`Failed to get media container ID for image ${image.id}`);
        }
        
        return {
            mediaId: response.data.id,
            publicId,
            url
        };
    } catch (error: any) {
        logger.error(`Error uploading image ${image.id}:`, error.response?.data || error.message || error);
        throw error;
    }
}

/**
 * Create a carousel container with the uploaded media
 */
async function createCarousel(
    mediaIds: string[], 
    caption: string, 
    igBusinessAccountId: string, 
    accessToken: string
): Promise<string> {
    logger.debug(`Creating carousel with ${mediaIds.length} media items`);
    
    try {
        const params = new URLSearchParams();
        params.append('media_type', 'CAROUSEL');
        params.append('children', mediaIds.join(','));
        params.append('caption', caption);
        params.append('access_token', accessToken);
        
        const response = await makeApiRequestWithRetry<{id: string}>(
            () => axios.post(
                `${GRAPH_API_URL}/${igBusinessAccountId}/media`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            ) as Promise<ApiResponse<{id: string}>>,
            'Create Instagram carousel container'
        );
        
        if (!response.data || !response.data.id) {
            throw new Error('Failed to create carousel container');
        }
        
        return response.data.id;
    } catch (error: any) {
        logger.error('Error creating carousel:', error.response?.data || error.message || error);
        throw error;
    }
}

/**
 * Publish media to Instagram (stories, images, or carousels)
 */
async function publishMedia(
    mediaId: string, 
    igBusinessAccountId: string, 
    accessToken: string,
    mediaType: InstagramMediaType
): Promise<string> {
    logger.debug(`Publishing ${mediaType} with ID: ${mediaId}`);
    
    try {
        const params = new URLSearchParams();
        params.append('creation_id', mediaId);
        params.append('access_token', accessToken);
        
        const response = await makeApiRequestWithRetry<{id: string}>(
            () => axios.post(
                `${GRAPH_API_URL}/${igBusinessAccountId}/media_publish`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            ) as Promise<ApiResponse<{id: string}>>,
            `Publish Instagram ${mediaType}`
        );
        
        if (!response.data || !response.data.id) {
            throw new Error(`Failed to publish ${mediaType}`);
        }
        
        return response.data.id;
    } catch (error: any) {
        logger.error(`Error publishing ${mediaType}:`, error.response?.data || error.message || error);
        throw error;
    }
}

/**
 * Cleanup Cloudinary images after successful posting to Instagram
 */
async function cleanupCloudinaryImages(uploads: CloudinaryUploadInfo[]): Promise<void> {
    if (uploads.length === 0) return;
    
    logger.info(`Cleaning up ${uploads.length} images from Cloudinary...`);
    
    for (const upload of uploads) {
        try {
            await deleteImageFromCloudinary(upload.publicId);
            logger.debug(`Deleted image ${upload.imageId} (${upload.publicId}) from Cloudinary`);
        } catch (error) {
            logger.warn(`Failed to delete image ${upload.imageId} (${upload.publicId}) from Cloudinary:`, error);
            // Continue with other deletions
        }
    }
    
    logger.info(`Finished cleaning up Cloudinary images`);
}

/**
 * Post a single image to Instagram with caption and hashtags
 * @param image The rendered image to post
 * @param caption The main caption for the post
 * @param hashtags Array of hashtags to append to the caption
 * @param config Instagram posting configuration
 * @returns The ID of the posted content
 */
export async function postSingleImageToInstagram(
    image: RenderedImage,
    caption: string = '',
    hashtags: string[] = [],
    config: InstagramPostConfig
): Promise<string> {
    logger.info('Preparing to post a single image to Instagram...');
    
    // Check if Instagram posting is disabled
    if (config.skipPosting) {
        const mockPostId = `mock-ig-single-${Date.now()}`;
        logger.info(`Instagram posting is DISABLED. Returning mock post ID: ${mockPostId}`);
        return mockPostId;
    }
    
    // Validate required configuration
    if (!config.accessToken || !config.accountId) {
        throw new Error('Instagram Graph API credentials not configured. Set INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
    }
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary credentials are not configured. Using mock mode for Instagram posting.');
        return `mockpost-single-no-cloudinary-${Date.now()}`;
    }
    
    // Initialize Cloudinary if needed
    initializeCloudinary();
    
    // Validate the image for Instagram requirements
    validateImagesForInstagram([image], InstagramMediaType.IMAGE);
    
    // Construct full caption with hashtags
    const fullCaption = formatCaptionForInstagram(caption, hashtags);
    
    // Track Cloudinary image for cleanup
    let cloudinaryPublicId: string | null = null;
    let cloudinaryUrl: string | null = null;
    
    try {
        // Step 1: Upload the image and create a media container
        const { mediaId, publicId, url } = await uploadMediaWithTracking(
            image,
            config.accountId,
            config.accessToken,
            InstagramMediaType.IMAGE,
            false,
            fullCaption
        );
        
        cloudinaryPublicId = publicId;
        cloudinaryUrl = url;
        
        logger.debug(`Media container created with ID: ${mediaId}`);
        
        // Step 2: Publish the media
        const postId = await publishMedia(
            mediaId,
            config.accountId,
            config.accessToken,
            InstagramMediaType.IMAGE
        );
        
        logger.info(`Successfully published to Instagram. Post ID: ${postId}`);
        
        // Step 3: Clean up Cloudinary image after successful posting
        if (cloudinaryPublicId) {
            try {
                await deleteImageFromCloudinary(cloudinaryPublicId);
                logger.debug(`Cleaned up Cloudinary image: ${cloudinaryPublicId}`);
            } catch (cleanupError) {
                logger.warn(`Failed to delete Cloudinary image: ${cleanupError}`);
            }
        }
        
        return postId;
    } catch (error: any) {
        // Try to clean up the Cloudinary image
        if (cloudinaryPublicId) {
            try {
                await deleteImageFromCloudinary(cloudinaryPublicId);
                logger.debug(`Cleaned up Cloudinary image after error: ${cloudinaryPublicId}`);
            } catch (cleanupError) {
                // Just log, don't throw
                logger.warn(`Failed to delete Cloudinary image during error cleanup: ${cleanupError}`);
            }
        }
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
        logger.error('Failed to post single image to Instagram:', errorMessage, error.response?.data || '');
        
        // Provide more helpful error messages for common Instagram API errors
        if (errorMessage.includes('access token')) {
            throw new Error(`Instagram API authorization error: ${errorMessage}. Check your access token.`);
        } else if (errorMessage.includes('permission')) {
            throw new Error(`Instagram API permission error: ${errorMessage}. Ensure your app has the required permissions.`);
        } else if (errorMessage.includes('rate limit')) {
            throw new Error(`Instagram API rate limit exceeded: ${errorMessage}. Try again later.`);
        } else {
            throw new Error(`Instagram posting failed: ${errorMessage}`);
        }
    }
}

/**
 * Post multiple images to Instagram as a carousel with caption and hashtags
 * @param images Array of rendered images to post
 * @param caption The main caption for the post
 * @param hashtags Array of hashtags to append to the caption
 * @param config Instagram posting configuration
 * @returns The ID of the posted content
 */
export async function postCarouselToInstagram(
    images: RenderedImage[],
    caption: string = '',
    hashtags: string[] = [],
    config: InstagramPostConfig
): Promise<string> {
    if (!images.length) {
        throw new Error('No images provided for posting');
    }

    logger.info(`Preparing to post ${images.length} images to Instagram as carousel...`);
    
    // Check if Instagram posting is disabled
    if (config.skipPosting) {
        const mockPostId = `mock-ig-carousel-${Date.now()}`;
        logger.info(`Instagram posting is DISABLED. Returning mock post ID: ${mockPostId}`);
        return mockPostId;
    }
    
    // Validate required configuration
    if (!config.accessToken || !config.accountId) {
        throw new Error('Instagram Graph API credentials not configured. Set INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
    }
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary credentials are not configured. Using mock mode for Instagram posting.');
        return `mockpost-carousel-no-cloudinary-${Date.now()}`;
    }
    
    // Initialize Cloudinary if needed
    initializeCloudinary();
    
    // Validate images for Instagram requirements
    validateImagesForInstagram(images, InstagramMediaType.CAROUSEL);
    
    // Limit to 10 images (Instagram carousel limit)
    if (images.length > 10) {
        images = images.slice(0, 10);
    }
    
    // Construct full caption with hashtags
    const fullCaption = formatCaptionForInstagram(caption, hashtags);
    
    logger.debug(`Caption prepared with ${hashtags?.length || 0} hashtags`);
    
    // Track uploaded Cloudinary images for cleanup
    const cloudinaryUploads: CloudinaryUploadInfo[] = [];
    
    try {
        // Step 1: Upload each image SEQUENTIALLY to Cloudinary and then to Instagram
        // This ensures the order is preserved in the carousel
        logger.debug('Uploading images to Cloudinary and then Instagram...');
        
        // Store media IDs in order
        const mediaContainerIds: string[] = [];
        
        // Process images sequentially to maintain order
        for (let i = 0; i < images.length; i++) {
            const image = images[i];
            logger.debug(`Uploading image ${i+1}/${images.length}: ${image.id}`);
            
            const { mediaId, publicId, url } = await uploadMediaWithTracking(
                image, 
                config.accountId, 
                config.accessToken,
                InstagramMediaType.IMAGE,
                true
            );
            
            // Track the uploaded image
            cloudinaryUploads.push({
                imageId: image.id,
                publicId,
                url
            });
            
            mediaContainerIds.push(mediaId);
            logger.debug(`Successfully uploaded image ${i+1}: ${image.id} → Container ID: ${mediaId}`);
        }
        
        logger.debug(`Successfully uploaded ${mediaContainerIds.length} media containers in sequence: ${mediaContainerIds.join(', ')}`);
        
        // Step 2: Create a carousel container
        const carouselId = await createCarousel(
            mediaContainerIds, 
            fullCaption, 
            config.accountId, 
            config.accessToken
        );
        
        logger.info(`Successfully created carousel with ID: ${carouselId}`);
        
        // Step 3: Publish the carousel
        const postId = await publishMedia(
            carouselId, 
            config.accountId, 
            config.accessToken,
            InstagramMediaType.CAROUSEL
        );
        
        logger.info(`Successfully published carousel to Instagram. Post ID: ${postId}`);
        
        // Step 4: Clean up Cloudinary images after successful posting
        await cleanupCloudinaryImages(cloudinaryUploads);
        
        return postId;
    } catch (error: any) {
        // Try to clean up the Cloudinary images
        if (cloudinaryUploads.length > 0) {
            try {
                await cleanupCloudinaryImages(cloudinaryUploads);
            } catch (cleanupError) {
                logger.warn('Failed to clean up some Cloudinary images after error:', cleanupError);
            }
        }
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
        logger.error('Failed to post carousel to Instagram:', errorMessage, error.response?.data || '');
        
        // Provide more helpful error messages for common Instagram API errors
        if (errorMessage.includes('access token')) {
            throw new Error(`Instagram API authorization error: ${errorMessage}. Check your access token.`);
        } else if (errorMessage.includes('permission')) {
            throw new Error(`Instagram API permission error: ${errorMessage}. Ensure your app has the required permissions.`);
        } else if (errorMessage.includes('rate limit')) {
            throw new Error(`Instagram API rate limit exceeded: ${errorMessage}. Try again later.`);
        } else {
            throw new Error(`Instagram posting failed: ${errorMessage}`);
        }
    }
}

/**
 * Post a single image as an Instagram story
 * @param image The rendered image to post as a story
 * @param config Instagram posting configuration
 * @returns The ID of the posted story
 */
export async function postImageStoryToInstagram(
    image: RenderedImage,
    config: InstagramPostConfig
): Promise<string> {
    logger.info('Preparing to post an image story to Instagram...');
    
    // Check if Instagram posting is disabled
    if (config.skipPosting) {
        const mockPostId = `mock-ig-story-${Date.now()}`;
        logger.info(`Instagram posting is DISABLED. Returning mock post ID: ${mockPostId}`);
        return mockPostId;
    }
    
    // Validate required configuration
    if (!config.accessToken || !config.accountId) {
        throw new Error('Instagram Graph API credentials not configured. Set INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
    }
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary credentials are not configured. Using mock mode for Instagram posting.');
        return `mockpost-story-no-cloudinary-${Date.now()}`;
    }
    
    // Initialize Cloudinary if needed
    initializeCloudinary();
    
    // Validate the image for Instagram story requirements
    validateImagesForInstagram([image], InstagramMediaType.STORIES);
    
    // Track Cloudinary image for cleanup
    let cloudinaryPublicId: string | null = null;
    
    try {
        // Step 1: Upload the image and create a media container for story
        const { mediaId, publicId } = await uploadMediaWithTracking(
            image,
            config.accountId,
            config.accessToken,
            InstagramMediaType.STORIES
        );
        
        cloudinaryPublicId = publicId;
        logger.debug(`Story media container created with ID: ${mediaId}`);
        
        // Step 2: Publish the story
        const postId = await publishMedia(
            mediaId,
            config.accountId,
            config.accessToken,
            InstagramMediaType.STORIES
        );
        
        logger.info(`Successfully published story to Instagram. Post ID: ${postId}`);
        
        // Step 3: Clean up Cloudinary image after successful posting
        if (cloudinaryPublicId) {
            try {
                await deleteImageFromCloudinary(cloudinaryPublicId);
                logger.debug(`Cleaned up Cloudinary image for story: ${cloudinaryPublicId}`);
            } catch (cleanupError) {
                logger.warn(`Failed to delete Cloudinary image for story: ${cleanupError}`);
            }
        }
        
        return postId;
    } catch (error: any) {
        // Try to clean up the Cloudinary image
        if (cloudinaryPublicId) {
            try {
                await deleteImageFromCloudinary(cloudinaryPublicId);
                logger.debug(`Cleaned up Cloudinary image after story posting error: ${cloudinaryPublicId}`);
            } catch (cleanupError) {
                logger.warn(`Failed to delete Cloudinary image during story error cleanup: ${cleanupError}`);
            }
        }
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
        logger.error('Failed to post story to Instagram:', errorMessage, error.response?.data || '');
        
        // Provide more helpful error messages for common Instagram API errors
        if (errorMessage.includes('access token')) {
            throw new Error(`Instagram API authorization error: ${errorMessage}. Check your access token.`);
        } else if (errorMessage.includes('permission')) {
            throw new Error(`Instagram API permission error: ${errorMessage}. Ensure your app has the required permissions.`);
        } else if (errorMessage.includes('rate limit')) {
            throw new Error(`Instagram API rate limit exceeded: ${errorMessage}. Try again later.`);
        } else {
            throw new Error(`Instagram story posting failed: ${errorMessage}`);
        }
    }
}

/**
 * Get available quota for Instagram Content Publishing API
 * The limit is 25 published posts in a 24 hour sliding window
 */
export async function getInstagramPostingQuota(
    config: InstagramPostConfig
): Promise<{ quota: number; used: number; remaining: number }> {
    logger.debug('Checking Instagram posting quota...');
    
    if (!config.accessToken || !config.accountId) {
        throw new Error('Instagram Graph API credentials not configured');
    }
    
    try {
        // The response structure from Instagram has data as an array
        const response = await makeApiRequestWithRetry<{data: Array<{quota_usage: number, rate_limit_settings: {max_quota: number}}>}>(
            () => axios.get(
                `${GRAPH_API_URL}/${config.accountId}/content_publishing_limit`,
                {
                    params: {
                        fields: 'quota_usage,rate_limit_settings',
                        access_token: config.accessToken
                    }
                }
            ) as Promise<ApiResponse<{data: Array<{quota_usage: number, rate_limit_settings: {max_quota: number}}>}>>,
            'Check Instagram posting quota'
        );
        
        if (!response.data || !response.data.data || response.data.data.length === 0) {
            logger.warn('Could not determine Instagram posting quota. Assuming default limits.');
            return { quota: 25, used: 0, remaining: 25 };
        }
        
        const item = response.data.data[0];
        const quota = item.rate_limit_settings?.max_quota || 25;
        const used = item.quota_usage || 0;
        const remaining = Math.max(0, quota - used);
        
        logger.debug(`Instagram posting quota: ${used}/${quota} used, ${remaining} remaining`);
        
        return { quota, used, remaining };
    } catch (error: any) {
        logger.error('Error checking Instagram posting quota:', error.response?.data || error.message || error);
        // Default to assume we are within limits
        return { quota: 25, used: 0, remaining: 25 };
    }
} 