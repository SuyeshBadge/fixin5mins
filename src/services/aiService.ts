import { OpenAI } from 'openai';
import config from '../config';
import { DEFAULT_MODEL, FREE_MODELS } from '../constants/aiModels';

interface MessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Client for OpenRouter AI service
 */
export class AiServiceClient {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: config.openRouter.apiKey,
      defaultHeaders: {
        "HTTP-Referer": config.openRouter.referrerUrl || 'https://github.com/fixin5mins',
        "X-Title": config.openRouter.siteName || 'Fixin5mins'
      }
    });
  }

  /**
   * Generate content using OpenRouter
   */
  async generateContent(
    prompt: string, 
    model: string = config.openRouter.defaultModel || DEFAULT_MODEL,
    systemPrompt: string = 'You are a helpful assistant.'
  ): Promise<string> {
    try {
      console.log('Using model:', model);
      console.log('Prompt:', prompt);
      console.log('System prompt:', systemPrompt);
      
      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('Unable to generate content: AI returned empty response');
      }
      return content;
    } catch (error: any) {
      // Check if error is a 404 "No endpoints found" error
      if (error.status === 404 && error.error?.message?.includes('No endpoints found')) {
        console.error(`Model not available: ${model}. This model may have been deprecated or renamed.`);
        
        // If the model is one of our predefined models, we should use the default model
        if (Object.values(FREE_MODELS).includes(model) && model !== DEFAULT_MODEL) {
          console.log(`Automatically falling back to default model: ${DEFAULT_MODEL}`);
          return this.generateContent(prompt, DEFAULT_MODEL, systemPrompt);
        }
      }
      
      console.error('Error calling OpenRouter AI service:', error);
      throw error;
    }
  }

  /**
   * Generate content with fallback to other models if the primary one fails
   */
  async generateContentWithFallback(
    prompt: string,
    systemPrompt: string = 'You are a helpful assistant.'
  ): Promise<string> {
    // Try primary model first
    const primaryModel = config.openRouter.defaultModel || DEFAULT_MODEL;
    
    try {
      return await this.generateContent(prompt, primaryModel, systemPrompt);
    } catch (primaryError) {
      console.warn(`Primary model ${primaryModel} failed, trying fallbacks...`);
      
      // Try alternative models - ensure we only try models that are known to work
      const fallbackModels = [
        FREE_MODELS.QWEN_7B,
        FREE_MODELS.MISTRAL_SMALL,
        FREE_MODELS.MISTRAL_TINY,
        FREE_MODELS.DEEPSEEK_CHAT,
      ].filter(m => m !== primaryModel);
      
      for (const model of fallbackModels) {
        try {
          console.log(`Attempting fallback with model: ${model}`);
          return await this.generateContent(prompt, model, systemPrompt);
        } catch (fallbackError) {
          console.warn(`Fallback model ${model} also failed.`);
        }
      }
      
      // If all models failed, throw the original error
      console.error('All AI models failed, no fallbacks remaining.');
      throw primaryError;
    }
  }
} 