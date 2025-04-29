import fs from 'fs';
import path from 'path';
import logger from '../utils/logger';

interface TopicEntry {
  topic: string;
  category: string;
  lastUsed: number; // Timestamp
}

interface CategoryInfo {
  category: string;
  lastUsed: number; // Timestamp for the category's last usage
  description: string;
}

/**
 * LRU Topic Cache - Manages a cache of topics and tracks usage to provide variety
 * Now with category awareness to ensure diverse content rotation
 */
class TopicCache {
  private topics: TopicEntry[] = [];
  private categories: CategoryInfo[] = [];
  private maxTopics: number = 100;
  private cacheFilePath: string;
  private categoryFilePath: string;

  constructor() {
    this.cacheFilePath = path.join(process.cwd(), 'temp', 'topic-cache.json');
    this.categoryFilePath = path.join(process.cwd(), 'temp', 'category-cache.json');
    this.loadCache();
    
    // If no topics in cache, initialize with default topics
    if (this.topics.length === 0 || this.categories.length === 0) {
      this.initializeDefaultTopics();
    }
  }

  /**
   * Get the least recently used topic from the least recently used category
   */
  public getLeastRecentlyUsedTopic(): string {
    // First, get the least recently used category (without updating its timestamp yet)
    const leastUsedCategory = this.getLeastRecentlyUsedCategory(false);
    
    // Find topics in that category
    const topicsInCategory = this.topics.filter(entry => entry.category === leastUsedCategory);
    
    if (topicsInCategory.length === 0) {
      // Fall back to overall LRU if no topics in the category
      this.topics.sort((a, b) => a.lastUsed - b.lastUsed);
      const fallbackTopic = this.topics[0]?.topic || 'productivity';
      logger.warn(`No topics found in category "${leastUsedCategory}", using fallback topic "${fallbackTopic}"`);
      this.updateTopicUsage(fallbackTopic);
      return fallbackTopic;
    }
    
    // Sort topics in the category by last used timestamp
    topicsInCategory.sort((a, b) => a.lastUsed - b.lastUsed);
    
    // Get the least recently used topic from that category
    const topic = topicsInCategory[0].topic;
    
    // Update the usage time for this topic and its category
    this.updateTopicUsage(topic);
    
    return topic;
  }

  /**
   * Get the least recently used topic from a specific category
   * @param categoryName The category to select a topic from
   * @returns The least recently used topic from the specified category
   */
  public getLeastRecentlyUsedTopicFromCategory(categoryName: string): string {
    // Validate the category exists
    const categoryExists = this.categories.some(cat => cat.category === categoryName);
    if (!categoryExists) {
      throw new Error(`Category "${categoryName}" does not exist`);
    }
    
    // Find topics in the requested category
    const topicsInCategory = this.topics.filter(entry => entry.category === categoryName);
    
    if (topicsInCategory.length === 0) {
      throw new Error(`No topics found in category "${categoryName}"`);
    }
    
    // Sort topics in the category by last used timestamp
    topicsInCategory.sort((a, b) => a.lastUsed - b.lastUsed);
    
    // Get the least recently used topic from that category
    const topic = topicsInCategory[0].topic;
    
    logger.info(`Found least recently used topic "${topic}" from category "${categoryName}" (timestamp: ${topicsInCategory[0].lastUsed})`);
    
    // First update the category timestamp directly to ensure it's marked as used
    const categoryIndex = this.categories.findIndex(c => c.category === categoryName);
    if (categoryIndex !== -1) {
      const now = Date.now();
      this.categories[categoryIndex].lastUsed = now;
      logger.info(`Direct update of category "${categoryName}" timestamp to ${now}`);
      this.saveCache();
    }
    
    // Then update the topic usage which will also update the category again
    this.updateTopicUsage(topic);
    
    return topic;
  }

  /**
   * Get all available categories
   * @returns Array of category information
   */
  public getCategories(): CategoryInfo[] {
    return [...this.categories];
  }

