import puppeteer, { Browser } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

/**
 * Represents the result of rendering HTML to an image
 */
export interface RenderedImage {
    id: string;
    filePath: string;
    width: number;
    height: number;
    aspectRatio: number;
}

/**
 * Instagram image requirements
 * - Recommended resolution: 1080x1080px (square)
 * - Supported aspect ratios: between 4:5 and 1.91:1 (square 1:1 standard)
 * - Supported formats: JPEG, PNG
 * - Max file size: 30MB
 */
const INSTAGRAM_IMAGE_CONFIG = {
    width: 1080,        // Instagram optimal width
    height: 1080,       // Instagram standard square
    aspectRatio: 1.0,   // 1:1 square (most reliable for carousels)
    deviceScaleFactor: 2, // Higher resolution rendering
    format: 'png',      // PNG format for high quality
    maxImages: 10       // Instagram supports max 10 images in a carousel
};

/**
 * Represents HTML content to render
 */
export interface HtmlContent {
    id: string;
    html: string;
}

/**
 * Configuration for HTML to image rendering
 */
export interface RenderOptions {
    preserveImages?: boolean;
    outputDir?: string;
}

/**
 * Retry configuration for browser operations
 */
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000  // 10 seconds
};

/**
 * Sleep utility function for retry delays
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateDelay(attempt: number): number {
    const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
    return Math.min(delay, RETRY_CONFIG.maxDelay);
}

/**
 * Renders HTML content to images according to Instagram API guidelines
 * @param htmlContents Array of HTML content to render to images
 * @param options Rendering options
 * @returns Array of paths to the rendered image files
 */
