import { generateImage } from '../services/imageGenerator';
import path from 'path';

/**
 * This example demonstrates how to:
 * 1. Generate a sample image using the elegant-dark template
 * 2. Provide specific variables for the template
 * 3. Save the generated image to the temp directory
 */
async function runElegantDarkExample() {
  try {
    console.log('Generating sample image with elegant-dark template...\n');

    const sampleVariables = {
      mainHeading: "Embrace the Stillness",
      subHeading: "Discover Clarity in the Quiet",
      bodyText: "In the heart of the night, lies the profound wisdom of the universe. Listen closely.",
      accentText: "Midnight Musings",
      handle: "fixin5mins",
      date: "Dec 2023"
    };

    console.log('Using variables:');
    console.log(`- Main Heading: "${sampleVariables.mainHeading}"`);
    console.log(`- Sub Heading: "${sampleVariables.subHeading}"`);
    console.log(`- Body Text: "${sampleVariables.bodyText}"`);
    console.log(`- Accent Text: "${sampleVariables.accentText}"`);
    console.log(`- Handle: "${sampleVariables.handle}"`);
    console.log(`- Date: "${sampleVariables.date}"`);

    // Generate the image using the elegant-dark template
    const image = await generateImage({
      templateId: 'elegant-dark',
      variables: sampleVariables
    });

    // The generateImage service in this project is expected to return an object with a 'path' property
    // If it returns a string directly, the line below should be: const imagePath = image;
    const imagePath = image.path; 

    console.log(`\nImage successfully generated at: ${imagePath}`);
    console.log(`You can view this image at: file://${path.resolve(imagePath)}`);

  } catch (error) {
    console.error('Error generating image with elegant-dark template:', error);
  }
}

// Run the example
runElegantDarkExample()
  .then(() => console.log('\nElegant Dark example completed.'))
  .catch(error => console.error('\nElegant Dark example failed:', error)); 