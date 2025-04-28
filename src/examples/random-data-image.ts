import { generateImage } from '../services/imageGenerator';
import path from 'path';

/**
 * This example demonstrates how to:
 * 1. Generate a sample image using random data
 * 2. Use the fixin5mins-post template
 * 3. Save the generated image to the temp directory
 */
async function runRandomDataImageExample() {
  try {
    console.log('Generating sample image with random data...\n');
    
    // Arrays of random data
    const emotionalHooks = [
      'Feeling overwhelmed?',
      'Struggling to focus?',
      'Need a productivity boost?',
      'Stressed about your workspace?',
      'Want to clear your mind?',
      'Tired of constant distractions?',
      'Need a mental reset?',
      'Feeling stuck in a rut?'
    ];
    
    const actionSteps = [
      'Spend 5 minutes today closing tabs you don\'t need.',
      'Take 5 minutes to organize just one small area of your desk.',
      'Spend 5 minutes writing down your top 3 priorities for tomorrow.',
      'Take a 5-minute break to stretch and reset your focus.',
      'Use 5 minutes to delete unnecessary apps from your phone.',
      'Spend 5 minutes organizing your digital files into folders.',
      'Take 5 minutes to practice deep breathing exercises.',
      'Use 5 minutes to clear notifications from your devices.'
    ];
    
    const emotionalRewards = [
      'Watch how much lighter your mind feels.',
      'Notice how your focus naturally improves.',
      'Feel the immediate sense of accomplishment.',
      'Enjoy the clarity that comes from less digital clutter.',
      'Experience how small changes create mental space.',
      'See how a tiny reset can change your entire day.',
      'Feel the difference in your stress levels right away.',
      'Enjoy the satisfaction of visible progress.'
    ];
    
    const checklistItems = [
      ['Take 3 deep breaths', 'Close 5 browser tabs', 'Put away one item on your desk'],
      ['Silence notifications for 5 minutes', 'Write down your top task', 'Stand up and stretch'],
      ['Delete one unused app', 'Archive 5 old emails', 'Clean your computer screen'],
      ['Clear your desktop icons', 'Unsubscribe from one newsletter', 'Refill your water bottle'],
      ['Update your to-do list', 'Set a timer for your next task', 'Adjust your posture']
    ];
    
    // Generate random selections
    const randomIndex = (arr: any[]) => Math.floor(Math.random() * arr.length);
    
    const emotionalHook = emotionalHooks[randomIndex(emotionalHooks)];
    const actionStep = actionSteps[randomIndex(actionSteps)];
    const emotionalReward = emotionalRewards[randomIndex(emotionalRewards)];
    const selectedChecklist = checklistItems[randomIndex(checklistItems)];
    
    // Randomly choose between standard and checklist post types
    const postTypes = ['standard', 'checklist'];
    const postType = postTypes[Math.floor(Math.random() * postTypes.length)];
    
    console.log('Using randomly generated data:');
    console.log(`- Emotional Hook: "${emotionalHook}"`);
    console.log(`- Post Type: ${postType}`);
    
    if (postType === 'standard') {
      console.log(`- Action Step: "${actionStep}"`);
      console.log(`- Emotional Reward: "${emotionalReward}"`);
    } else {
      console.log(`- Checklist Items: ${selectedChecklist.join(', ')}`);
    }
    
    // Generate the image using the fixin5mins-post template
    const image = await generateImage({
      templateId: 'fixin5mins-post',
      variables: {
        postType: postType === 'standard' ? 'single-tip' : 'checklist',
        emotionalHook,
        actionStep,
        emotionalReward,
        title: "Today's 5-Minute Fix",
        checklistItems: selectedChecklist,
        totalSlides: 1
      }
    });
    
    console.log(`\nImage successfully generated at: ${image.path}`);
    console.log(`You can view this image at: file://${path.resolve(image.path)}`);
    
  } catch (error) {
    console.error('Error generating image with random data:', error);
  }
}

// Run the example
runRandomDataImageExample()
  .then(() => console.log('Example completed.'))
  .catch(error => console.error('Example failed:', error)); 