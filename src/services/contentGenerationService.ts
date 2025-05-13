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
  /** Whether to display a metric (number) in the post */
  hasMetric?: boolean;
  /** The actual metric value to display (e.g., "87%", "1 hour", "3 steps") */
  metricValue?: string;
  /** The unit to display with the metric (e.g., "%", "MIN", "HR") */
  metricUnit?: string;
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
    // We'll only occasionally include metrics when they're actually relevant
    const shouldIncludeMetric = Math.random() < 0.15;
    
    // Define the schema for emotional content focused on authentic help
    const schema: EmotionalContentFormat = {
      emotionalHook: "Feeling stuck in a productivity cycle where you plan more than you accomplish?",
      actionStep: "Identify just one task that would meaningfully move your day forward, and set a timer for 5 minutes of focused work on it",
      emotionalReward: "Experience the relief of breaking through initial resistance and building momentum on what truly matters",
      patternInterruptHook: "Feeling stuck in a productivity cycle where you plan more than you accomplish?",
      contentPromise: "Here's a simple way to break through the planning paralysis that keeps us stuck",
      unexpectedTwist: "Sometimes the best productivity system is to temporarily abandon your system entirely",
      socialProofElement: "This approach is based on psychological research on how we build momentum and overcome initial resistance",
      urgencyTrigger: "When we're overwhelmed, simply starting is often the hardest yet most important step",
      saveReason: "Save this for those moments when your to-do list feels overwhelming rather than helpful",
      caption: "We often get caught in planning loops when we're actually afraid to start the work. This small step breaks that cycle by proving to yourself that you can make progress right now.",
      hashtags: ["productivity", "momentum", "smallsteps", "overwhelm", "focus", "fixin5mins"],
      hasMetric: false // Default to no metrics
    };
    
    // Adjust schema based on randomization
    if (shouldIncludeMetric) {
      schema.metricValue = "";
      schema.metricUnit = "";
      // We're not pre-setting a value as we'll only include real metrics when appropriate
    }
    
    // Enhanced system prompt focused on authentic empathy
    const enhancedSystemPrompt = 
      "You are an empathetic content creator who understands real human struggles. " +
      "Your task is to create content that genuinely helps people with common challenges using these elements:\n\n" +
      
      "1. patternInterruptHook - A relatable question or observation that shows you understand the struggle (e.g., 'Feeling stuck in a productivity cycle where you plan more than you accomplish?')\n" +
      "2. contentPromise - What specific value the viewer will get (e.g., 'Here's a simple way to break through the planning paralysis that keeps us stuck')\n" +
      "3. specificActionStep - A realistic, doable 5-minute action (e.g., 'Identify just one task that would meaningfully move your day forward, and set a timer for 5 minutes of focused work on it')\n" +
      "4. unexpectedTwist - A thoughtful insight that challenges common assumptions (e.g., 'Sometimes the best productivity system is to temporarily abandon your system entirely')\n" +
      "5. socialProofElement - Authentic context about why this approach helps, based on psychology or credible research\n" +
      "6. emotionalReward - The realistic emotional benefit after taking action\n" +
      "7. urgencyTrigger - An authentic reason why this matters now\n" +
      "8. saveReason - Why someone might genuinely want to save this post\n" +
      "9. hasMetric - Whether to include a substantiated data point (true/false) - ONLY use metrics when they're real and relevant\n" +
      "10. metricValue - The actual value (only when hasMetric is true)\n" +
      "11. metricUnit - The unit (e.g., '%', 'mins', etc.)\n\n" +
      
      "IMPORTANT CONTENT GUIDELINES:\n" +
      "- Respond ONLY with valid JSON in the requested format\n" +
      "- Focus on REAL empathy and understanding, not shock value\n" +
      "- Keep content conversational and genuinely helpful\n" +
      "- For compatibility, ensure patternInterruptHook matches emotionalHook\n" +
      "- For compatibility, ensure specificActionStep matches actionStep\n" +
      "- NEVER make up statistics or use arbitrary numbers\n" +
      "- Only include metrics when they're based on real data and central to the message\n" +
      "- When hasMetric is true, provide an actual value from credible sources\n" +
      "- Include 4-5 relevant hashtags including #fixin5mins\n" +
      "- Keep character counts reasonable for visual display\n" +
      "- Focus on REAL problems people face and REALISTIC steps they can take";
    
    // Use the optimized system prompt for empathetic content
    const systemPrompt = options.systemPrompt || enhancedSystemPrompt;
    
    // Use the default model from config or the one provided in options
    const model = options.model || config.openRouter.defaultModel || DEFAULT_MODEL;
    
    // Build a prompt that generates authentic, helpful content
    const enhancedPrompt = `Create authentic, empathetic 'fix in 5 minutes' Instagram content about "${topic}" in this exact JSON format:
    
{
  "emotionalHook": "A relatable question or observation that shows you understand the struggle (80 chars max)",
  "actionStep": "A realistic, doable 5-minute action step (100 chars max)",
  "emotionalReward": "The realistic emotional benefit after taking action (120 chars max)",
  "patternInterruptHook": "Same as emotionalHook for compatibility",
  "contentPromise": "What specific value people will get from this advice",
  "unexpectedTwist": "A thoughtful insight that challenges common assumptions",
  "socialProofElement": "Authentic context about why this approach helps",
  "urgencyTrigger": "An authentic reason why this matters now",
  "saveReason": "Why someone might genuinely want to save this post",
  "caption": "A conversational expansion of the content (200 chars max)",
  "hashtags": ["relevant", "hashtags", "fixin5mins"],
  "hasMetric": ${shouldIncludeMetric}, // Default ${shouldIncludeMetric ? "true" : "false"} for this post
  "metricValue": "", // Only provide when hasMetric is true AND you have a real data point
  "metricUnit": "" // Only provide when hasMetric is true AND you have a real data point
}

CRITICAL INSTRUCTIONS:
1. Focus on creating genuinely helpful content that acknowledges the real complexity of the topic
2. Use a warm, conversational tone that connects with the reader
3. Offer a realistic first step someone could take in 5 minutes
4. Only include metrics if they're based on real psychology or research
5. Make content that feels like advice from a knowledgeable friend, not a marketing pitch`;

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
          saveReason: this.cleanFormatting(result.content.saveReason || ''),
          hasMetric: result.content.hasMetric,
          metricValue: result.content.metricValue,
          metricUnit: result.content.metricUnit
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
    // We'll only occasionally include metrics when they're actually relevant
    const shouldIncludeMetric = Math.random() < 0.15;
    
    // Topic-specific templates that focus on real problems and authentic solutions
    const templates: Record<string, EmotionalContentFormat> = {
      'mindfulness': {
        emotionalHook: "Find your mind racing with thoughts when you're trying to focus on what's happening now?",
        actionStep: "Take 5 minutes to sit quietly and simply notice your thoughts without judging them, seeing them as clouds passing by.",
        emotionalReward: "Experience the calm that comes from observing your thoughts instead of being controlled by them.",
        caption: "Mindfulness isn't about having no thoughts—it's about changing your relationship with them. This simple practice helps create space between you and the constant mental chatter.",
        hashtags: ["mindfulness", "mentalhealth", "presence", "awareness", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Find your mind racing with thoughts when you're trying to focus on what's happening now?",
        contentPromise: "A simple mindfulness practice that creates immediate mental space",
        unexpectedTwist: "The goal isn't to stop thinking but to change your relationship with your thoughts",
        socialProofElement: "This technique is taught in mindfulness-based stress reduction programs worldwide",
        urgencyTrigger: "Each moment spent fused with racing thoughts adds to mental and physical stress",
        saveReason: "Save this for those moments when your mind feels too full and scattered",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'productivity': {
        emotionalHook: "Ever notice how you resist starting the tasks that matter most?",
        actionStep: "Choose one important task and commit to just 5 minutes of focused work on it with no distractions.",
        emotionalReward: "Feel the momentum and clarity that comes from breaking through the initial resistance barrier.",
        caption: "Our brains are wired to resist uncertainty and complexity. The 5-minute commitment trick works because it makes starting manageable, activating the part of your brain that craves completion.",
        hashtags: ["productivity", "focustime", "momentum", "procrastination", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Ever notice how you resist starting the tasks that matter most?",
        contentPromise: "A psychological trick to break through initial task resistance",
        unexpectedTwist: "Starting is much harder than continuing, which is why short commitments work so well",
        socialProofElement: "This approach leverages the Zeigarnik effect - our brain's natural desire to complete what we've started",
        urgencyTrigger: "Each day, our most important tasks face the strongest psychological resistance",
        saveReason: "Save this for when you're feeling stuck on an important project you keep avoiding",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'anxiety': {
        emotionalHook: "When anxiety hits, does your mind race while your body tenses up?",
        actionStep: "Place one hand on your chest, one on your stomach, and take 5 deep belly breaths counting to 4 on each inhale and exhale.",
        emotionalReward: "Feel your nervous system begin to settle as you activate your body's natural calming response.",
        caption: "Anxiety involves both mind and body in a feedback loop. This breathing technique works because it directly signals your nervous system to move from fight-or-flight to rest-and-digest mode.",
        hashtags: ["anxiety", "nervousystem", "breathing", "stressrelief", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "When anxiety hits, does your mind race while your body tenses up?",
        contentPromise: "A physiological reset button that can help calm anxiety in moments",
        unexpectedTwist: "Trying to think your way out of anxiety often makes it worse - your body holds the key",
        socialProofElement: "This breathing technique activates the vagus nerve, which research shows helps regulate the stress response",
        urgencyTrigger: "Having a simple physical tool ready before anxiety strikes makes all the difference",
        saveReason: "Save this for your next anxious moment - it's simple enough to remember when stressed",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'sleep': {
        emotionalHook: "Do you lie awake thinking about tomorrow's tasks and challenges?",
        actionStep: "Before bed, take 5 minutes to write down your top 3 priorities for tomorrow and any worries on your mind.",
        emotionalReward: "Experience deeper sleep as your brain relaxes, knowing your thoughts are safely captured for tomorrow.",
        caption: "Your brain keeps you awake to make sure you don't forget important things. This 'cognitive offloading' technique gives your mind permission to rest.",
        hashtags: ["sleep", "insomnia", "eveningroutine", "restful", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Do you lie awake thinking about tomorrow's tasks and challenges?",
        contentPromise: "A pre-sleep mental offloading technique that helps quiet racing thoughts",
        unexpectedTwist: "Your brain keeps you awake not to torture you, but to protect you from forgetting important things",
        socialProofElement: "Research on 'bedtime worry' shows writing concerns down significantly improves sleep quality",
        urgencyTrigger: "Each night of poor sleep affects your cognitive function and emotional resilience the next day",
        saveReason: "Save this for tonight if you've been struggling with racing thoughts at bedtime",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'confidence': {
        emotionalHook: "Do you sometimes feel like you're not good enough despite your accomplishments?",
        actionStep: "Take 5 minutes to write down three specific moments when you overcame a challenge or received positive feedback.",
        emotionalReward: "Reconnect with factual evidence that contradicts your inner critic and supports your capabilities.",
        caption: "Our brains have a negativity bias that makes us forget our strengths and fixate on perceived weaknesses. This evidence-collection practice helps rebalance that distortion.",
        hashtags: ["confidence", "impostorsyndrome", "selfdoubt", "growth", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Do you sometimes feel like you're not good enough despite your accomplishments?",
        contentPromise: "An evidence-based approach to quieting imposter syndrome when it strikes",
        unexpectedTwist: "Positive thinking alone doesn't work - collecting concrete evidence does",
        socialProofElement: "Cognitive behavioral approaches consistently show that challenging negative thoughts with factual evidence is effective",
        urgencyTrigger: "Self-doubt tends to strike hardest right before important opportunities or challenges",
        saveReason: "Save this for your next confidence crisis - it works when affirmations don't",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'relationships': {
        emotionalHook: "Frustrated when the same conflict keeps happening in your important relationships?",
        actionStep: "Choose one recent disagreement and write down what the other person might have been feeling, not just what they said.",
        emotionalReward: "Gain insight into patterns that keep repeating and open new possibilities for understanding.",
        caption: "We often get stuck responding to what people say rather than what they feel underneath. This perspective shift can transform chronic conflicts into opportunities for deeper connection.",
        hashtags: ["relationships", "communication", "empathy", "connection", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Frustrated when the same conflict keeps happening in your important relationships?",
        contentPromise: "A simple perspective shift that can transform recurring conflicts",
        unexpectedTwist: "Focusing on the other person's feelings rather than their words opens new possibilities",
        socialProofElement: "Research in relationship psychology shows that emotional understanding is more important than problem-solving",
        urgencyTrigger: "Each repeated conflict creates deeper patterns that become harder to change over time",
        saveReason: "Save this for after your next disagreement with someone important to you",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      },
      'reading': {
        emotionalHook: "Do you read a lot but struggle to remember and apply what you've learned?",
        actionStep: "After reading an article or book chapter, take 5 minutes to write 3 bullet points summarizing key insights.",
        emotionalReward: "Transform passive reading into knowledge you can actually use and remember.",
        caption: "Reading without reflecting is like eating without digesting. This simple active recall technique helps your brain process and store information in a way you can actually access later.",
        hashtags: ["reading", "learning", "retention", "knowledge", "fixin5mins"],
        
        // Enhanced elements
        patternInterruptHook: "Do you read a lot but struggle to remember and apply what you've learned?",
        contentPromise: "A simple technique to transform passive reading into usable knowledge",
        unexpectedTwist: "The act of trying to recall information is more powerful than rereading or highlighting",
        socialProofElement: "Learning science shows that active recall significantly improves long-term retention compared to passive reviewing",
        urgencyTrigger: "Without active processing, most of what you read today will be forgotten within a week",
        saveReason: "Save this for the next time you read something important you actually want to remember",
        hasMetric: false,
        metricValue: "",
        metricUnit: ""
      }
    };
    
    // Find a matching template based on partial topic match
    const matchingKey = Object.keys(templates).find(key => 
      topic.toLowerCase().includes(key.toLowerCase())
    );
    
    if (matchingKey) {
      return { ...templates[matchingKey] };
    }
    
    // Generic fallback template with authentic approach
    let emotionalHook, patternInterruptHook;
    
    emotionalHook = `Finding it challenging to make progress with ${topic} despite your best efforts?`;
    patternInterruptHook = emotionalHook;
    
    return {
      emotionalHook,
      actionStep: `Take 5 minutes to write down one small, specific step you could take today with ${topic}.`,
      emotionalReward: `Experience the clarity and motivation that comes from having a concrete next action.`,
      caption: `When we're stuck with ${topic}, we often think we need more information or resources. But usually, we just need a clear, specific next step to get moving again.`,
      hashtags: ["clarity", "action", "smallsteps", "progress", "fixin5mins"],
      
      // Enhanced elements
      patternInterruptHook,
      contentPromise: `A simple clarity exercise that helps you get unstuck with ${topic}`,
      unexpectedTwist: `Progress with ${topic} rarely comes from having the perfect plan, but from taking imperfect action`,
      socialProofElement: `This approach is based on research showing that clarity and specificity are key motivational factors`,
      urgencyTrigger: `The longer we stay stuck thinking about ${topic} without acting, the harder it becomes to start`,
      saveReason: `Save this for when you're feeling overwhelmed or confused about next steps with ${topic}`,
      // Apply minimal metrics
      hasMetric: false,
      metricValue: "",
      metricUnit: ""
    };
  }
}