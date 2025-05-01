import { OpenAI } from 'openai';
import config from '../config';

async function listOpenRouterModels() {
  console.log('Listing available OpenRouter models...');
  
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.openRouter.apiKey,
    defaultHeaders: {
      "HTTP-Referer": config.openRouter.referrerUrl || 'https://github.com/fixin5mins',
      "X-Title": config.openRouter.siteName || 'Fixin5mins'
    }
  });

  try {
    // Attempt to list all available models
    const response = await openai.models.list();
    
    console.log('Available models:');
    console.log('='.repeat(50));
    
    // Filter for free models
    const freeModels = response.data.filter(model => {
      // Look for indicators that the model is free
      const id = model.id.toLowerCase();
      return (
        (id.includes('mistral') && !id.includes('large')) || 
        id.includes('tiny') ||  
        id.includes('deepseek') || 
        id.includes('free')
      );
    });
    
    if (freeModels.length > 0) {
      console.log('Free models:');
      freeModels.forEach(model => {
        console.log(`- ${model.id}`);
      });
    } else {
      console.log('No free models detected.');
    }
    
    console.log('\nAll models:');
    response.data.forEach(model => {
      console.log(`- ${model.id}`);
    });
    
  } catch (error: any) {
    console.error('Error fetching models:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the function
listOpenRouterModels().catch(console.error); 