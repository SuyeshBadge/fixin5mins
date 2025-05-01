import { ContentGenerationService } from '../services/contentGenerationService';

async function testInstagramContent() {
  const contentService = new ContentGenerationService();
  
  // Test topics that would be used for Instagram
  const topics = [
    'mindfulness for beginners',
    'productivity hacks',
    'self-confidence',
    'evening routine',
    'gratitude practice'
  ];
  
  for (const topic of topics) {
    console.log(`\nGenerating content for topic: ${topic}`);
    console.log('='.repeat(50));
    
    try {
      const result = await contentService.generateEmotionalContent(topic);
      
      if (result.success && result.content) {
        console.log('Emotional Hook:', result.content.emotionalHook);
        console.log('Action Step:', result.content.actionStep);
        console.log('Emotional Reward:', result.content.emotionalReward);
        
        if (result.content.caption) {
          console.log('Caption:', result.content.caption);
        }
        
        if (result.content.hashtags) {
          console.log('Hashtags:', result.content.hashtags.join(', '));
        }
        
        // Check lengths
        console.log('\nCharacter counts:');
        console.log('Hook:', result.content.emotionalHook.length);
        console.log('Action:', result.content.actionStep.length);
        console.log('Reward:', result.content.emotionalReward.length);
        
        // Log if this was a mock response
        if (result.note) {
          console.log('\nNote:', result.note);
        }
      } else {
        console.error('Generation failed:', result.error);
      }
    } catch (error: any) {
      console.error('Error:', error.message || String(error));
    }
    
    console.log('='.repeat(50));
  }
}

// Run the test
console.log('Instagram Content Generation Test');
console.log('='.repeat(50));
testInstagramContent().catch(console.error); 