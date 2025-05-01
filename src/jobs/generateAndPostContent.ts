#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ContentGenerationService, EmotionalContentFormat } from '../services/contentGenerationService';
import { generateImage, ImageGenerationOptions } from '../services/imageGenerator';
import { postSingleImageToInstagram, InstagramPostConfig } from '../services/instagram-carousel';
import { RenderedImage } from '../services/html2image-puppeteer';
import { initializeCloudinary, uploadImageToCloudinary, deleteImageFromCloudinary } from '../services/cloudinary';
import topicCache from '../services/topicCache';
import config from '../config';
import logger from '../utils/logger';

// Load environment variables
dotenv.config();

/**
 * Command line options for the script
 */
interface CommandLineOptions {
  topic: string;
  category: string;
  templateId: string;
  skipPosting: boolean;
  forceGenerate: boolean;
  mockMode: boolean;
  listCategories: boolean;
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
    
    // If user requested to list categories, show them and exit
    if (options.listCategories) {
      listAvailableCategories();
      return;
    }
    
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
    
    // 3. Post to Instagram (if not skipped)
    if (options.skipPosting) {
      logger.info('Skipping Instagram posting (--skip-posting flag provided)');
      logger.info(`Image generated at: ${image.path}`);
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
    let caption = '';
    let hashtags: string[] = [];
    
    // Use the AI-generated caption if available
    if (emotionalContent.caption) {
      caption = emotionalContent.caption;
      logger.info(`Using AI-generated caption: "${caption}"`);
    } else {
      // Fall back to default caption structure if AI didn't provide one
      caption = `${emotionalContent.emotionalHook}\n\n${emotionalContent.actionStep}\n\n${emotionalContent.emotionalReward}`;
      logger.info(`No AI-generated caption available, building from content: "${caption}"`);
    }
    
    // Use the AI-generated hashtags if available
    if (emotionalContent.hashtags && emotionalContent.hashtags.length > 0) {
      hashtags = emotionalContent.hashtags;
      logger.info(`Using AI-generated hashtags: ${hashtags.join(', ')}`);
    } else {
      // Fall back to default hashtags if AI didn't provide any
      hashtags = ['productivity', 'quicktips', 'fixin5mins', 'lifehack', 'selfimprovement'];
      logger.info(`No AI-generated hashtags available, using defaults: ${hashtags.join(', ')}`);
    }
    
    // Post to Instagram as a single image instead of a carousel
    const postId = await postSingleImageToInstagram(
      renderedImage, 
      caption, 
      hashtags, 
      instagramConfig
    );
    
    logger.info(`Successfully posted to Instagram! Post ID: ${postId}`);

    // Delete local file after successful posting
    try {
      const imagePath = image.path;
      const imageDir = path.dirname(imagePath);
      
      // 1. Delete the image file
      logger.info(`Deleting local image file: ${imagePath}...`);
      await fs.promises.unlink(imagePath);
      logger.info('Successfully cleaned up local image file');
      
      // 2. Check if the directory is empty and delete it if it is
      const dirContents = await fs.promises.readdir(imageDir);
      
      if (dirContents.length === 0) {
        logger.info(`Deleting empty directory: ${imageDir}...`);
        try {
          await fs.promises.rmdir(imageDir);
          logger.info('Successfully removed empty directory');
        } catch (dirError) {
          logger.warn(`Could not delete directory: ${dirError instanceof Error ? dirError.message : String(dirError)}`);
        }
      } else {
        logger.info(`Directory ${imageDir} is not empty, skipping deletion.`);
      }
    } catch (error) {
      logger.warn(`Error during cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    logger.error('Error in content generation and posting process:', error);
    process.exit(1);
  }
}

/**
 * List all available categories and their descriptions
 */
function listAvailableCategories() {
  console.log(`
Available Topic Categories:
--------------------------
productivity      : Efficiency, task management, and getting things done
mindfulness       : Awareness, presence, and mental practices
physical_health   : Exercise, nutrition, and bodily wellbeing
mental_health     : Emotional wellness, psychology, and personal stability
relationships     : Interpersonal connections and social skills
career           : Professional growth and workplace success
learning         : Knowledge acquisition and cognitive skills
creativity       : Artistic expression and innovative thinking
financial        : Money management and financial wellbeing
personal_growth  : Self-improvement and character development

Use --category or -c followed by the category name to select a topic from a specific category.
Example: npm run generate-and-post -- --category mindfulness
  `);
}

/**
 * Generate mock emotional content based on topic
 */
function getMockContent(topic: string): EmotionalContentFormat {
  // Basic content templates for different topics
  const defaultHashtags = ['productivity', 'quicktips', 'fixin5mins', 'lifehack', 'selfimprovement'];
  
  // Topic-specific templates with enhanced viral elements
  if (topic.toLowerCase() === 'productivity') {
    return {
      emotionalHook: '91% of to-do lists fail because they ignore the biology of focus.',
      actionStep: 'Choose ONE task, set a timer for exactly 5 minutes of focused work with your phone in another room.',
      emotionalReward: 'Experience the momentum that breaks through procrastination faster than any motivational quote.',
      caption: 'Your to-do list is working against your brain\'s natural focus systems. This micro-commitment technique bypasses the resistance that keeps you stuck. Save this for the next time you feel stuck on a big project!',
      hashtags: ['productivity', 'neuroscience', 'focusmethod', 'procrastination', 'deepwork', 'fixin5mins'],
      
      // Enhanced viral elements
      patternInterruptHook: '91% of to-do lists fail because they ignore the biology of focus.',
      contentPromise: 'Learn the 5-minute micro-commitment technique that elite performers use',
      unexpectedTwist: 'Starting with your easiest task actually decreases overall productivity by 23%',
      socialProofElement: 'Stanford research shows this approach increases completion rates by 83% for complex projects',
      urgencyTrigger: 'Every day of delay reinforces the neural pathways of procrastination',
      saveReason: 'Save this technique for the next time you\'re feeling stuck on an important project'
    };
  }
  
  if (topic.toLowerCase() === 'exercise') {
    return {
      emotionalHook: 'Exercise effectiveness is 71% mental programming, only 29% physical effort.',
      actionStep: 'Before your workout, spend 5 minutes visualizing yourself completing it with perfect form and energy.',
      emotionalReward: 'Transform your results by tapping into the neural pathways that elite athletes use to maximize performance.',
      caption: 'The difference between showing up and showing out is mental preparation. This 5-minute pre-workout ritual activates the same brain regions used by Olympic athletes. Try it before your next session!',
      hashtags: ['exercisescience', 'performancehack', 'neuroscienceoffitness', 'mentaltraining', 'workoutmotivation', 'fixin5mins'],
      
      // Enhanced viral elements
      patternInterruptHook: 'Exercise effectiveness is 71% mental programming, only 29% physical effort.',
      contentPromise: 'Discover the 5-minute pre-workout mental routine used by elite athletes',
      unexpectedTwist: 'Starting your workout without mental priming reduces results by up to 35%',
      socialProofElement: 'Sports psychologists at Olympic training centers use this exact technique with gold medalists',
      urgencyTrigger: 'Each workout without mental priming is a missed opportunity for neurological adaptation',
      saveReason: 'Save this for your next workout to instantly improve your performance'
    };
  }
  
  if (topic.toLowerCase() === 'mindfulness') {
    return {
      emotionalHook: 'Your brain processes 6,000 thoughts daily but remembers only 5% of them.',
      actionStep: 'Set a 5-minute timer and write down every thought that comes to mind without judgment.',
      emotionalReward: 'Break the cycle of mental overwhelm and discover what\'s actually important beneath the noise.',
      caption: 'Mental clarity isn\'t about having no thoughts—it\'s about knowing which ones deserve your attention. Try this research-backed exercise to cut through the mental static.',
      hashtags: ['mindfulness', 'mentalhealth', 'brainhack', 'focustips', 'clarity', 'fixin5mins'],
      
      // Enhanced viral elements
      patternInterruptHook: 'Your brain processes 6,000 thoughts daily but remembers only 5% of them.',
      contentPromise: 'Discover the neuroscience-backed 5-minute thought download technique',
      unexpectedTwist: 'Trying to "clear your mind" actually increases thought volume by 34%',
      socialProofElement: 'Harvard neuroscientists found this technique reduces cortisol levels by 27% in just one session',
      urgencyTrigger: 'Each day of rumination reinforces neural pathways that keep you stuck',
      saveReason: 'Save for the next time you feel mentally scattered or overwhelmed'
    };
  }
  
  if (topic.toLowerCase() === 'stress') {
    return {
      emotionalHook: 'Stress doesn\'t start in your mind—it begins in your nervous system, according to neuroscience.',
      actionStep: 'Place one hand on your chest, one on your stomach, and take 5 deep belly breaths counting 4-7-8.',
      emotionalReward: 'Feel your nervous system shift from fight-or-flight to rest-and-digest in under 300 seconds.',
      caption: 'Trying to "think" your way out of stress is like trying to put out a fire with gasoline. This physiological reset button works when nothing else will.',
      hashtags: ['stressrelief', 'nervousystem', 'vagalresponse', 'breathwork', 'neurohack', 'fixin5mins'],
      
      // Enhanced viral elements
      patternInterruptHook: 'Stress doesn\'t start in your mind—it begins in your nervous system, according to neuroscience.',
      contentPromise: 'Learn the physiological "reset button" that works when meditation fails',
      unexpectedTwist: 'Trying to rationalize your way out of stress actually increases cortisol by 43%',
      socialProofElement: 'Used by combat veterans with 87% reporting immediate symptom reduction',
      urgencyTrigger: 'Each stress spike without intervention strengthens the neural stress circuit',
      saveReason: 'Save for your next stress spike—it works faster than medication'
    };
  }
  
  if (topic.toLowerCase() === 'focus') {
    return {
      emotionalHook: 'The average person is interrupted every 8 minutes but needs 23 minutes to refocus.',
      actionStep: 'Create a "focus trigger" by placing a small object on your desk that signals to your brain it\'s deep work time.',
      emotionalReward: 'Reclaim hours of lost productivity by training your brain to enter flow state on command.',
      caption: 'Your focus is your most valuable asset, yet most people have no system to protect it. This simple anchor technique creates a powerful psychological boundary against distractions.',
      hashtags: ['deepwork', 'flowstate', 'productivityhack', 'focustrap', 'brainhack', 'fixin5mins'],
      
      // Enhanced viral elements
      patternInterruptHook: 'The average person is interrupted every 8 minutes but needs 23 minutes to refocus.',
      contentPromise: 'Learn the "focus anchor" technique that Silicon Valley executives use to 10x productivity',
      unexpectedTwist: 'Willpower-based focus strategies fail 89% of the time due to limited cognitive resources',
      socialProofElement: 'Cal Newport\'s research at Georgetown found this method increases deep work capacity by 37%',
      urgencyTrigger: 'Each day of scattered attention strengthens distraction neural pathways',
      saveReason: 'Save this technique for the next time you need to do high-value, distraction-free work'
    };
  }
  
  // Generate a generic template based on the topic with viral elements
  const cleanTopicTag = topic.toLowerCase().replace(/\s+/g, '');
  const genericHashtags = ['selfimprovement', 'personalgrowth', 'habits', 'mindset', 'fixin5mins'];
  
  // Add the topic as a hashtag if it's not empty
  if (cleanTopicTag) {
    genericHashtags.push(cleanTopicTag);
  }
  
  return {
    emotionalHook: `90% of people struggle with ${topic} because they're missing a critical insight.`,
    actionStep: `Take 5 minutes to write down your biggest ${topic} challenge, then circle the parts you can control in blue.`,
    emotionalReward: `Gain immediate clarity by separating what's actionable from what's just mental noise.`,
    caption: `Most ${topic} advice ignores the psychology of change. This simple clarity exercise cuts through the confusion and gives you a clear first step.`,
    hashtags: genericHashtags,
    
    // Enhanced viral elements
    patternInterruptHook: `90% of people struggle with ${topic} because they're missing a critical insight.`,
    contentPromise: `Learn the 5-minute clarity technique that transforms how you approach ${topic}`,
    unexpectedTwist: `Most ${topic} problems come from focusing on solutions before gaining clarity`,
    socialProofElement: `Psychological research shows this approach increases success rates by 340%`,
    urgencyTrigger: `Each day spent unclear about your ${topic} challenge compounds feelings of overwhelm`,
    saveReason: `Save this for the next time you feel stuck with ${topic} challenges`
  };
}

/**
 * Parse command line arguments
 */
function parseCommandLineArguments(): CommandLineOptions {
  const args = process.argv.slice(2);
  
  // Set default options
  const options: CommandLineOptions = {
    topic: '', // Will be populated with LRU topic if not provided
    category: '', // Will use LRU category if not provided
    templateId: 'quote-red',
    skipPosting: false,
    forceGenerate: false,
    mockMode: false,
    listCategories: false
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--topic' || arg === '-t') {
      options.topic = args[++i] || '';
    }
    else if (arg === '--category' || arg === '-c') {
      options.category = args[++i] || '';
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
    else if (arg === '--list-categories' || arg === '-l') {
      options.listCategories = true;
    }
    else if (arg === '--help' || arg === '-h') {
      showHelp();
      process.exit(0);
    }
  }
  
  // Topic selection logic with category support
  if (!options.topic) {
    if (options.category) {
      // If category is provided but no topic, get LRU topic from that category
      try {
        // Use the dedicated method to get a topic from a specific category
        options.topic = topicCache.getLeastRecentlyUsedTopicFromCategory(options.category);
        logger.info(`Using least recently used topic from category "${options.category}": "${options.topic}"`);
      } catch (error) {
        logger.warn(`Error getting topic from category "${options.category}": ${error instanceof Error ? error.message : String(error)}`);
        options.topic = topicCache.getLeastRecentlyUsedTopic();
        logger.info(`Falling back to overall least recently used topic: "${options.topic}"`);
      }
    } else {
      // If no topic and no category, first get the LRU category, then get the LRU topic from that category
      const leastUsedCategory = topicCache.getLeastRecentlyUsedCategory(true);
      try {
        options.topic = topicCache.getLeastRecentlyUsedTopicFromCategory(leastUsedCategory);
        logger.info(`No topic or category provided, using least recently used topic from least recently used category "${leastUsedCategory}": "${options.topic}"`);
      } catch (error) {
        // Fallback to the default behavior if something goes wrong
        logger.warn(`Error getting topic from LRU category "${leastUsedCategory}": ${error instanceof Error ? error.message : String(error)}`);
        options.topic = topicCache.getLeastRecentlyUsedTopic();
        logger.info(`Falling back to overall least recently used topic: "${options.topic}"`);
      }
    }
  } else {
    // Update the topic usage in the cache
    topicCache.updateTopicUsage(options.topic);
    logger.info(`Using provided topic: "${options.topic}"`);
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
  --topic, -t              Topic for content generation (if not provided, uses least recently used topic)
  --category, -c           Category to select topic from (e.g., productivity, mindfulness)
  --list-categories, -l    List all available topic categories
  --template, -T           Template ID to use (default: "quote-red")
  --skip-posting, -s       Do not post to Instagram (default: false)
  --force, -f              Force content regeneration (default: false)
  --mock, -m               Use mock data instead of AI service (default: false)
  --help, -h               Show this help message

Examples:
  npm run generate-and-post -- --topic "time management"
  npm run generate-and-post -- --category "mindfulness"
  npm run generate-and-post -- --topic "stress reduction" --skip-posting
  npm run generate-and-post -- -t "exercise" -T "quote-red" --mock
  npm run generate-and-post -- # Uses LRU topic from LRU category
  npm run generate-and-post -- --list-categories
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