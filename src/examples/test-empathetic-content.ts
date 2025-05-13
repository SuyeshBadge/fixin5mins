import { ContentGenerationService } from '../services/contentGenerationService';

async function testEmpatheticContent() {
  const contentService = new ContentGenerationService();
  
  // Test topics that would benefit from empathetic approaches
  const topics = [
    'work-life balance',
    'anxiety management',
    'career transitions',
    'parenting stress',
    'grief and loss',
    'financial worry'
  ];
  
  for (const topic of topics) {
    console.log(`\nGenerating empathetic content for topic: ${topic}`);
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
        
        // Check for empathy markers
        console.log('\nEmpathy Elements:');
        console.log('Content Promise:', result.content.contentPromise);
        console.log('Social Proof:', result.content.socialProofElement);
        console.log('Unexpected Twist:', result.content.unexpectedTwist);
        
        // Check if metrics are used
        console.log('\nMetrics:');
        console.log('Has Metric:', result.content.hasMetric);
        if (result.content.hasMetric) {
          console.log('Metric Value:', result.content.metricValue);
          console.log('Metric Unit:', result.content.metricUnit);
        }
        
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
console.log('Empathetic Content Generation Test');
console.log('='.repeat(50));
testEmpatheticContent().catch(console.error); 