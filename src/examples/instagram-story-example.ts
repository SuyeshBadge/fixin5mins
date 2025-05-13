import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { renderHtmlToImages, HtmlContent } from '../services/html2image-puppeteer';
import { postImageStoryToInstagram, InstagramPostConfig } from '../services/instagram.service';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

async function main() {
    logger.info('Running Instagram Story example...');

    // Check environment configuration
    const instagramConfig: InstagramPostConfig = {
        accessToken: process.env.INSTAGRAM_GRAPH_ACCESS_TOKEN || '',
        accountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
        skipPosting: process.env.SKIP_INSTAGRAM_POSTING === 'true'
    };

    if (!instagramConfig.accessToken || !instagramConfig.accountId) {
        logger.error('Instagram credentials not configured. Please set INSTAGRAM_GRAPH_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env');
        return;
    }

    try {
        // Create an HTML story content with 9:16 aspect ratio for Instagram stories
        const storyHtml: HtmlContent = {
            id: 'example-story',
            html: `
            <div style="width: 1080px; height: 1920px; background: linear-gradient(135deg, #8a2387, #e94057, #f27121); display: flex; flex-direction: column; justify-content: center; align-items: center; color: white; font-family: Arial, sans-serif; text-align: center; padding: 40px; box-sizing: border-box;">
                <div style="margin-bottom: 40px;">
                    <h1 style="font-size: 72px; margin-bottom: 20px; text-shadow: 2px 2px 10px rgba(0,0,0,0.3);">Fix In 5 Minutes</h1>
                    <h2 style="font-size: 48px; margin-top: 0; font-weight: 300; text-shadow: 2px 2px 10px rgba(0,0,0,0.2);">Instagram Story Example</h2>
                </div>
                
                <div style="background-color: rgba(255,255,255,0.2); border-radius: 20px; padding: 40px; margin-bottom: 40px; backdrop-filter: blur(5px); width: 80%;">
                    <p style="font-size: 36px; line-height: 1.5;">Quick tips to boost your productivity today:</p>
                    <ul style="font-size: 32px; text-align: left; line-height: 1.6;">
                        <li>Set your 3 most important tasks first thing in the morning</li>
                        <li>Take a 5-minute break every 25 minutes</li>
                        <li>Drink water regularly throughout the day</li>
                        <li>Turn off notifications during focused work</li>
                    </ul>
                </div>
                
                <div style="font-size: 28px; opacity: 0.9;">
                    <p>Swipe up for more productivity tips!</p>
                </div>
            </div>
            `
        };

        // Render the HTML to an image
        logger.info('Rendering story HTML to image...');
        const outputDir = path.join('./temp', `instagram-story-example-${Date.now()}`);
        
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const images = await renderHtmlToImages([storyHtml], { 
            outputDir, 
            preserveImages: true
        });

        if (!images.length) {
            throw new Error('Failed to render story image');
        }

        logger.info(`Story image rendered at: ${images[0].filePath}`);

        // Post the story to Instagram
        logger.info('Posting story to Instagram...');
        const postId = await postImageStoryToInstagram(
            images[0],
            instagramConfig
        );

        logger.info(`Successfully posted story to Instagram! Post ID: ${postId}`);
    } catch (error: any) {
        logger.error('Error in Instagram story example:', error.message);
    }
}

// Run the example
main().catch(error => {
    logger.error('Unhandled error:', error);
}); 