export async function renderHtmlToImages(
    htmlContents: HtmlContent[], 
    options: RenderOptions = {}
): Promise<RenderedImage[]> {
    // Instagram allows max 10 images in a carousel
    if (htmlContents.length > INSTAGRAM_IMAGE_CONFIG.maxImages) {
        logger.warn(`Instagram only supports ${INSTAGRAM_IMAGE_CONFIG.maxImages} images in a carousel. Truncating to ${INSTAGRAM_IMAGE_CONFIG.maxImages} images.`);
        htmlContents = htmlContents.slice(0, INSTAGRAM_IMAGE_CONFIG.maxImages);
    }
    
    logger.info(`Rendering ${htmlContents.length} HTML templates to images...`);
    
    // Determine output directory
    let outputDir: string;
    
    if (options.preserveImages && options.outputDir) {
        // Use configured output directory
        outputDir = path.join(options.outputDir, `instagram-post-${Date.now()}`);
        // Ensure the directory exists
        await fs.mkdir(outputDir, { recursive: true });
        logger.info(`Using persistent output directory: ${outputDir}`);
    } else {
        // Create temporary directory for storing images
        outputDir = path.join(os.tmpdir(), `fixin5mins-${uuidv4()}`);
        await fs.mkdir(outputDir, { recursive: true });
    }
    
    logger.debug(`Created output directory: ${outputDir}`);
    
    // Launch Puppeteer browser with retry logic
    let browser: Browser | null = null;
    let lastError: any;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
        try {
            logger.debug(`Launching browser (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`);
            
            // Launch Puppeteer browser with extended timeout for Docker environment
            browser = await puppeteer.launch({
                headless: true, // Use headless mode
                protocolTimeout: 60000, // 60 seconds timeout for protocol operations
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage', // Overcome limited resource problems
                    '--disable-extensions',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--no-first-run',
                    '--no-zygote',
                    '--single-process', // Helps with Docker resource constraints
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            });
            
            logger.debug('Browser launched successfully');
            break; // Success, exit retry loop
            
        } catch (error) {
            lastError = error;
            logger.warn(`Browser launch attempt ${attempt + 1} failed:`, error);
            
            if (attempt < RETRY_CONFIG.maxRetries) {
                const delay = calculateDelay(attempt);
                logger.info(`Retrying browser launch in ${delay}ms...`);
                await sleep(delay);
            } else {
                logger.error('All browser launch attempts failed');
                throw new Error(`Failed to launch browser after ${RETRY_CONFIG.maxRetries + 1} attempts. Last error: ${lastError}`);
            }
        }
    }
    
    if (!browser) {
        throw new Error('Browser failed to initialize after all retry attempts');
    }
    
    try {
        const page = await browser.newPage();
        
        // Set viewport to Instagram's recommended dimensions
        await page.setViewport({
            width: INSTAGRAM_IMAGE_CONFIG.width,
            height: INSTAGRAM_IMAGE_CONFIG.height,
            deviceScaleFactor: INSTAGRAM_IMAGE_CONFIG.deviceScaleFactor
        });
        
        // Process each HTML output to an image
        const renderedImages: RenderedImage[] = [];
        
        for (const htmlContent of htmlContents) {
            const outputFilePath = path.join(outputDir, `${htmlContent.id}.${INSTAGRAM_IMAGE_CONFIG.format}`);
            
            try {
                // Set the HTML content
                await page.setContent(htmlContent.html, {
                    waitUntil: 'networkidle0', // Wait until no more network connections
                    timeout: 30000 // 30 second timeout for loading
                });
                
                // Take screenshot according to Instagram requirements
                await page.screenshot({
                    path: outputFilePath,
                    type: INSTAGRAM_IMAGE_CONFIG.format as 'png',
                    fullPage: false,
                    omitBackground: false, // Solid background for Instagram
                    clip: {
                        x: 0,
                        y: 0,
                        width: INSTAGRAM_IMAGE_CONFIG.width,
                        height: INSTAGRAM_IMAGE_CONFIG.height
                    }
                });
                
                // Verify file was created and is valid
                const fileStats = await fs.stat(outputFilePath);
                logger.debug(`Generated image size: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`);
                
                // Instagram limit is 30MB, warn if getting close
                if (fileStats.size > 20 * 1024 * 1024) {
                    logger.warn(`Image size is large (${(fileStats.size / 1024 / 1024).toFixed(2)}MB). Instagram limit is 30MB.`);
                }
                
                renderedImages.push({
                    id: htmlContent.id,
                    filePath: outputFilePath,
                    width: INSTAGRAM_IMAGE_CONFIG.width,
                    height: INSTAGRAM_IMAGE_CONFIG.height,
                    aspectRatio: INSTAGRAM_IMAGE_CONFIG.aspectRatio
                });
                
                logger.debug(`Rendered image for template ${htmlContent.id} to ${outputFilePath}`);
            } catch (error) {
                logger.error(`Error rendering HTML for template ${htmlContent.id}:`, error);
                throw error;
            }
        }
        
        logger.info(`Successfully rendered ${renderedImages.length} images to ${outputDir}`);
        return renderedImages;
    } finally {
        // Close the browser
        await browser.close();
        logger.debug('Closed Puppeteer browser');
    }
}

/**
 * Cleanup temporary image files after they're no longer needed
 * @param images Array of rendered images to clean up
 * @param preserveImages Whether to preserve the images or clean them up
 */
export async function cleanupRenderedImages(images: RenderedImage[], preserveImages = false): Promise<void> {
    if (images.length === 0) return;
    
    // If preserveImages is true, don't clean up
    if (preserveImages) {
        logger.info(`Preserving images in: ${path.dirname(images[0].filePath)}`);
        return;
    }
    
    logger.debug(`Cleaning up ${images.length} temporary image files...`);
    
    for (const image of images) {
        try {
            await fs.unlink(image.filePath);
            logger.debug(`Deleted temporary file: ${image.filePath}`);
        } catch (error) {
            logger.warn(`Failed to delete temporary file ${image.filePath}:`, error);
            // Continue with other files, don't throw
        }
    }
    
    // Also try to remove the parent directory if it's empty
    try {
        const dirPath = path.dirname(images[0].filePath);
        await fs.rmdir(dirPath);
        logger.debug(`Removed temporary directory: ${dirPath}`);
    } catch (error) {
        logger.debug(`Could not remove temporary directory:`, error);
        // This is expected if the directory isn't empty, so just log at debug level
    }
} 