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
  
  /** Surprising statement that stops scrolling (optional - enhanced viral element) */
  patternInterruptHook?: string;
  /** What specific value the viewer will get (optional - enhanced viral element) */
  contentPromise?: string;
  /** Something counterintuitive about the advice (optional - enhanced viral element) */
  unexpectedTwist?: string;
  /** Evidence why this works - research, results, etc. (optional - enhanced viral element) */
  socialProofElement?: string;
  /** Reason to act now (optional - enhanced viral element) */
  urgencyTrigger?: string;
  /** Why save this post (optional - enhanced viral element) */
  saveReason?: string;
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
      console.log("useModelFallbacks", options.useModelFallbacks);

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
        
      if(!rawContent) {
        return {
          content: null,
          success: false,
          error: "No content generated"
        };
      }


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
      useModelFallbacks: true,
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
    // Define the schema for emotional content with viral elements
    const schema: EmotionalContentFormat = {
      emotionalHook: "To-do lists actually REDUCE productivity by 27% (research-backed)",
      actionStep: "Write down only ONE task that moves your life forward, then block 25 minutes for it before checking messages",
      emotionalReward: "Feel immediate mental clarity instead of scattered anxiety of juggling priorities",
      patternInterruptHook: "To-do lists actually REDUCE productivity by 27% (research-backed)",
      contentPromise: "Learn the 5-minute MIT method that top CEOs use instead",
      unexpectedTwist: "The power isn't in organizing tasks but in eliminating the psychological burden of choices",
      socialProofElement: "Stanford productivity study found this method increases meaningful output by 34%",
      urgencyTrigger: "Every day you use traditional to-do lists costs you 74 minutes of lost productivity",
      saveReason: "Save this post for tomorrow morning before you start your workday",
      caption: "We all have those moments where our to-do list feels never-ending. But sometimes the simplest solution is to take a step back and organize our thoughts.",
      hashtags: ["productivity", "mindfulness", "planning", "organizeyourlife", "fixin5mins"]
    };
    
    // Enhanced system prompt optimized for viral content
    const enhancedSystemPrompt = 
      "You are an expert in creating viral, engaging content for Instagram. " +
      "Your task is to create content that stops scrolling and drives saves and shares using these key elements:\n\n" +
      
      "1. patternInterruptHook - A surprising statement or question that challenges conventional wisdom (e.g., 'To-do lists decrease productivity by 27%')\n" +
      "2. contentPromise - What specific value the viewer will get (e.g., 'Learn the 5-minute technique top CEOs use instead')\n" +
      "3. specificActionStep - A precise, detailed 5-minute action with clear steps (e.g., 'Write ONE task that moves your life forward, then block 25 minutes for it before checking messages')\n" +
      "4. unexpectedTwist - Something counterintuitive about your advice (e.g., 'The power isn't organizing tasks but eliminating decision fatigue')\n" +
      "5. socialProofElement - Evidence why this works (e.g., 'Stanford study found this increases output by 34%')\n" +
      "6. emotionalReward - The feeling after taking action (e.g., 'Feel immediate mental clarity instead of scattered anxiety')\n" +
      "7. urgencyTrigger - Reason to act now (e.g., 'Every day with traditional lists costs 74 minutes of lost productivity')\n" +
      "8. saveReason - Why save this post (e.g., 'Save this for tomorrow morning before starting work')\n\n" +
      
      "IMPORTANT FORMATTING RULES:\n" +
      "- Respond ONLY with valid JSON in the exact format requested\n" +
      "- Keep each section concise but impactful\n" +
      "- For required compatibility, ensure patternInterruptHook matches emotionalHook\n" +
      "- For required compatibility, ensure specificActionStep matches actionStep\n" +
      "- Include 5-6 relevant hashtags including #fixin5mins\n" +
      "- All text must be plain, without any formatting or symbols\n" +
      "- Keep character counts reasonable for visual display";
    
    // Use the optimized system prompt for viral content
    const systemPrompt = options.systemPrompt || enhancedSystemPrompt;
    
    // Use the default model from config or the one provided in options
    const model = options.model || config.openRouter.defaultModel || DEFAULT_MODEL;
    
    // Build an enhanced prompt that generates viral-worthy content
    const enhancedPrompt = `Create viral-worthy 'fix in 5 minutes' Instagram content about "${topic}" in this exact JSON format:
    
{
  "emotionalHook": "A surprising statement that challenges common wisdom (80 chars max)",
  "actionStep": "Specific, detailed action that takes 5 minutes (100 chars max)",
  "emotionalReward": "The emotional transformation after taking action (120 chars max)",
  "patternInterruptHook": "Same as emotionalHook for compatibility",
  "contentPromise": "The specific value viewers will get from this post",
  "unexpectedTwist": "Something counterintuitive about this advice that makes it stand out",
  "socialProofElement": "Evidence, research, or results that prove this works",
  "urgencyTrigger": "Why the viewer should act on this advice today",
  "saveReason": "Why viewers should save this post for later reference",
  "caption": "Engaging caption that expands on the content (200 chars max)",
  "hashtags": ["relevant", "hashtags", "fixin5mins"]
}

Make it incredibly surprising, specific, and save-worthy to drive viral engagement.`;

    // Generate the content using the structured content method
    try {
      const result = await this.generateStructuredContent(
        enhancedPrompt,
        schema,
        {
          systemPrompt,
          model,
          forceJsonFormat: true,
          useModelFallbacks: true // Enable model fallbacks for this critical function
        }
      );
  
      // If successful, process the content
      if (result.success && result.content) {
        // Clean and process content fields
        const cleanedContent: EmotionalContentFormat = {
          // Core fields (required for backward compatibility)
          emotionalHook: this.cleanFormatting(result.content.emotionalHook || result.content.patternInterruptHook),
          actionStep: this.cleanFormatting(result.content.actionStep || result.content.specificActionStep),
          emotionalReward: this.cleanFormatting(result.content.emotionalReward),
          caption: this.cleanFormatting(result.content.caption || ''),
          hashtags: this.cleanHashtags(result.content.hashtags || []),
          
          // Enhanced viral elements
          patternInterruptHook: this.cleanFormatting(result.content.patternInterruptHook || result.content.emotionalHook),
          contentPromise: this.cleanFormatting(result.content.contentPromise || ''),
          unexpectedTwist: this.cleanFormatting(result.content.unexpectedTwist || ''),
          socialProofElement: this.cleanFormatting(result.content.socialProofElement || ''),
          urgencyTrigger: this.cleanFormatting(result.content.urgencyTrigger || ''),
          saveReason: this.cleanFormatting(result.content.saveReason || '')
        };
        
        // Return the content without truncation
        return {
          content: cleanedContent,
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
   * Get mock content for a specific topic
   * @param topic The topic to get mock content for
   * @returns Mock content in the emotional format
   */
  private getMockContentForTopic(topic: string): EmotionalContentFormat {
    // Topic-specific templates for common topics with enhanced viral elements
    const templates: Record<string, EmotionalContentFormat> = {
      'mindfulness': {
        emotionalHook: "Your brain processes 6,000 thoughts daily but remembers only 5% of them.",
        actionStep: "Set a 5-minute timer and write down every thought that comes to mind without judgment.",
        emotionalReward: "Break the cycle of mental overwhelm and discover what's actually important beneath the noise.",
        caption: "Mental clarity isn't about having no thoughts—it's about knowing which ones deserve your attention. Try this research-backed exercise to cut through the mental static.",
        hashtags: ["mindfulness", "mentalhealth", "brainhack", "focustips", "clarity", "fixin5mins"],
        
        // Enhanced viral elements
        patternInterruptHook: "Your brain processes 6,000 thoughts daily but remembers only 5% of them.",
        contentPromise: "Discover the neuroscience-backed 5-minute thought download technique",
        unexpectedTwist: "Trying to 'clear your mind' actually increases thought volume by 34%",
        socialProofElement: "Harvard neuroscientists found this technique reduces cortisol levels by 27% in just one session",
        urgencyTrigger: "Each day of rumination reinforces neural pathways that keep you stuck",
        saveReason: "Save for the next time you feel mentally scattered or overwhelmed"
      },
      'productivity': {
        emotionalHook: "91% of to-do lists fail because they ignore the biology of focus.",
        actionStep: "Choose ONE task, set a timer for exactly 5 minutes of focused work with your phone in another room.",
        emotionalReward: "Experience the momentum that breaks through procrastination faster than any motivational quote.",
        caption: "Your to-do list is working against your brain's natural focus systems. This micro-commitment technique bypasses the resistance that keeps you stuck.",
        hashtags: ["productivity", "neuroscience", "focusmethod", "procrastination", "deepwork", "fixin5mins"],
        
        // Enhanced viral elements
        patternInterruptHook: "91% of to-do lists fail because they ignore the biology of focus.",
        contentPromise: "Learn the 5-minute micro-commitment technique that elite performers use",
        unexpectedTwist: "Starting with your easiest task actually decreases overall productivity by 23%",
        socialProofElement: "Stanford research shows this approach increases completion rates by 83% for complex projects",
        urgencyTrigger: "Every day of delay reinforces the neural pathways of procrastination",
        saveReason: "Save this technique for the next time you're feeling stuck on an important project"
      },
      'anxiety': {
        emotionalHook: "Anxiety isn't in your mind—it's in your nervous system, according to neuroscientists.",
        actionStep: "Place one hand on your chest, one on your stomach, and take 5 deep belly breaths counting 4-7-8.",
        emotionalReward: "Feel your nervous system shift from fight-or-flight to rest-and-digest in under 300 seconds.",
        caption: "Trying to 'think' your way out of anxiety is like trying to put out a fire with gasoline. This physiological reset button works when nothing else will.",
        hashtags: ["anxiety", "nervousystem", "vagalresponse", "breathwork", "stressrelief", "fixin5mins"],
        
        // Enhanced viral elements
        patternInterruptHook: "Anxiety isn't in your mind—it's in your nervous system, according to neuroscientists.",
        contentPromise: "Learn the physiological 'reset button' that works when meditation fails",
        unexpectedTwist: "Talking about your anxiety can actually increase stress hormones by 43%",
        socialProofElement: "Used by combat veterans with 87% reporting immediate symptom reduction",
        urgencyTrigger: "Each anxiety spike without intervention strengthens the neural anxiety circuit",
        saveReason: "Save for your next anxiety spike—it works faster than medication"
      },
      'sleep': {
        emotionalHook: "Your brain makes sleep decisions 3 hours before bedtime, not when you close your eyes.",
        actionStep: "5 minutes before dinner, write down tomorrow's top 3 tasks to prevent 2AM thought spirals.",
        emotionalReward: "Program your brain for deep sleep instead of rehearsing tomorrow's worries all night.",
        caption: "Insomnia isn't a nighttime problem—it's set in motion hours before bed. This neuroscience-backed planning technique gives your brain the closure it needs.",
        hashtags: ["sleep", "insomnia", "neurohack", "sleepscience", "eveningroutine", "fixin5mins"],
        
        // Enhanced viral elements
        patternInterruptHook: "Your brain makes sleep decisions 3 hours before bedtime, not when you close your eyes.",
        contentPromise: "Learn the pre-dinner ritual that improves sleep quality by 71%",
        unexpectedTwist: "Using blue-light blocking glasses is 43% less effective than this mental offloading technique",
        socialProofElement: "Sleep researchers at UCLA found this reduces middle-of-night wakeups by 63%",
        urgencyTrigger: "Each night of poor sleep compounds cognitive decline and increases stress hormones",
        saveReason: "Save this for tonight if you're tired of staring at the ceiling at 2AM"
      },
      'confidence': {
        emotionalHook: "Impostor syndrome affects 85% of professionals but comes from a single cognitive error.",
        actionStep: "Take 5 minutes to list three specific situations where you received recognition or delivered results.",
        emotionalReward: "Reconnect with objective evidence that contradicts the brain's negative filtering bias.",
        caption: "Your confidence isn't missing—it's being filtered out by your brain's negativity bias. This evidence-collection technique rewires that faulty circuit.",
        hashtags: ["confidence", "impostorsyndrome", "mindset", "selfworth", "evidencemethod", "fixin5mins"],
        
        // Enhanced viral elements
        patternInterruptHook: "Impostor syndrome affects 85% of professionals but comes from a single cognitive error.",
        contentPromise: "Discover the 5-minute evidence collection technique used by CEOs and top performers",
        unexpectedTwist: "Positive affirmations without evidence actually reinforce impostor feelings in 65% of people",
        socialProofElement: "Cognitive research shows this method reduces self-doubt by 47% after just one session",
        urgencyTrigger: "Every day without correcting your brain's negativity bias reinforces the impostor neural pathway",
        saveReason: "Save for your next confidence crisis—it works when affirmations fail"
      }
    };
    
    // Find a matching template based on partial topic match
    const matchingKey = Object.keys(templates).find(key => 
      topic.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchingKey) {
      return templates[matchingKey];
    }
    
    // Generic fallback template with viral elements
    return {
      emotionalHook: `90% of people struggle with ${topic} because they're missing a critical insight.`,
      actionStep: `Take 5 minutes to write down your biggest ${topic} challenge, then circle the parts you can control in blue.`,
      emotionalReward: `Gain immediate clarity by separating what's actionable from what's just mental noise.`,
      caption: `Most ${topic} advice ignores the psychology of change. This simple clarity exercise cuts through the confusion and gives you a clear first step.`,
      hashtags: ["clarity", "mindset", "actionsteps", "progress", "breakthrough", "fixin5mins"],
      
      // Enhanced viral elements
      patternInterruptHook: `90% of people struggle with ${topic} because they're missing a critical insight.`,
      contentPromise: `Learn the 5-minute clarity technique that transforms how you approach ${topic}`,
      unexpectedTwist: `Most ${topic} problems come from focusing on solutions before gaining clarity`,
      socialProofElement: `Psychological research shows this approach increases success rates by 340%`,
      urgencyTrigger: `Each day spent unclear about your ${topic} challenge compounds feelings of overwhelm`,
      saveReason: `Save this for the next time you feel stuck with ${topic} challenges`
    };
  }
} 