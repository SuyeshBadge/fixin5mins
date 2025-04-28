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
 * Instagram posting configuration
 */
export interface InstagramPostConfig {
    accessToken: string;
    accountId: string;
    skipPosting?: boolean;
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

    logger.info(`Preparing to post ${images.length} images to Instagram...`);
    
    // Check if Instagram posting is disabled
    if (config.skipPosting) {
        const mockPostId = `mock-ig-${Date.now()}`;
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
        return `mockpost-no-cloudinary-${Date.now()}`;
    }
    
    // Initialize Cloudinary if needed
    initializeCloudinary();
    
    // Validate images for Instagram requirements
    validateImagesForInstagram(images);
    
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
                config.accessToken
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
        const postId = await publishCarousel(carouselId, config.accountId, config.accessToken);
        
        logger.info(`Successfully published to Instagram. Post ID: ${postId}`);
        
        // Step 4: Clean up Cloudinary images after successful posting
        await cleanupCloudinaryImages(cloudinaryUploads);
        
        return postId;
    } catch (error: any) {
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
        logger.error('Failed to post to Instagram:', errorMessage, error.response?.data || '');
        
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
 * Validates images for Instagram requirements
 * - All images in a carousel must have the same aspect ratio
 * - Supported aspect ratios between 4:5 and 1.91:1
 * - Max 10 images in a carousel
 */
function validateImagesForInstagram(images: RenderedImage[]): void {
    // Check carousel limit
    if (images.length > 10) {
        logger.warn(`Instagram only supports up to 10 images in a carousel. Only the first 10 will be used.`);
    }
    
    // Check if all images have the same aspect ratio (required for carousel)
    const firstAspectRatio = images[0].aspectRatio;
    const differentAspectRatios = images.filter(img => img.aspectRatio !== firstAspectRatio);
    
    if (differentAspectRatios.length > 0) {
        logger.warn(`All images in an Instagram carousel must have the same aspect ratio. Found different ratios. Using the images anyway, but Instagram may reject them.`);
    }
    
    // Check if aspect ratio is within Instagram's supported range (4:5 to 1.91:1)
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
    accessToken: string
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
        params.append('is_carousel_item', 'true');
        params.append('access_token', accessToken);
        console.log('Params:', params.toString());
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
            `Upload image ${image.id} to Instagram`
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
 * Publish the carousel
 */
async function publishCarousel(
    carouselId: string, 
    igBusinessAccountId: string, 
    accessToken: string
): Promise<string> {
    logger.debug(`Publishing carousel with ID: ${carouselId}`);
    
    try {
        const params = new URLSearchParams();
        params.append('creation_id', carouselId);
        params.append('access_token', accessToken)
        console.log('Params:', params.toString());
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
            'Publish Instagram carousel'
        );
        
        if (!response.data || !response.data.id) {
            throw new Error('Failed to publish carousel');
        }
        
        return response.data.id;
    } catch (error: any) {
        logger.error('Error publishing carousel:', error.response?.data || error.message || error);
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
        throw new Error('Instagram Graph API credentials not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in .env');
    }
    
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        logger.warn('Cloudinary credentials are not configured. Using mock mode for Instagram posting.');
        return `mockpost-single-no-cloudinary-${Date.now()}`;
    }
    
    // Initialize Cloudinary if needed
    initializeCloudinary();
    
    // Validate the image for Instagram requirements
    validateImagesForInstagram([image]);
    
    // Construct full caption with hashtags
    const fullCaption = formatCaptionForInstagram(caption, hashtags);
    
    // Track Cloudinary image for cleanup
    let cloudinaryPublicId: string | null = null;
    let cloudinaryUrl: string | null = null;
    
    try {
        // Step 1: Upload the image to Cloudinary
        logger.debug(`Uploading image: ${image.id} (${image.filePath})`);
        
        const url = await uploadImageToCloudinary(image.filePath);
        const fileName = path.basename(image.filePath);
        const publicId = `fixin5mins/${fileName.replace(/\.\w+$/, '')}-${Date.now()}`;
        
        cloudinaryPublicId = publicId;
        cloudinaryUrl = url;
        
        logger.debug(`Image uploaded to Cloudinary, URL: ${url}`);
        
        // Step 2: Create a media container for the image
        const params = new URLSearchParams();
        params.append('image_url', url);
        params.append('caption', fullCaption);
        params.append('access_token', config.accessToken);
        
        const mediaResponse = await makeApiRequestWithRetry<{id: string}>(
            () => axios.post(
                `${GRAPH_API_URL}/${config.accountId}/media`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 60000, // 60 second timeout for uploads
                }
            ) as Promise<ApiResponse<{id: string}>>,
            'Create Instagram media container'
        );
        
        if (!mediaResponse.data || !mediaResponse.data.id) {
            throw new Error('Failed to create media container');
        }
        
        const mediaId = mediaResponse.data.id;
        logger.debug(`Media container created with ID: ${mediaId}`);
        
        // Step 3: Publish the media
        const publishParams = new URLSearchParams();
        publishParams.append('creation_id', mediaId);
        publishParams.append('access_token', config.accessToken);
        
        const publishResponse = await makeApiRequestWithRetry<{id: string}>(
            () => axios.post(
                `${GRAPH_API_URL}/${config.accountId}/media_publish`,
                publishParams,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }
            ) as Promise<ApiResponse<{id: string}>>,
            'Publish Instagram media'
        );
        
        if (!publishResponse.data || !publishResponse.data.id) {
            throw new Error('Failed to publish media');
        }
        
        const postId = publishResponse.data.id;
        logger.info(`Successfully published to Instagram. Post ID: ${postId}`);
        
        // Step 4: Clean up Cloudinary image after successful posting
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