  /**
   * Get the least recently used category
   * @param updateTimestamp Whether to update the timestamp of the selected category (default: true)
   * @returns The least recently used category name
   */
  public getLeastRecentlyUsedCategory(updateTimestamp: boolean = true): string {
    // Sort categories by lastUsed (ascending)
    this.categories.sort((a, b) => a.lastUsed - b.lastUsed);
    
    // Get the least recently used category
    const category = this.categories[0]?.category || 'productivity';
    
    logger.info(`Getting least recently used category: "${category}" (timestamp: ${this.categories[0]?.lastUsed})`);
    
    // Update the category's lastUsed timestamp if requested
    if (updateTimestamp && category) {
      const categoryIndex = this.categories.findIndex(c => c.category === category);
      if (categoryIndex !== -1) {
        const now = Date.now();
        this.categories[categoryIndex].lastUsed = now;
        logger.info(`Updated category "${category}" timestamp to ${now}`);
        // Save the updated cache
        this.saveCache();
      }
    }
    
    return category;
  }

  /**
   * Update the last used timestamp for a topic and its category
   */
  public updateTopicUsage(topic: string): void {
    const index = this.topics.findIndex(entry => entry.topic.toLowerCase() === topic.toLowerCase());
    
    if (index !== -1) {
      const now = Date.now();
      this.topics[index].lastUsed = now;
      
      // Also update the timestamp for the category
      const category = this.topics[index].category;
      const categoryIndex = this.categories.findIndex(c => c.category === category);
      if (categoryIndex !== -1) {
        this.categories[categoryIndex].lastUsed = now;
        logger.info(`Updated topic "${topic}" and its category "${category}" timestamps to ${now}`);
      }
    } else {
      // If the topic doesn't exist, add it to the "other" category
      this.addTopic(topic, 'other');
      logger.info(`Added new topic "${topic}" to "other" category with current timestamp`);
    }
    
    // Save the updated cache
    this.saveCache();
  }

  /**
   * Add a new topic to the cache
   */
  private addTopic(topic: string, category: string): void {
    // Add the new topic
    this.topics.push({
      topic,
      category,
      lastUsed: Date.now()
    });
    
    // If we exceeded the max topics, remove the least recently used
    if (this.topics.length > this.maxTopics) {
      this.topics.sort((a, b) => a.lastUsed - b.lastUsed);
      this.topics.shift(); // Remove the least recently used topic
    }
  }

