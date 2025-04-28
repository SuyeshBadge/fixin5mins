import { AiServiceClient } from './services/aiService';
import { generateImage, ImageGenerationOptions } from './services/imageGenerator';
import { generateInstagramPost, generateQuoteImage } from './services/html2image';
import { postImageToInstagram, InstagramPostOptions } from './services/instagram';
import config from './config';
import fs from 'fs';
import path from 'path';

// Make sure we have our credentials
if (!config.aiService.apiKey) {
  console.error('AI Service API key is missing. Please set AI_SERVICE_API_KEY in your .env file.');
  process.exit(1);
}

if (!config.instagram.accessToken || !config.instagram.businessAccountId) {
  console.error('Instagram credentials are missing. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID in your .env file.');
  process.exit(1);
}

// Create our output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'generated');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create an instance of the AI service client
const aiClient = new AiServiceClient(config.aiService.baseUrl);

// Define content types for generation
export type ContentType = 'ai-image' | 'html-post' | 'quote';

// Define some theme ideas for content generation
const themeIdeas = [
  'sunset over mountains',
  'cute puppies',
  'minimalist workspace',
  'fruits arrangement',
  'motivational quote',
  'urban cityscape at night'
];

// Get a random theme idea
const getRandomTheme = (): string => {
  const randomIndex = Math.floor(Math.random() * themeIdeas.length);
  return themeIdeas[randomIndex];
};

/**
 * Main function to generate and post content to Instagram
 */
async function generateAndPostContent(options: {
  theme?: string;
  prompt?: string;
  contentType?: ContentType;
  title?: string;
  content?: string;
  enhancePrompt?: boolean;
  skipPosting?: boolean;
}): Promise<void> {
  try {
    const { 
      theme = getRandomTheme(), 
      prompt, 
      contentType = 'html-post',
      title,
      content,
      enhancePrompt = true, 
      skipPosting = false 
    } = options;
    
    console.log(`Working with theme: "${theme}" and content type: "${contentType}"`);
    
    // Generate the image based on content type
    let imagePath: string;
    let captionText: string;
    
    switch (contentType) {
      case 'ai-image':
        // 1. Generate or enhance the image prompt if not directly provided
        let imagePrompt: string;
        if (prompt) {
          imagePrompt = prompt;
          console.log(`Using provided prompt: "${imagePrompt}"`);
        } else {
          console.log('Generating detailed image prompt from theme...');
          imagePrompt = await aiClient.generateImagePrompt(theme);
          console.log(`Generated image prompt: "${imagePrompt}"`);
        }

        // 2. Generate the image using AI
        console.log('Generating AI image...');
        const imageOptions: ImageGenerationOptions = {
          prompt: imagePrompt,
          size: '1024x1024',
          style: 'vivid',
          enhancePrompt: false // We've already enhanced it if needed
        };
        
        const image = await generateImage(imageOptions);
        imagePath = image.path;
        captionText = await aiClient.generateCaption(imagePrompt);
        break;
        
      case 'html-post':
        // Generate a post with title and content using HTML
        let postTitle: string;
        let postContent: string;
        
        if (title && content) {
          postTitle = title;
          postContent = content;
        } else {
          // Generate title and content based on theme
          console.log('Generating title and content from theme...');
          const titlePrompt = `Create a short, catchy title for an Instagram post about: ${theme}`;
          postTitle = await aiClient.generateContent(
            titlePrompt,
            'openai:gpt-4',
            'You are a social media content creator. Create an engaging title in 5-7 words.'
          );
          
          const contentPrompt = `Write a short paragraph about ${theme} for Instagram. Keep it under 50 words.`;
          postContent = await aiClient.generateContent(
            contentPrompt,
            'openai:gpt-4',
            'You are a social media content creator.'
          );
        }
        
        console.log(`Title: "${postTitle}"`);
        console.log(`Content: "${postContent}"`);
        
        // Generate the image from HTML
        console.log('Generating HTML post image...');
        imagePath = await generateInstagramPost(postTitle, postContent);
        captionText = postContent + '\n\n' + await aiClient.generateContent(
          `Generate 3-5 hashtags for an Instagram post about: ${theme}`,
          'openai:gpt-4',
          'You are a social media content creator. Output only the hashtags.'
        );
        break;
        
      case 'quote':
        // Generate a quote image
        console.log('Generating quote...');
        const quotePrompt = `Generate an inspiring quote about ${theme}. Keep it under 15 words.`;
        const quote = await aiClient.generateContent(
          quotePrompt,
          'openai:gpt-4',
          'You are a motivational speaker. Create an inspiring quote without attribution.'
        );
        
        console.log(`Quote: "${quote}"`);
        
        // Generate the quote image
        console.log('Generating quote image...');
        imagePath = await generateQuoteImage(quote);
        
        captionText = `"${quote}" \n\n` + await aiClient.generateContent(
          `Generate 3-5 hashtags for an inspirational quote about: ${theme}`,
          'openai:gpt-4',
          'You are a social media content creator. Output only the hashtags.'
        );
        break;
        
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    console.log(`Content generated and saved to: ${imagePath}`);
    console.log(`Caption: "${captionText}"`);

    // Post to Instagram (unless skipped)
    if (!skipPosting) {
      console.log('Posting to Instagram...');
      const instagramOptions: InstagramPostOptions = {
        caption: captionText,
        imagePath
      };
      
      const result = await postImageToInstagram(instagramOptions);
      
      if (result.success) {
        console.log(`Successfully posted to Instagram! Post ID: ${result.id}`);
      } else {
        console.error(`Failed to post to Instagram: ${result.error}`);
      }
    } else {
      console.log('Skipping Instagram posting as requested.');
    }

    return;
  } catch (error) {
    console.error('Error in generate and post process:', error);
    throw error;
  }
}

// Execute the main function if running directly
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  let theme: string | undefined;
  let prompt: string | undefined;
  let contentType: ContentType | undefined;
  let title: string | undefined;
  let content: string | undefined;
  let skipPosting = false;
  
  // Simple command line argument parsing
  args.forEach(arg => {
    if (arg.startsWith('--theme=')) {
      theme = arg.split('=')[1];
    } else if (arg.startsWith('--prompt=')) {
      prompt = arg.split('=')[1];
    } else if (arg.startsWith('--type=')) {
      const type = arg.split('=')[1] as ContentType;
      if (['ai-image', 'html-post', 'quote'].includes(type)) {
        contentType = type;
      } else {
        console.error(`Invalid content type: ${type}. Using default.`);
      }
    } else if (arg.startsWith('--title=')) {
      title = arg.split('=')[1];
    } else if (arg.startsWith('--content=')) {
      content = arg.split('=')[1];
    } else if (arg === '--skip-posting') {
      skipPosting = true;
    }
  });
  
  // Run the main function with provided options
  generateAndPostContent({ 
    theme, 
    prompt,
    contentType,
    title,
    content, 
    skipPosting 
  })
    .then(() => console.log('Process completed'))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

// Export functions for use in other modules
export {
  generateAndPostContent,
  getRandomTheme
}; 