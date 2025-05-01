import { AiServiceClient } from './aiService';
import { DEFAULT_MODEL, FREE_MODELS } from '../constants/aiModels';
import config from '../config';

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
  /** Whether to use model fallbacks if the primary model fails */
  useModelFallbacks?: boolean;
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
  /** Note about the generation process */
  note?: string;
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
  /** Caption for Instagram post (optional) */
  caption?: string;
  /** Hashtags for Instagram post (optional) */
  hashtags?: string[];
}

/**
 * Service for generating content using AI
 */
export class ContentGenerationService {
  private aiClient: AiServiceClient;

  /**
   * Create a new ContentGenerationService
   */
  constructor() {
    this.aiClient = new AiServiceClient();
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

      // Generate content using the AI service with or without fallbacks
      const rawContent = options.useModelFallbacks 
        ? await this.aiClient.generateContentWithFallback(
            effectivePrompt,
            options.systemPrompt
          )
        : await this.aiClient.generateContent(
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
      // If we're using fallbacks and have mocked content, return that instead
      if (options.useModelFallbacks && prompt.includes('about')) {
        // Try to extract the topic from the prompt
        const topicMatch = prompt.match(/about ["']?([^"']+)["']?\./i) || 
                          prompt.match(/about ([^.]+)/i);
        
        if (topicMatch && topicMatch[1]) {
          const topic = topicMatch[1].trim();
          console.log(`AI service failed, using mock content for topic: ${topic}`);
          
          // Get mock content for this topic
          const mockContent = this.getMockContentForTopic(topic);
          return {
            content: mockContent,
            success: true,
            note: "Generated using mock content due to AI service failure"
          };
        }
      }
      
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
      emotionalReward: "Regain a sense of calm and control over your day.",
      caption: "We all have those moments where our to-do list feels never-ending. But sometimes the simplest solution is to take a step back and organize our thoughts.",
      hashtags: ["productivity", "mindfulness", "planning", "organizeyourlife", "fixin5mins"]
    };
    
    // Enhanced system prompt optimized for free models
    const freeModelSystemPrompt = 
      "You are an expert in creating engaging, emotional content for Instagram posts. " +
      "Your task is to create content in a specific format with these three key parts:\n" +
      "1. emotionalHook - A concise question that connects with the audience's pain point (max 80 chars)\n" +
      "2. actionStep - A clear, specific action that can be completed in 5 minutes (max 100 chars)\n" +
      "3. emotionalReward - The emotional benefit of taking the action (max 120 chars)\n\n" +
      
      "IMPORTANT FORMATTING RULES:\n" +
      "- Respond ONLY with valid JSON in the exact format requested\n" +
      "- Keep each section under the character limits specified\n" +
      "- Do not use markdown or special formatting\n" +
      "- No explanations or additional text outside the JSON structure\n" +
      "- For emotional hook, use a single question format (e.g., 'Feeling stuck in your career?')\n" +
      "- For action step, use a clear directive (e.g., 'Write down three career goals')\n" +
      "- For emotional reward, describe the feeling after taking action (e.g., 'Gain clarity in your professional life')\n" +
      "- All text must be plain, without any formatting or symbols\n" +
      "- Include 5-6 relevant hashtags including #fixin5mins";
    
    // Use the optimized system prompt for free models or the provided one
    const systemPrompt = options.systemPrompt || freeModelSystemPrompt;
    
    // Use the default model from config or the one provided in options
    const model = options.model || config.openRouter.defaultModel || DEFAULT_MODEL;
    
    // Build a very explicit prompt that helps free models understand the format
    const explicitPrompt = `Create a 'fix in 5 minutes' Instagram content about "${topic}" in this exact JSON format:
    
{
  "emotionalHook": "A question connecting with audience's emotion (80 chars max)",
  "actionStep": "Clear action that takes 5 minutes (100 chars max)",
  "emotionalReward": "Emotional benefit of taking action (120 chars max)",
  "caption": "A brief caption expanding on the content (200 chars max)",
  "hashtags": ["relevant", "hashtags", "fixin5mins"]
}

Remember to keep it concise to fit on an image.`;

    // Generate the content using the structured content method
    try {
      const result = await this.generateStructuredContent(
        explicitPrompt,
        schema,
        {
          systemPrompt,
          model,
          forceJsonFormat: true,
          useModelFallbacks: true // Enable model fallbacks for this critical function
        }
      );
  
      // If successful, process the content as before
      if (result.success && result.content) {
        // Clean and limit as in the existing method
        const cleanedContent: EmotionalContentFormat = {
          emotionalHook: this.cleanFormatting(result.content.emotionalHook),
          actionStep: this.cleanFormatting(result.content.actionStep),
          emotionalReward: this.cleanFormatting(result.content.emotionalReward),
          caption: this.cleanFormatting(result.content.caption || ''),
          hashtags: this.cleanHashtags(result.content.hashtags || [])
        };
        
        // Then apply length limits
        const limitedContent: EmotionalContentFormat = {
          emotionalHook: this.truncateText(cleanedContent.emotionalHook, 80),
          actionStep: this.truncateText(cleanedContent.actionStep, 100),
          emotionalReward: this.truncateText(cleanedContent.emotionalReward, 120),
          caption: cleanedContent.caption ? this.truncateText(cleanedContent.caption, 200) : undefined,
          hashtags: cleanedContent.hashtags
        };
        
        // Log the character counts for debugging
        console.log("Content character counts:");
        console.log(`- Emotional Hook (${limitedContent.emotionalHook.length}/50): ${limitedContent.emotionalHook}`);
        console.log(`- Action Step (${limitedContent.actionStep.length}/75): ${limitedContent.actionStep}`);
        console.log(`- Emotional Reward (${limitedContent.emotionalReward.length}/60): ${limitedContent.emotionalReward}`);
        console.log(`- Caption (${limitedContent.caption?.length || 0}/150): ${limitedContent.caption}`);
        console.log(`- Hashtags (${limitedContent.hashtags?.length || 0}): ${limitedContent.hashtags?.join(', ')}`);
        
        return {
          content: limitedContent,
          success: true
        };
      }
      
      // If generation failed, use mock content
      console.log(`AI generation failed for topic: ${topic}. Using mock content.`);
      const mockContent = this.getMockContentForTopic(topic);
      return {
        content: mockContent,
        success: true,
        note: "Generated using mock content due to AI service failure"
      };
    } catch (error) {
      console.error(`Error generating emotional content for topic: ${topic}`, error);
      const mockContent = this.getMockContentForTopic(topic);
      return {
        content: mockContent,
        success: true,
        note: "Generated using mock content due to error"
      };
    }
  }
  
