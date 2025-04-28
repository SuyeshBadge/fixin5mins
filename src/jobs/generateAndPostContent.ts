#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ContentGenerationService, EmotionalContentFormat } from '../services/contentGenerationService';
import { generateImage, ImageGenerationOptions } from '../services/imageGenerator';
import { postSingleImageToInstagram, InstagramPostConfig } from '../services/instagram-carousel';
import { RenderedImage } from '../services/html2image-puppeteer';
import { initializeCloudinary, uploadImageToCloudinary, deleteImageFromCloudinary } from '../services/cloudinary';
import config from '../config';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Command line options for the script
 */
interface CommandLineOptions {
  topic: string;
  templateId: string;
  skipPosting: boolean;
  forceGenerate: boolean;
  mockMode: boolean;
}

/**
 * Main function to run the content generation and posting process
 */
async function main() {
  try {
    logger.info('Starting content generation and posting process...');
    
    // Initialize Cloudinary
    initializeCloudinary();
    
    // Parse command line arguments
    const options = parseCommandLineArguments();
    
    let emotionalContent: EmotionalContentFormat;
    
    // Check if we should use mock data
    if (options.mockMode) {
      logger.info('Using mock data mode for content generation');
      emotionalContent = getMockContent(options.topic);
    } else {
      // Try to generate content with AI service
      try {
        // 1. Generate emotional content using the ContentGenerationService
        logger.info(`Generating emotional content for topic: "${options.topic}"`);
        const contentService = new ContentGenerationService();
        const contentResult = await contentService.generateEmotionalContent(options.topic);
        
        if (!contentResult.success || !contentResult.content) {
          throw new Error(`Failed to generate content: ${contentResult.error || 'Unknown error'}`);
        }
        
        emotionalContent = contentResult.content as EmotionalContentFormat;
      } catch (error: unknown) {
        logger.warn(`Failed to generate content with AI service: ${error instanceof Error ? error.message : String(error)}`);
        logger.info('Falling back to mock content');
        emotionalContent = getMockContent(options.topic);
      }
    }
    
    logger.info('Using emotional content:');
    logger.info(`Emotional Hook: ${emotionalContent.emotionalHook}`);
    logger.info(`Action Step: ${emotionalContent.actionStep}`);
    logger.info(`Emotional Reward: ${emotionalContent.emotionalReward}`);
    
    // 2. Generate image using the template system
    logger.info(`Generating image with template: ${options.templateId}`);
    const imageOptions: ImageGenerationOptions = {
      templateId: options.templateId,
      variables: {
        ...emotionalContent,
        handle: process.env.INSTAGRAM_HANDLE || 'fixin5mins',
        heading: 'Fix your life in 5 minutes',
        date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      }
    };
    
    const image = await generateImage(imageOptions);
    logger.info(`Successfully generated image: ${image.path}`);
    
    // Upload image to Cloudinary to get public URL
    const cloudinaryUrl = await uploadImageToCloudinary(image.path);
    logger.info(`Image uploaded to Cloudinary: ${cloudinaryUrl}`);

    // Store the Cloudinary public ID for later deletion
    // Extract the public ID from the URL
    const urlParts = cloudinaryUrl.split('/');
    const filenameWithExt = urlParts[urlParts.length - 1];
    const publicIdWithExt = urlParts.slice(urlParts.length - 2).join('/');
    const publicId = publicIdWithExt.split('.')[0]; // Remove file extension
    
    // 3. Post to Instagram (if not skipped)
    if (options.skipPosting) {
      logger.info('Skipping Instagram posting (--skip-posting flag provided)');
      logger.info(`Image generated at: ${image.path}`);
      logger.info(`Image hosted on Cloudinary at: ${cloudinaryUrl}`);
      return;
    }
    
    // Validate Instagram credentials
    if (!config.instagram.accessToken || !config.instagram.businessAccountId) {
      throw new Error('Instagram credentials missing. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in .env');
    }
    
    logger.info('Posting content to Instagram...');
    
    // Create rendered image object for the Instagram service
    const renderedImage: RenderedImage = {
      id: `${options.templateId}-${Date.now()}`,
      filePath: image.path,
      width: 1080,
      height: 1080,
      aspectRatio: 1.0
    };
    
    // Set up Instagram posting configuration
    const instagramConfig: InstagramPostConfig = {
      accessToken: config.instagram.accessToken,
      accountId: config.instagram.businessAccountId
    };
    
    // Build the caption
    const caption = `${emotionalContent.emotionalHook}\n\n${emotionalContent.actionStep}\n\n${emotionalContent.emotionalReward}`;
    
    // Define hashtags
    const hashtags = ['productivity', 'quicktips', 'fixin5mins', 'lifehack', 'selfimprovement'];
    
    // Post to Instagram as a single image instead of a carousel
    const postId = await postSingleImageToInstagram(
      renderedImage, 
      caption, 
      hashtags, 
      instagramConfig
    );
    
    logger.info(`Successfully posted to Instagram! Post ID: ${postId}`);

    // After successful posting, clean up the images
    await cleanupImages(image.path, publicId);
    
  } catch (error) {
    logger.error('Error in content generation and posting process:', error);
    process.exit(1);
  }
}

