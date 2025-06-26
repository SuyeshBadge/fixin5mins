import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import config from '../config';
import { AiServiceClient } from './aiService';
import templateManager from './templateManager';
import { renderHtmlToImages, HtmlContent } from './html2image-puppeteer';

const writeFile = promisify(fs.writeFile);
const aiClient = new AiServiceClient();

export interface ImageGenerationOptions {
  prompt?: string;
  size?: '1024x1024' | '512x512' | '256x256';
  style?: 'vivid' | 'natural';
  theme?: string;
  enhancePrompt?: boolean;
  templateId?: string;
  type?: string;
  variables?: Record<string, any>;
}

export interface GeneratedImage {
  url: string;
  path: string;
  prompt?: string;
  templateId?: string;
}

/**
 * Generate a template-based image
 */
async function generateTemplateImage(options: { templateId: string, variables: Record<string, any> }): Promise<string> {
  const { templateId, variables } = options;
  
  // Render the template to HTML
  const html = await templateManager.renderTemplate({
    templateId,
    variables
  });
  
  // Create HTML content for rendering
  const htmlContent: HtmlContent = {
    id: `template-${templateId}-${Date.now()}`,
    html
  };
  
  // Set up rendering options
  const tempDir = path.resolve(process.cwd(), 'temp');
  
  // Render the HTML to an image with error handling
  try {
    const images = await renderHtmlToImages([htmlContent], {
      preserveImages: true,
      outputDir: tempDir
    });
    
    if (!images || images.length === 0) {
      throw new Error('No images were generated from HTML template');
    }
    
    // Return the path to the generated image
    return images[0].filePath;
  } catch (error) {
    console.error(`Failed to render template ${templateId}:`, error);
    throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate an image using templates
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
  try {
    const { 
      theme, 
      templateId, 
      type = 'post',
      variables = {},
      prompt,
      enhancePrompt = false
    } = options;
    
    // Use a specific template if provided
    let effectiveTemplateId = templateId;
    
    // If no template ID is provided, select based on type
    if (!effectiveTemplateId) {
      const template = templateManager.getRandomTemplateByType(type);
      if (template) {
        effectiveTemplateId = template.id;
      } else {
        // Fallback to default templates
        if (type === 'quote') {
          effectiveTemplateId = 'quote-basic';
        } else if (type === 'carousel') {
          effectiveTemplateId = 'carousel-3panel';
        } else {
          effectiveTemplateId = 'post-gradient';
        }
      }
    }
    
    // Generate content if needed using AI service
    let content = variables.content || prompt;
    let title = variables.title;
    let quote = variables.quote;
    let author = variables.author;
    
    // If theme is provided and content is missing, generate content based on theme
    if (theme && (!content || enhancePrompt)) {
      console.log(`Generating content based on theme: "${theme}"`);
      content = await aiClient.generateContentWithFallback(
        `Generate engaging and concise content about: ${theme}`,
        'You are a social media content creator.'
      );
      console.log(`Generated content: "${content}"`);
    }
    
    // Prepare variables based on template type
    const mergedVariables: Record<string, any> = { ...variables };
    
    const template = templateManager.getTemplate(effectiveTemplateId);
    if (!template) {
      throw new Error(`Template with ID ${effectiveTemplateId} not found`);
    }
    
    // Add appropriate variables based on template type
    if (template.type === 'quote') {
      if (!quote && content) {
        quote = content;
      }
      mergedVariables.quote = quote || 'Your inspirational quote here';
      mergedVariables.author = author || '';
    } else if (template.type === 'carousel') {
      // For carousel, split content into three parts if it's a single piece
      if (content && (!mergedVariables.content2 || !mergedVariables.content3)) {
        const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 0);
        const parts = [];
        
        // Group sentences into 3 roughly equal parts
        const chunkSize = Math.ceil(sentences.length / 3);
        for (let i = 0; i < 3; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, sentences.length);
          if (start < sentences.length) {
            parts.push(sentences.slice(start, end).join('. ') + '.');
          } else {
            parts.push('');
          }
        }
        
        mergedVariables.content = parts[0];
        mergedVariables.content2 = parts[1];
        mergedVariables.content3 = parts[2];
      }
      
      // Set default titles if not provided
      mergedVariables.title = mergedVariables.title || 'Introduction';
      mergedVariables.title2 = mergedVariables.title2 || 'Details';
      mergedVariables.title3 = mergedVariables.title3 || 'Conclusion';
    } else {
      // For regular posts
      mergedVariables.title = title || 'Post Title';
      mergedVariables.content = content || 'Your content here';
    }
    
    // Generate image from template
    const imagePath = await generateTemplateImage({
      templateId: effectiveTemplateId,
      variables: mergedVariables
    });
    
    return {
      url: `file://${imagePath}`,
      path: imagePath,
      templateId: effectiveTemplateId
    };
  } catch (error) {
    console.error('Error in image generation process:', error);
    throw error;
  }
} 