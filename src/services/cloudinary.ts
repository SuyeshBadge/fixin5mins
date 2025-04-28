import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger';
import path from 'path';
import config from '../config';
/**
 * Initialize Cloudinary configuration
 * Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are in .env
 */
export function initializeCloudinary(): void {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        logger.warn('Cloudinary credentials not fully configured. Instagram image posting may not work.');
        return;
    }

    cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
    });

    logger.info('Cloudinary configured successfully');
}

/**
 * Upload an image file to Cloudinary and get a public URL
 * @param imagePath Local path to the image file
 * @returns The public URL of the uploaded image
 */
export async function uploadImageToCloudinary(imagePath: string): Promise<string> {
    if (!config.cloudinary.cloudName) {
        throw new Error('Cloudinary is not configured. Cannot upload images.');
    }

    try {
        const fileName = path.basename(imagePath);
        const uniquePublicId = `fixin5mins/${fileName.replace(/\.\w+$/, '')}-${Date.now()}`;
        
        logger.debug(`Uploading ${imagePath} to Cloudinary as ${uniquePublicId}...`);
        
        const result = await cloudinary.uploader.upload(imagePath, {
            public_id: uniquePublicId,
            resource_type: 'image',
        });
        
        logger.debug(`Image uploaded successfully. URL: ${result.secure_url}`);
        return result.secure_url;
    } catch (error: any) {
        logger.error('Failed to upload image to Cloudinary:', error);
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
}

/**
 * Delete an image from Cloudinary to clean up resources
 * @param publicId The public ID of the image to delete
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
    if (!config.cloudinary.cloudName) {
        logger.debug('Cloudinary not configured. Skipping delete operation.');
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId);
        logger.debug(`Successfully deleted image with public ID: ${publicId} from Cloudinary`);
    } catch (error: any) {
        logger.warn(`Failed to delete image from Cloudinary (${publicId}):`, error);
        // Not throwing here as this is cleanup and shouldn't halt the main process
    }
} 