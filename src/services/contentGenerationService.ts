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

      console.log("Raw AI response:", rawContent);

      // First, try to extract JSON from markdown code blocks if present
      // This handles responses like "```json\n{...}\n```"
      const markdownJsonMatch = rawContent.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
      if (markdownJsonMatch && markdownJsonMatch[1]) {
        try {
          const extractedJson = JSON.parse(markdownJsonMatch[1]);
          console.log("Successfully extracted JSON from markdown code block");
          return {
            content: extractedJson,
            success: true
          };
        } catch (markdownError) {
          console.log("Failed to parse JSON from markdown:", markdownError);
          // Continue to other extraction methods
        }
      }

      // Try to parse the entire response as JSON
      try {
        const jsonContent = JSON.parse(rawContent);
        console.log("Successfully parsed entire response as JSON");
        return {
          content: jsonContent,
          success: true
        };
      } catch (parseError: unknown) {
        console.log("Failed to parse entire response as JSON:", parseError);
        
        // If JSON parsing fails but forceJsonFormat was not set, 
        // try to extract JSON from the text response
        if (!options.forceJsonFormat) {
          // Look for any JSON-like structure in the response
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const extractedJson = JSON.parse(jsonMatch[0]);
              console.log("Successfully extracted JSON using regex");
              return {
                content: extractedJson,
                success: true
              };
            } catch (extractError) {
              console.log("Failed to extract JSON using regex:", extractError);
              // Extraction failed, continue to error handling
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
      console.error("Error in generateContent:", error);
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
      "The emotional hook should be 6-10 words (max 50 characters). " +
      "The action step must be something that can be completed in 5 minutes or less and should be 10-15 words (max 75 characters). " +
      "The emotional reward should describe the positive feeling after completing the action in 8-12 words (max 60 characters). " +
      "Keep each section concise and impactful to fit within the display constraints. " +
      "Keep the content concise and to the point. " +
      "Use simple language and avoid complex words. " +
      "\n\n" +
      "IMPORTANT FORMATTING RULES:\n" +
      "1. DO NOT use asterisks (*), underscores (_), or any other markdown formatting\n" +
      "2. DO NOT use HTML tags or any formatting that isn't plain text\n" +
      "3. Avoid excessive punctuation (no multiple exclamation points or question marks)\n" +
      "4. For emotional hook, use a single question format (e.g., 'Feeling stuck in your career?')\n" +
      "5. For action step, use a clear directive statement (e.g., 'Write down three career goals you want to achieve')\n" +
      "6. For emotional reward, use a simple statement about the result (e.g., 'Gain clarity and direction in your professional life')\n" +
      "7. All text must be plain, without any special formatting or symbols\n" +
      "\n" +
      "Remember that the content will be displayed in a fixed-width template, so keeping text concise is essential.";
    
    // Use the provided system prompt or the default one
    const systemPrompt = options.systemPrompt || defaultSystemPrompt;

    const model = 'gemini:gemini-2.0-flash';
    
    // Generate the content using the structured content method
    const result = await this.generateStructuredContent(
      `Create a 'fix in 5 minutes' content piece about ${topic}. Keep it concise to fit on an image. Use only plain text without any formatting.`,
      schema,
      {
        ...options,
        systemPrompt,
        model
      }
    );

    // If successful, enforce character limits on each field
    if (result.success && result.content) {
      // Clean any formatting that might have been added
      const cleanedContent: EmotionalContentFormat = {
        emotionalHook: this.cleanFormatting(result.content.emotionalHook),
        actionStep: this.cleanFormatting(result.content.actionStep),
        emotionalReward: this.cleanFormatting(result.content.emotionalReward)
      };
      
      // Then apply length limits
      const limitedContent: EmotionalContentFormat = {
        emotionalHook: this.truncateText(cleanedContent.emotionalHook, 50),
        actionStep: this.truncateText(cleanedContent.actionStep, 75),
        emotionalReward: this.truncateText(cleanedContent.emotionalReward, 60)
      };
      
      // Log the character counts for debugging
      console.log("Content character counts:");
      console.log(`- Emotional Hook (${limitedContent.emotionalHook.length}/50): ${limitedContent.emotionalHook}`);
      console.log(`- Action Step (${limitedContent.actionStep.length}/75): ${limitedContent.actionStep}`);
      console.log(`- Emotional Reward (${limitedContent.emotionalReward.length}/60): ${limitedContent.emotionalReward}`);
      
      return {
        content: limitedContent,
        success: true
      };
    }
    
    return result;
  }
  
  /**
   * Clean formatting from text (remove markdown, excessive punctuation, etc.)
   * @param text The text to clean
   * @returns Cleaned plain text
   */
  private cleanFormatting(text: string): string {
    if (!text) return '';
    
    // Remove markdown formatting (asterisks, underscores, etc.)
    let cleaned = text
      .replace(/\*([^*]+)\*/g, '$1')  // Remove asterisks (bold/italic)
      .replace(/_([^_]+)_/g, '$1')    // Remove underscores (italic)
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove double asterisks (bold)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove links
      .replace(/#{1,6}\s+/g, '')      // Remove heading markers
      .replace(/`([^`]+)`/g, '$1');   // Remove inline code

    // Remove excessive punctuation (!!!, ???, etc.)
    cleaned = cleaned
      .replace(/!{2,}/g, '!')  // Replace multiple exclamation points with a single one
      .replace(/\?{2,}/g, '?') // Replace multiple question marks with a single one
      .replace(/\.{4,}/g, '...'); // Keep ellipsis, but clean more than 3 dots
      
    return cleaned.trim();
  }
  
  /**
   * Truncate text to a maximum character length without cutting words
   * @param text The text to truncate
   * @param maxLength Maximum allowed length
   * @returns Truncated text
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text;
    }
    
    // Find the last space within the maxLength
    const lastSpace = text.substring(0, maxLength).lastIndexOf(' ');
    if (lastSpace === -1) {
      // If no space found, just cut at maxLength
      return text.substring(0, maxLength) + '...';
    }
    
    // Cut at the last space and add ellipsis
    return text.substring(0, lastSpace) + '...';
  }
} 