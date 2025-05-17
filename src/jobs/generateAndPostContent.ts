#!/usr/bin/env node
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { ContentGenerationService, EmotionalContentFormat } from '../services/contentGenerationService';
import { generateImage, ImageGenerationOptions } from '../services/imageGenerator';
import { postSingleImageToInstagram, InstagramPostConfig } from '../services/instagram.service';
import { RenderedImage } from '../services/html2image-puppeteer';
import { initializeCloudinary, uploadImageToCloudinary, deleteImageFromCloudinary } from '../services/cloudinary';
import topicCache from '../services/topicCache';
import config from '../config';
import { templateConfig } from '../config/templateConfig';
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

    // Retrieve the template configuration
    const currentTemplate = templateConfig[options.templateId];
    if (!currentTemplate) {
      throw new Error(`Template configuration for ${options.templateId} not found.`);
    }

    const variablesForTemplate: { [key: string]: any } = {};

    if (currentTemplate.contentMapping) {
      logger.info(`Using contentMapping for template ${options.templateId}`);
      for (const [templateVar, contentSourceKey] of Object.entries(currentTemplate.contentMapping)) {
        switch (contentSourceKey) {
          case 'emotionalHook':
            variablesForTemplate[templateVar] = emotionalContent.emotionalHook;
            break;
          case 'actionStep':
            variablesForTemplate[templateVar] = emotionalContent.actionStep;
            break;
          case 'emotionalReward':
            variablesForTemplate[templateVar] = emotionalContent.emotionalReward;
            break;
          case 'topic':
            variablesForTemplate[templateVar] = options.topic;
            break;
          // Add more cases here if ContentGenerationService is enhanced for other content types
          default:
            // Check if contentSourceKey is a valid key of EmotionalContentFormat before accessing
            if (contentSourceKey in emotionalContent) {
              variablesForTemplate[templateVar] = emotionalContent[contentSourceKey as keyof EmotionalContentFormat];
            } else {
              logger.warn(`Unknown contentSourceKey or key not in EmotionalContentFormat: ${contentSourceKey} for template variable ${templateVar}`);
            }
        }
      }
    } else {
      // Fallback for templates without contentMapping (old behavior)
      logger.info(`No contentMapping found for ${options.templateId}, using direct assignment.`);
      variablesForTemplate.emotionalHook = emotionalContent.emotionalHook;
      variablesForTemplate.actionStep = emotionalContent.actionStep;
      variablesForTemplate.emotionalReward = emotionalContent.emotionalReward;
    }

    const imageGenerationVariables = {
      ...variablesForTemplate,
      handle: process.env.INSTAGRAM_HANDLE || 'fixin5mins',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      // Add any other truly common variables all templates might use or get defaults for
    };

    const imageOptions: ImageGenerationOptions = {
      templateId: options.templateId,
      variables: imageGenerationVariables
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
  const defaultHashtags = ['progress', 'growth', 'smallsteps', 'fixin5mins', 'selfimprovement'];
  
  // Topic-specific templates with authentic elements
  if (topic.toLowerCase() === 'productivity') {
    return {
      emotionalHook: 'Ever find yourself stuck in planning mode instead of actually doing the work?',
      actionStep: 'Choose one important task and commit to just 5 minutes of focused work on it with no distractions.',
      emotionalReward: 'Feel the momentum and clarity that comes from breaking through the initial resistance barrier.',
      caption: 'Our brains are wired to resist uncertainty and complexity. The 5-minute commitment trick works because it makes starting manageable, activating the part of your brain that craves completion.',
      hashtags: ['productivity', 'focus', 'momentum', 'procrastination', 'fixin5mins'],
      
      // Enhanced elements
      patternInterruptHook: 'Ever find yourself stuck in planning mode instead of actually doing the work?',
      contentPromise: 'A psychological trick to break through initial task resistance',
      unexpectedTwist: 'Starting is much harder than continuing, which is why short commitments work so well',
      socialProofElement: 'This approach leverages the Zeigarnik effect - our brain\'s natural desire to complete what we\'ve started',
      urgencyTrigger: 'Each day, our most important tasks face the strongest psychological resistance',
      saveReason: 'Save this for when you\'re feeling stuck on an important project you keep avoiding'
    };
  }
  
  if (topic.toLowerCase() === 'exercise') {
    return {
      emotionalHook: 'Do you skip workouts because they feel overwhelming or you "don\'t have enough time"?',
      actionStep: 'Choose a simple movement you enjoy and commit to just 5 minutes today, no changing clothes required.',
      emotionalReward: 'Experience the energy shift and sense of accomplishment that comes from honoring a small commitment to yourself.',
      caption: 'The biggest barrier to exercise isn\'t physical, it\'s mental. This micro-commitment approach gets you past the resistance that keeps us inactive, building momentum for consistent movement.',
      hashtags: ['exercise', 'movement', 'momentum', 'healthyhabits', 'fixin5mins'],
      
      // Enhanced elements
      patternInterruptHook: 'Do you skip workouts because they feel overwhelming or you "don\'t have enough time"?',
      contentPromise: 'A simple approach to building exercise consistency when motivation is low',
      unexpectedTwist: 'Perfect workout plans often fail while imperfect micro-commitments succeed',
      socialProofElement: 'Behavioral psychology shows that small, consistent actions are more effective than occasional intense efforts',
      urgencyTrigger: 'Each day we spend inactive makes starting again slightly harder',
      saveReason: 'Save this for those days when exercise feels impossible but you want to stay consistent'
    };
  }
  
  if (topic.toLowerCase() === 'mindfulness') {
    return {
      emotionalHook: 'Feeling like your mind is constantly racing from one thought to the next?',
      actionStep: 'Pause for 5 minutes and simply notice your breath - each inhale and exhale - returning gently when your mind wanders.',
      emotionalReward: 'Create a moment of mental space and calm in the midst of a busy day.',
      caption: 'Mindfulness isn\'t about having no thoughts—it\'s about changing your relationship with them. This simple breath awareness practice is a gateway to being present, even for beginners.',
      hashtags: ['mindfulness', 'presence', 'breathwork', 'awareness', 'fixin5mins'],
      
      // Enhanced elements
      patternInterruptHook: 'Feeling like your mind is constantly racing from one thought to the next?',
      contentPromise: 'A simple entry point to mindfulness that requires no special skills',
      unexpectedTwist: 'The goal isn\'t to clear your mind but to notice your experience without judgment',
      socialProofElement: 'This foundational practice appears in virtually every evidence-based mindfulness program',
      urgencyTrigger: 'Each moment of awareness creates a tiny pause that can shift your entire day',
      saveReason: 'Save this for when your mind feels scattered and overwhelmed'
    };
  }
  
  if (topic.toLowerCase() === 'stress') {
    return {
      emotionalHook: 'When stress hits, does your body tense up while your mind races through worst-case scenarios?',
      actionStep: 'Place one hand on your chest, one on your stomach, and take 5 deep belly breaths, counting to 4 on each inhale and exhale.',
      emotionalReward: 'Feel your nervous system begin to settle as you activate your body\'s natural calming response.',
      caption: 'Stress isn\'t just mental - it\'s a full-body experience. This simple breathing technique works because it directly signals your nervous system to move from fight-or-flight to a calmer state.',
      hashtags: ['stress', 'breathwork', 'nervousystem', 'calm', 'fixin5mins'],
      
      // Enhanced elements
      patternInterruptHook: 'When stress hits, does your body tense up while your mind races through worst-case scenarios?',
      contentPromise: 'A physiological reset button that helps calm your stress response in moments',
      unexpectedTwist: 'Trying to think your way out of stress often makes it worse - your body holds the key',
      socialProofElement: 'This breathing pattern activates the vagus nerve, which research shows helps regulate stress',
      urgencyTrigger: 'Having a simple physical tool ready before stress hits makes all the difference',
      saveReason: 'Save this for your next stressful moment - it\'s simple enough to remember when overwhelmed'
    };
  }
  
  if (topic.toLowerCase() === 'focus') {
    return {
      emotionalHook: 'Do you struggle to stay focused in a world of constant notifications and distractions?',
      actionStep: 'Set a timer for 5 minutes of fully focused work with your phone in another room and your notifications turned off.',
      emotionalReward: 'Experience what it feels like to give your complete attention to one task without fragmentation.',
      caption: 'Our attention is increasingly fractured in the digital age. This simple distraction-free period helps rebuild your focus muscles and shows you what deep attention feels like.',
      hashtags: ['focus', 'deepwork', 'attention', 'productivity', 'fixin5mins'],
      
      // Enhanced elements
      patternInterruptHook: 'Do you struggle to stay focused in a world of constant notifications and distractions?',
      contentPromise: 'A simple practice to rebuild your capacity for sustained attention',
      unexpectedTwist: 'Short periods of complete focus build more capacity than long stretches of partial attention',
      socialProofElement: 'Research on attention restoration shows that even brief focus periods can rebuild concentration',
      urgencyTrigger: 'Each day of fragmented attention makes deep focus more difficult',
      saveReason: 'Save this for the next time you need to do important work that requires your full attention'
    };
  }
  
  // Generate a generic template based on the topic with authentic elements
  const cleanTopicTag = topic.toLowerCase().replace(/\s+/g, '');
  const genericHashtags = ['selfimprovement', 'growth', 'progress', 'smallsteps', 'fixin5mins'];
  
  // Add the topic as a hashtag if it's not empty
  if (cleanTopicTag) {
    genericHashtags.push(cleanTopicTag);
  }
  
  return {
    emotionalHook: `Finding it challenging to make progress with ${topic} despite your best efforts?`,
    actionStep: `Take 5 minutes to write down one small, specific step you could take today with ${topic}.`,
    emotionalReward: `Experience the clarity and motivation that comes from having a concrete next action.`,
    caption: `When we're stuck with ${topic}, we often think we need more information or resources. But usually, we just need a clear, specific next step to get moving again.`,
    hashtags: genericHashtags,
    
    // Enhanced elements
    patternInterruptHook: `Finding it challenging to make progress with ${topic} despite your best efforts?`,
    contentPromise: `A simple clarity exercise that helps you get unstuck with ${topic}`,
    unexpectedTwist: `Progress with ${topic} rarely comes from having the perfect plan, but from taking imperfect action`,
    socialProofElement: `This approach is based on research showing that clarity and specificity are key motivational factors`,
    urgencyTrigger: `The longer we stay stuck thinking about ${topic} without acting, the harder it becomes to start`,
    saveReason: `Save this for when you're feeling overwhelmed or confused about next steps with ${topic}`
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
    else if (arg === '--template' || arg === '-T' || arg === '--templateId') {
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
  --template, -T, --templateId Template ID to use (default: "quote-red")
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