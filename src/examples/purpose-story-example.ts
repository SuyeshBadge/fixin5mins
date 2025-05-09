import path from 'path';
import { generateImage } from '../services/imageGenerator';
import fs from 'fs';

/**
 * This example demonstrates how to:
 * 1. Generate an image using the purpose-story template
 * 2. Test both standard and emotional content formats
 * 3. Save the generated images to the temp directory
 */
async function runPurposeStoryExample() {
  try {
    console.log('Generating purpose-story template examples...\n');
    
    // Example 1: Standard Format (Original)
    console.log('Example 1: Standard Format');
    const standardFormat = await generateImage({
      templateId: 'purpose-story',
      variables: {
        topLabel: 'MOTIVATION',
        mainMessage: 'LIVE YOUR PURPOSE!',
        brandName: 'HANOVER',
        brandSubtitle: 'AND TYKE',
        handle: 'reallygreatsite',
        date: 'May 2023'
      }
    });
    
    console.log(`Standard format image generated at: ${standardFormat.path}`);
    console.log(`You can view this image at: file://${path.resolve(standardFormat.path)}\n`);
    
    // Example 2: Emotional Content Format
    console.log('Example 2: Emotional Content Format');
    const emotionalFormat = await generateImage({
      templateId: 'purpose-story',
      variables: {
        topLabel: 'INSPIRATION',
        emotionalHook: 'COMMIT TO GROWTH',
        actionStep: 'Set one small goal today',
        emotionalReward: 'Small steps lead to tremendous journeys when taken with purpose and consistency.',
        brandName: 'CREATIVE',
        brandSubtitle: 'STUDIOS',
        handle: 'fixin5mins',
        date: 'May 2023',
        saveReason: true
      }
    });
    
    console.log(`Emotional format image generated at: ${emotionalFormat.path}`);
    console.log(`You can view this image at: file://${path.resolve(emotionalFormat.path)}\n`);
    
    // Example 3: Pattern Interrupt Format
    console.log('Example 3: Pattern Interrupt Format');
    const patternInterruptFormat = await generateImage({
      templateId: 'purpose-story',
      variables: {
        topLabel: 'MINDSET',
        patternInterruptHook: 'STOP WAITING',
        actionStep: 'Start building today',
        emotionalReward: 'The perfect moment is an illusion. Real progress comes from taking action now.',
        brandName: 'MOMENTUM',
        brandSubtitle: 'MINDSET',
        handle: 'momentummindset',
        saveReason: true
      }
    });
    
    console.log(`Pattern Interrupt format image generated at: ${patternInterruptFormat.path}`);
    console.log(`You can view this image at: file://${path.resolve(patternInterruptFormat.path)}\n`);
    
    // Example 4: Long Content Format (Matching the provided image)
    console.log('Example 4: Long Content Format');
    const longContentFormat = await generateImage({
      templateId: 'purpose-story',
      variables: {
        topLabel: 'MOTIVATION',
        emotionalHook: 'MOST MENTAL MODELS ARE USELESS UNLESS YOU APPLY THIS ONE TRICK',
        actionStep: 'PICK ONE MENTAL MODEL, LIKE \'SECOND-ORDER THINKING\', THEN WRITE DOWN ONE DAILY ACTION THAT USES IT',
        emotionalReward: 'Gain confidence in decision-making by seeing the patterns in your thinking.',
        brandName: 'HANOVER',
        brandSubtitle: 'AND TYKE',
        handle: 'fixin5mins',
        date: 'May 2025',
        saveReason: true
      }
    });
    
    console.log(`Long content format image generated at: ${longContentFormat.path}`);
    console.log(`You can view this image at: file://${path.resolve(longContentFormat.path)}`);
    
  } catch (error) {
    console.error('Error generating purpose-story images:', error);
  }
}

// Run the example
runPurposeStoryExample()
  .then(() => console.log('Examples completed successfully.'))
  .catch(error => console.error('Examples failed:', error)); 