  /**
   * Clean and validate hashtags
   * @param hashtags The array of hashtags to clean
   * @returns Cleaned hashtags array
   */
  private cleanHashtags(hashtags: string[]): string[] {
    // Ensure we have an array to work with
    if (!Array.isArray(hashtags)) {
      return ['fixin5mins'];
    }
    
    // Process each hashtag
    const cleanedHashtags = hashtags.map(tag => {
      // Remove any # prefix as we'll add them in the post
      let clean = tag.startsWith('#') ? tag.substring(1) : tag;
      
      // Replace spaces and special characters with underscores
      clean = clean
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toLowerCase();
      
      return clean;
    })
    // Filter out empty or too short hashtags
    .filter(tag => tag && tag.length > 1);
    
    // Limit to a reasonable number (max 10)
    const limitedHashtags = cleanedHashtags.slice(0, 10);
    
    // Ensure #fixin5mins is included
    if (!limitedHashtags.includes('fixin5mins')) {
      limitedHashtags.push('fixin5mins');
    }
    
    return limitedHashtags;
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

  /**
   * Get mock content for a specific topic
   * @param topic The topic to get mock content for
   * @returns Mock content in the emotional format
   */
  private getMockContentForTopic(topic: string): EmotionalContentFormat {
    // Topic-specific templates for common topics
    const templates: Record<string, EmotionalContentFormat> = {
      'mindfulness': {
        emotionalHook: "Feeling overwhelmed by constant thoughts? Your mind is like a browser with 100 tabs open.",
        actionStep: "Close your eyes, take 5 deep breaths, and simply notice your thoughts without judgment.",
        emotionalReward: "Find immediate mental space and clarity, like closing those unnecessary browser tabs.",
        caption: "In our hyper-connected world, mental clarity is the ultimate luxury. Take 5 minutes to reset.",
        hashtags: ["mindfulness", "mentalhealth", "meditation", "presence", "calm", "fixin5mins"]
      },
      'productivity': {
        emotionalHook: "Drowning in your to-do list? That feeling of never catching up is exhausting.",
        actionStep: "Choose ONE task. Set a 5-minute timer and focus solely on starting that task.",
        emotionalReward: "Experience the momentum of progress and break through that paralyzing procrastination.",
        caption: "Starting is often the hardest part. Once you begin, you'll find your rhythm.",
        hashtags: ["productivity", "focus", "timemanagement", "motivation", "todolist", "fixin5mins"]
      },
      'anxiety': {
        emotionalHook: "Anxiety making your thoughts race? It feels like your mind is stuck in fast-forward.",
        actionStep: "Place your hand on your chest, take 5 deep breaths, and name 5 things you can see right now.",
        emotionalReward: "Feel your nervous system calm as you reconnect with the present moment.",
        caption: "Grounding techniques can quickly interrupt anxiety spirals and bring you back to now.",
        hashtags: ["anxiety", "mentalhealth", "grounding", "mindfulness", "selfcare", "fixin5mins"]
      },
      'sleep': {
        emotionalHook: "Another night staring at the ceiling? Poor sleep is stealing your best moments.",
        actionStep: "5 minutes before bed, write down tomorrow's top 3 priorities so your mind can fully rest.",
        emotionalReward: "Release the mental load and drift to sleep without your mind racing through tomorrow's to-dos.",
        caption: "Your brain needs closure before it can truly rest. Give it the gift of a plan.",
        hashtags: ["sleep", "insomnia", "bedtimeroutine", "mentalhealth", "rest", "fixin5mins"]
      },
      'confidence': {
        emotionalHook: "Self-doubt creeping in? Those inner voices can be the harshest critics.",
        actionStep: "Write down 3 things you've accomplished this week, no matter how small they seem.",
        emotionalReward: "Reconnect with your capabilities and silence that inner critic, even if just for today.",
        caption: "We often forget to acknowledge our small wins. They add up to create your unique story.",
        hashtags: ["confidence", "selflove", "growth", "mindset", "selfworth", "fixin5mins"]
      }
    };
    
    // Find a matching template based on partial topic match
    const matchingKey = Object.keys(templates).find(key => 
      topic.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchingKey) {
      return templates[matchingKey];
    }
    
    // Generic fallback template
    return {
      emotionalHook: `Feeling stuck with ${topic}? You're not alone in this struggle.`,
      actionStep: `Take 5 minutes to write down one small step you could take today to improve your ${topic}.`,
      emotionalReward: "Experience the relief of having a clear path forward instead of overwhelming uncertainty.",
      caption: `Sometimes the smallest steps create the biggest breakthroughs. What's your first step with ${topic}?`,
      hashtags: ["growth", "progress", "smallsteps", "clarity", "action", "fixin5mins"]
    };
  }
} 