  /**
   * Save the cache to disk
   */
  private saveCache(): void {
    try {
      // Ensure the temp directory exists
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Validate we have something to save
      if (this.topics.length === 0) {
        logger.warn('No topics to save to cache!');
      }
      
      if (this.categories.length === 0) {
        logger.warn('No categories to save to cache!');
      }
      
      // Save topics
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(this.topics, null, 2));
      
      // Save categories
      fs.writeFileSync(this.categoryFilePath, JSON.stringify(this.categories, null, 2));
      
      logger.info(`Saved ${this.topics.length} topics and ${this.categories.length} categories to cache`);
      
      // Verify files were created
      if (!fs.existsSync(this.cacheFilePath)) {
        logger.warn(`Failed to create topic cache file at ${this.cacheFilePath}`);
      }
      
      if (!fs.existsSync(this.categoryFilePath)) {
        logger.warn(`Failed to create category cache file at ${this.categoryFilePath}`);
      }
    } catch (error) {
      logger.warn(`Failed to save topic cache: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load the cache from disk
   */
  private loadCache(): void {
    try {
      // Log cache file paths for debugging
      logger.info(`Looking for topic cache at: ${this.cacheFilePath}`);
      logger.info(`Looking for category cache at: ${this.categoryFilePath}`);
      
      // Load topics
      if (fs.existsSync(this.cacheFilePath)) {
        const topicData = fs.readFileSync(this.cacheFilePath, 'utf8');
        this.topics = JSON.parse(topicData);
        logger.info(`Loaded ${this.topics.length} topics from cache`);
      } else {
        logger.info('Topic cache file not found, will initialize with defaults');
      }
      
      // Load categories
      if (fs.existsSync(this.categoryFilePath)) {
        const categoryData = fs.readFileSync(this.categoryFilePath, 'utf8');
        this.categories = JSON.parse(categoryData);
        logger.info(`Loaded ${this.categories.length} categories from cache`);
      } else {
        logger.info('Category cache file not found, will initialize with defaults');
      }
    } catch (error) {
      logger.warn(`Failed to load topic cache: ${error instanceof Error ? error.message : String(error)}`);
      this.topics = [];
      this.categories = [];
    }
  }

  /**
   * Initialize with default topics organized by category
   */
  private initializeDefaultTopics(): void {
    // Define categories with descriptions
    const categories: CategoryInfo[] = [
      { 
        category: 'productivity', 
        lastUsed: Date.now() - 10000000,
        description: 'Efficiency, task management, and getting things done'
      },
      { 
        category: 'mindfulness', 
        lastUsed: Date.now() - 9500000,
        description: 'Awareness, presence, and mental practices'
      },
      { 
        category: 'physical_health', 
        lastUsed: Date.now() - 9000000,
        description: 'Exercise, nutrition, and bodily wellbeing'
      },
      { 
        category: 'mental_health', 
        lastUsed: Date.now() - 8500000,
        description: 'Emotional wellness, psychology, and personal stability'
      },
      { 
        category: 'relationships', 
        lastUsed: Date.now() - 8000000,
        description: 'Interpersonal connections and social skills'
      },
      { 
        category: 'career', 
        lastUsed: Date.now() - 7500000,
        description: 'Professional growth and workplace success'
      },
      { 
        category: 'learning', 
        lastUsed: Date.now() - 7000000,
        description: 'Knowledge acquisition and cognitive skills'
      },
      { 
        category: 'creativity', 
        lastUsed: Date.now() - 6500000,
        description: 'Artistic expression and innovative thinking'
      },
      { 
        category: 'financial', 
        lastUsed: Date.now() - 6000000,
        description: 'Money management and financial wellbeing'
      },
      { 
        category: 'personal_growth', 
        lastUsed: Date.now() - 5500000,
        description: 'Self-improvement and character development'
      },
      { 
        category: 'environmental_mindfulness', 
        lastUsed: Date.now() - 5000000,
        description: 'Sustainable practices and environmental awareness'
      },
      { 
        category: 'self_care', 
        lastUsed: Date.now() - 4500000,
        description: 'Personal well-being and nurturing activities'
      },
      { 
        category: 'organization', 
        lastUsed: Date.now() - 4000000,
        description: 'Structuring and managing physical and digital spaces'
      },
      { 
        category: 'technology_habits', 
        lastUsed: Date.now() - 3500000,
        description: 'Healthy digital practices and tech management'
      }
    ];
    
    this.categories = categories;
    
    // Define topics by category with staggered timestamps
    const topicsByCategory: Record<string, string[]> = {
      'productivity': [
        'time management', 'deep work', 'pomodoro technique', 'energy management', 'goal setting',
        'microproductivity', 'task batching', 'calendar blocking', 'decision fatigue reduction', 'distraction management',
        'habit stacking', 'daily planning', 'weekly reviews', '80/20 rule application', 'focus rituals',
        'setting daily priorities', 'evening planning for next day', 'single-tasking', 'creating a done list', 'planning buffer time'
      ],
      'mindfulness': [
        'meditation basics', 'body scan meditation', 'mindful breathing', 'loving-kindness meditation', 'gratitude journaling',
        'mindful walking', 'present moment practice', 'emotional regulation through mindfulness', 'non-judgmental awareness', 'mindful technology use',
        '5-minute breathing break', 'mindful listening', 'observing thoughts without judgment', 'mindful morning rituals', 'end-of-day reflection'
      ],
      'physical_health': [
        'functional fitness', 'mobility drills', 'dynamic stretching', 'importance of hydration', 'balanced diet principles',
        'sleep optimization', 'circadian rhythm management', 'rest and recovery strategies', 'HIIT training basics', 'building exercise consistency',
        'daily step goals', '5-minute desk stretches', 'meal prepping basics', 'sunlight exposure', 'consistent sleep schedule'
      ],
      'mental_health': [
        'mental fitness routines', 'emotional resilience', 'managing self-talk', 'building self-compassion', 'preventing burnout',
        'handling social comparison', 'building psychological flexibility', 'coping mechanisms', 'journaling for mental health', 'navigating emotional triggers',
        'daily mood tracking', 'positive affirmations practice', 'identifying daily stressors', 'emotional check-ins', 'simple gratitude exercises'
      ],
      'relationships': [
        'effective communication', 'nonviolent communication', 'giving and receiving feedback', 'building trust', 'emotional availability',
        'navigating difficult conversations', 'relationship repair strategies', 'empathy deepening exercises', 'healthy boundary setting', 'networking authentically',
        'daily appreciation message', 'active listening practice', 'small acts of kindness', 'checking in with loved ones', 'celebrating small wins together'
      ],
      'career': [
        'career roadmap building', 'mentorship seeking', 'personal branding', 'negotiation skills', 'strategic thinking',
        'remote collaboration skills', 'leading remote teams', 'time blocking at work', 'managing up', 'career pivot planning',
        'updating LinkedIn profile', '1% skill improvement daily', 'small wins journaling at work', 'daily learning recap', 'setting a career intention for the day'
      ],
      'learning': [
        'spaced repetition techniques', 'Feynman technique', 'active recall methods', 'building a personal knowledge base', 'incremental reading',
        'learning in public', 'mental models', 'cognitive biases awareness', 'adaptive learning', 'setting learning KPIs',
        'learning one new fact a day', 'teaching someone else a concept', 'reviewing daily notes', 'asking better questions', 'short focused reading sessions'
      ],
      'creativity': [
        'creative constraints', 'rapid prototyping ideas', 'design sprints', 'mind mapping', 'storytelling fundamentals',
        'reverse brainstorming', 'creative confidence building', 'rituals for creativity', 'curiosity cultivation', 'cross-pollination of ideas',
        'doodle something daily', 'freewriting exercises', 'daily idea journal', 'consume a new piece of art', '5-minute imagination practice'
      ],
      'financial': [
        'building an emergency fund', 'zero-based budgeting', 'paying yourself first', 'debt snowball method', 'retirement planning basics',
        'index fund investing', 'building multiple income streams', 'financial literacy fundamentals', 'mindful spending', 'developing a wealth mindset',
        'track one daily expense', 'compare prices before buying', 'daily spending reflection', 'setting a mini savings goal', 'no-spend day challenges'
      ],
      'personal_growth': [
        'vision setting', 'life audit exercises', 'building self-discipline', 'embracing vulnerability', 'growth mindset cultivation',
        'sabbatical planning', 'mindset shifts for change', 'narrative reframing', 'building personal integrity', 'self-actualization pathways',
        'identify one small fear to face', 'personal mantra practice', 'small risk-taking exercises', 'reflection journaling', 'micro goal setting'
      ],
      'environmental_mindfulness': [
        'reduce daily plastic use', 'turn off unused lights', 'shorter showers', 'eco-friendly commuting', 'recycling habits',
        'plant a tree', 'minimalist purchasing', 'upcycling projects', 'support local businesses', 'eco-conscious meal planning'
      ],
      'self_care': [
        'hydration reminders', 'short walk break', 'digital detox break', 'positive self-talk', 'pampering rituals',
        'solo date ideas', 'nurture a hobby', 'schedule downtime', 'listen to uplifting music', '5-minute stretching routine'
      ],
      'organization': [
        'declutter one small space', 'review to-do list', 'organize digital files', 'clean out email inbox', 'refresh workspace',
        'set daily goals', 'plan weekly menu', 'track appointments', 'file important documents', 'prep clothes for tomorrow'
      ],
      'technology_habits': [
        'limit social media time', 'unsubscribe from one email list', 'clean up phone apps', 'use a focus timer app', 'curate your media feed',
        'one tech-free hour daily', 'organize cloud storage', 'update passwords', 'adjust notification settings', 'learn a tech shortcut'
      ]
    };
    
    // Add topics with staggered timestamps within each category
    const now = Date.now();
    let topicIndex = 0;
    
    Object.entries(topicsByCategory).forEach(([category, topicList]) => {
      topicList.forEach((topic, index) => {
        this.topics.push({
          topic,
          category,
          lastUsed: now - (10000000 - (topicIndex * 1000)) // Stagger timestamps
        });
        topicIndex++;
      });
    });
    
    // Save the initialized cache
    this.saveCache();
  }
}

// Singleton instance
const topicCacheInstance = new TopicCache();

export default topicCacheInstance; 