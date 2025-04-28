import { AiServiceClient } from './aiService';

/**
 * Options for content generation
 */
export interface ContentGenerationOptions {
  /** AI model to use for generation */
  model?: string;
  /** System prompt to guide the AI */
  systemPrompt?: string;
  /** Whether to force JSON format in the prompt */
  forceJsonFormat?: boolean;
}

/**
 * Response from content generation
 */
export interface ContentGenerationResponse {
  /** The generated content in JSON format */
  content: any;
  /** Whether the generation was successful */
  success: boolean;
  /** Error message if generation failed */
  error?: string;
}

/**
 * Standard format for emotional content with hook, action step, and reward
 */
export interface EmotionalContentFormat {
  /** Question or statement that captures the audience's emotional state */
  emotionalHook: string;
  /** Concrete action step that can be completed in 5 minutes */
  actionStep: string;
  /** Emotional benefit or outcome of taking the action */
  emotionalReward: string;
}

/**
 * Service for generating content using AI
 */
export class ContentGenerationService {
  private aiClient: AiServiceClient;

  /**
   * Create a new ContentGenerationService
   * @param baseUrl Optional base URL for the AI service
   */
  constructor(baseUrl?: string) {
    this.aiClient = new AiServiceClient(baseUrl);
  }

  /**
   * Generate content using the AI service and return as JSON
   * @param prompt The prompt for content generation
   * @param options Optional generation options
   * @returns The generated content in JSON format
   */
  async generateContent(
    prompt: string,
    options: ContentGenerationOptions = {}
  ): Promise<ContentGenerationResponse> {
    try {
      // Prepare the actual prompt
      let effectivePrompt = prompt;
      
      // Add JSON formatting instruction if required
      if (options.forceJsonFormat) {
        effectivePrompt = `${prompt}\n\nRespond ONLY with valid JSON, no other text.`;
      }

      // Generate content using the AI service
      const rawContent = await this.aiClient.generateContent(
        effectivePrompt,
        options.model,
        options.systemPrompt
      );

      // Try to parse as JSON
      try {
        const jsonContent = JSON.parse(rawContent);
        return {
          content: jsonContent,
          success: true
        };
      } catch (parseError: unknown) {
        // If JSON parsing fails but forceJsonFormat was not set, 
        // try to extract JSON from the text response
        if (!options.forceJsonFormat) {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const extractedJson = JSON.parse(jsonMatch[0]);
              return {
                content: extractedJson,
                success: true
              };
            } catch (extractError) {
              // Extraction failed, return error
            }
          }
        }
        
        // Return error response for JSON parsing failure
        return {
          content: null,
          success: false,
          error: `Failed to parse AI response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
      }
    } catch (error: unknown) {
      // Handle general errors from the AI service
      return {
        content: null,
        success: false,
        error: `Content generation failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Generate specific structured content with a predefined schema
   * @param prompt The prompt for content generation
   * @param schema The JSON schema to include in the prompt
   * @param options Optional generation options
   * @returns The generated content in JSON format
   */
  async generateStructuredContent(
    prompt: string,
    schema: object,
    options: ContentGenerationOptions = {}
  ): Promise<ContentGenerationResponse> {
    // Create a prompt that includes the schema
    const structuredPrompt = `
${prompt}

Please respond with valid JSON that follows this structure:
${JSON.stringify(schema, null, 2)}

Respond ONLY with the JSON, no other text.`;

    // Set force JSON format to true
    return this.generateContent(structuredPrompt, {
      ...options,
      forceJsonFormat: true
    });
  }

  /**
   * Generate content in the emotional format (hook, action step, reward)
   * @param topic The topic to generate content about
   * @param options Optional generation options
   * @returns The generated content in emotional format
   */
  async generateEmotionalContent(
    topic: string,
    options: ContentGenerationOptions = {}
  ): Promise<ContentGenerationResponse> {
    // Define the schema for emotional content
    const schema: EmotionalContentFormat = {
      emotionalHook: "Feeling overwhelmed by your to-do list?",
      actionStep: "Spend 5 minutes making a simple daily task planner to stay focused and productive.",
      emotionalReward: "Regain a sense of calm and control over your day."
    };
    
    // Default system prompt for emotional content generation
    const defaultSystemPrompt = 
      "Create content with emotional hooks, actionable steps (that can be done in 5 minutes), and emotional rewards. " +
      "Focus on providing genuine value in a concise format. " +
      "The emotional hook should resonate with the target audience's pain point. " +
      "The action step must be something that can be completed in 5 minutes or less. " +
      "The emotional reward should describe the positive feeling after completing the action.";
    
    // Use the provided system prompt or the default one
    const systemPrompt = options.systemPrompt || defaultSystemPrompt;
    
    // Generate the content using the structured content method
    return this.generateStructuredContent(
      `Create a 'fix in 5 minutes' content piece about ${topic}`,
      schema,
      {
        ...options,
        systemPrompt
      }
    );
  }
} 