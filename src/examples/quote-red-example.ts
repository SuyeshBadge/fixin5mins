import { generateImage } from '../services/imageGenerator';
import path from 'path';

/**
 * This example demonstrates how to:
 * 1. Generate an image using the quote-red template
 * 2. Replicate the motivational quote image
 * 3. Save the generated image to the temp directory
 */
async function runQuoteRedExample() {
  try {
    console.log('Generating quote image with red template...\n');
    
    // Create an exact copy of the image shown
    const exactCopy = await generateImage({
      templateId: 'quote-red',
      variables: {
        quote: 'Wake up every day with the thought that something amazing is about to happen.',
        handle: 'REALLYGREATSITE',
        // No heading or date for the exact copy
      }
    });
    
    console.log(`\nExact copy image generated at: ${exactCopy.path}`);
    console.log(`You can view this image at: file://${path.resolve(exactCopy.path)}`);
    
    // Create a variation with heading and date
    const variation = await generateImage({
      templateId: 'quote-red',
      variables: {
        quote: 'The best way to predict the future is to create it.',
        handle: 'INSPIREME',
        heading: 'Monday Motivation',
        date: 'May 2023'
      }
    });
    
    console.log(`\nVariation with heading and date generated at: ${variation.path}`);
    console.log(`You can view this image at: file://${path.resolve(variation.path)}`);
    
  } catch (error) {
    console.error('Error generating quote image:', error);
  }
}

// Run the example
runQuoteRedExample()
  .then(() => console.log('Example completed.'))
  .catch(error => console.error('Example failed:', error)); 