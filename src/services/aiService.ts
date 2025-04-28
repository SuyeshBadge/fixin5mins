import fetch from 'node-fetch';
import config from '../config';

interface MessageDto {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateRequestDto {
  model: string;
  messages: MessageDto[];
  params?: Record<string, any>;
}

interface GenerateResponseDto {
  model: string;
  output: string;
  rawResponse?: any;
}

/**
 * Client for the external AI service
 */
export class AiServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = config.aiService.baseUrl || 'http://localhost:5293') {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate content using the AI service
   */
  async generateContent(
    prompt: string, 
    model: string = 'openai:gpt-4',
    systemPrompt: string = 'You are a helpful assistant.'
  ): Promise<string> {
    try {
      const messages: MessageDto[] = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const requestBody: GenerateRequestDto = {
        model,
        messages,
        params: {
          temperature: 0.7,
          max_tokens: 1000
        }
      };

      console.log('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.aiService.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        // throw new Error(`AI service responded with status ${response.status}: ${errorText}`);
      }

      const data = await response.json() as GenerateResponseDto;
      return data.output;
    } catch (error) {

      // console.log('Error calling AI service:', error);
      // console.error('Error calling AI service:', error);
      throw error;
    }
  }

} 