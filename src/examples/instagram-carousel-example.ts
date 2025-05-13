import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { renderHtmlToImages, HtmlContent } from '../services/html2image-puppeteer';
import { postCarouselToInstagram, InstagramPostConfig } from '../services/instagram.service';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

async function main() {
    logger.info('Running Instagram Carousel example...');

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
        // Create HTML content for carousel slides
        const htmlContents: HtmlContent[] = [
            {
                id: 'slide1',
                html: `
                <div style="width: 1080px; height: 1080px; background-color: #f7e4dd; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; font-family: Arial, sans-serif; text-align: center;">
                    <h1 style="font-size: 64px; margin-bottom: 30px; color: #d9534f;">5 Quick Productivity Tips</h1>
                    <h2 style="font-size: 48px; margin-bottom: 20px; color: #333;">Tip #1</h2>
                    <p style="font-size: 36px; line-height: 1.4; color: #666; max-width: 850px;">
                        Start your day by identifying your <strong style="color: #d9534f;">three most important tasks</strong> and tackle them first.
                    </p>
                    <div style="position: absolute; bottom: 40px; width: 90%; display: flex; justify-content: center;">
                        <p style="font-size: 24px; color: #888;">Swipe for more tips ➡️</p>
                    </div>
                </div>
                `
            },
            {
                id: 'slide2',
                html: `
                <div style="width: 1080px; height: 1080px; background-color: #fef9f7; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; font-family: Arial, sans-serif; text-align: center;">
                    <h2 style="font-size: 48px; margin-bottom: 20px; color: #333;">Tip #2</h2>
                    <p style="font-size: 36px; line-height: 1.4; color: #666; max-width: 850px;">
                        Use the <strong style="color: #d9534f;">Pomodoro Technique</strong> - work for 25 minutes, then take a 5-minute break to maintain focus and energy.
                    </p>
                    <div style="margin-top: 40px; border: 3px solid #d9534f; border-radius: 10px; padding: 20px; width: 80%;">
                        <p style="font-size: 32px; color: #d9534f;">Did you know?</p>
                        <p style="font-size: 28px; color: #666;">The technique was developed by Francesco Cirillo in the late 1980s.</p>
                    </div>
                </div>
                `
            },
            {
                id: 'slide3',
                html: `
                <div style="width: 1080px; height: 1080px; background-color: #f7e4dd; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; font-family: Arial, sans-serif; text-align: center;">
                    <h2 style="font-size: 48px; margin-bottom: 20px; color: #333;">Tip #3</h2>
                    <p style="font-size: 36px; line-height: 1.4; color: #666; max-width: 850px;">
                        <strong style="color: #d9534f;">Batch similar tasks</strong> together to reduce context switching and increase efficiency.
                    </p>
                    <div style="background-color: #fff; border-radius: 10px; padding: 20px; margin-top: 40px; width: 80%;">
                        <p style="font-size: 28px; color: #666; text-align: left;">
                            Examples:<br>
                            ✅ Process all emails at specific times<br>
                            ✅ Make all phone calls together<br>
                            ✅ Prepare meals for the week in one session
                        </p>
                    </div>
                </div>
                `
            }
        ];

        // Render the HTML to images
        logger.info('Rendering carousel HTML to images...');
        const outputDir = path.join('./temp', `instagram-carousel-${Date.now()}`);
        
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const images = await renderHtmlToImages(htmlContents, { 
            outputDir, 
            preserveImages: true
        });

        if (!images.length) {
            throw new Error('Failed to render carousel images');
        }

        logger.info(`Successfully rendered ${images.length} carousel images`);

        // Post the carousel to Instagram
        const caption = '5 simple productivity tips you can implement right now to boost your efficiency! 💪 #productivity #timemanagement #lifehacks';
        const hashtags = ['productivity', 'timemanagement', 'lifehacks', 'efficiency', 'fixin5mins'];

        logger.info('Posting carousel to Instagram...');
        const postId = await postCarouselToInstagram(
            images,
            caption,
            hashtags,
            instagramConfig
        );

        logger.info(`Successfully posted carousel to Instagram! Post ID: ${postId}`);
    } catch (error: any) {
        logger.error('Error in Instagram carousel example:', error.message);
    }
}

// Run the example
main().catch(error => {
    logger.error('Unhandled error:', error);
}); 