/**
 * Clean up local and Cloudinary images after successful posting
 * @param localImagePath Path to the local image file
 * @param cloudinaryPublicId Cloudinary public ID of the uploaded image
 */
async function cleanupImages(localImagePath: string, cloudinaryPublicId: string): Promise<void> {
  try {
    // Delete from Cloudinary
    logger.info(`Deleting image from Cloudinary (ID: ${cloudinaryPublicId})...`);
    await deleteImageFromCloudinary(cloudinaryPublicId);
    
    // Delete local file
    logger.info(`Deleting local image file: ${localImagePath}...`);
    await fs.promises.unlink(localImagePath);
    
    logger.info('Successfully cleaned up image files');
  } catch (error) {
    logger.warn(`Error during cleanup of image files: ${error instanceof Error ? error.message : String(error)}`);
    // Not letting cleanup errors affect the overall process success
  }
}

/**
 * Generate mock emotional content based on topic
 */
function getMockContent(topic: string): EmotionalContentFormat {
  // Basic content templates for different topics
  const templates: Record<string, EmotionalContentFormat> = {
    'productivity': {
      emotionalHook: 'Feeling overwhelmed by your to-do list?',
      actionStep: 'Spend 5 minutes prioritizing just your top 3 tasks for today.',
      emotionalReward: 'Experience immediate relief and clarity about what truly matters.'
    },
    'exercise': {
      emotionalHook: 'Finding it hard to fit workouts into your busy schedule?',
      actionStep: 'Try a 5-minute high-intensity interval routine right where you are.',
      emotionalReward: 'Feel energized and proud that you prioritized your health today.'
    },
    'mindfulness': {
      emotionalHook: 'Mind racing with too many thoughts?',
      actionStep: 'Take 5 minutes to focus only on your breathing—in for 4, hold for 4, out for 4.',
      emotionalReward: 'Return to your tasks with a calmer mind and renewed focus.'
    },
    'stress': {
      emotionalHook: 'Feeling tense and stressed out?',
      actionStep: 'Spend 5 minutes doing progressive muscle relaxation, tensing and releasing each muscle group.',
      emotionalReward: 'Experience immediate physical relief and a clearer mindset.'
    },
    'focus': {
      emotionalHook: 'Struggling to concentrate on important work?',
      actionStep: 'Set a 5-minute timer and work on just one task with zero distractions.',
      emotionalReward: 'Build momentum and break through the mental block that was holding you back.'
    }
  };
  
  // Return the template for the given topic or a generic one if not found
  if (templates[topic.toLowerCase()]) {
    return templates[topic.toLowerCase()];
  }
  
  // Generate a generic template based on the topic
  return {
    emotionalHook: `Feeling challenged with ${topic}?`,
    actionStep: `Take 5 minutes to write down one small step you can take today to improve your ${topic}.`,
    emotionalReward: `Gain confidence and direction in your ${topic} journey with this simple action.`
  };
}

/**
 * Parse command line arguments
 */
function parseCommandLineArguments(): CommandLineOptions {
  const args = process.argv.slice(2);
  
  // Set default options
  const options: CommandLineOptions = {
    topic: 'productivity',
    templateId: 'quote-red',
    skipPosting: false,
    forceGenerate: false,
    mockMode: false
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--topic' || arg === '-t') {
      options.topic = args[++i] || options.topic;
    }
    else if (arg === '--template' || arg === '-T') {
      options.templateId = args[++i] || options.templateId;
    }
    else if (arg === '--skip-posting' || arg === '-s') {
      options.skipPosting = true;
    }
    else if (arg === '--force' || arg === '-f') {
      options.forceGenerate = true;
    }
    else if (arg === '--mock' || arg === '-m') {
      options.mockMode = true;
    }
    else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  return options;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
Content Generation and Posting Script

Usage: npm run generate-and-post -- [options]

Options:
  --topic, -t       Topic for content generation (default: "productivity")
  --template, -T    Template ID to use (default: "quote-red")
  --skip-posting, -s Do not post to Instagram (default: false)
  --force, -f       Force content regeneration (default: false)
  --mock, -m        Use mock data instead of AI service (default: false)
  --help, -h        Show this help message

Examples:
  npm run generate-and-post -- --topic "time management"
  npm run generate-and-post -- --topic "stress reduction" --skip-posting
  npm run generate-and-post -- -t "exercise" -T "quote-red" --mock
  `);
}

// Run the main function
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main }; 