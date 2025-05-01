import { AiServiceClient } from '../services/aiService';
import { DEFAULT_MODEL, FREE_MODELS } from '../constants/aiModels';
import config from '../config';

const testPrompt = "Create a short emotional hook about mindfulness practice for Instagram.";
const systemPrompt = "You are an expert at creating engaging social media content.";

async function testModel(model: string) {
  console.log(`\nTesting model: ${model}`);
  console.log("=".repeat(50));
  
  const aiClient = new AiServiceClient();
  
  try {
    console.log("Sending prompt:", testPrompt);
    const startTime = Date.now();
    const result = await aiClient.generateContent(testPrompt, model, systemPrompt);
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`\nResult (${duration.toFixed(2)}s):`);
    console.log(result);
    console.log(`\nCharacter count: ${result.length}`);
    return true;
  } catch (error: any) {
    console.error(`Error with model ${model}:`, error.message || String(error));
    return false;
  }
}

async function testFallbackMechanism() {
  console.log("\nTesting fallback mechanism");
  console.log("=".repeat(50));
  
  const aiClient = new AiServiceClient();
  
  try {
    // Intentionally use an invalid model first to trigger fallback
    const invalidModel = "non-existent-model";
    console.log(`Starting with invalid model "${invalidModel}" to test fallback`);
    
    const result = await aiClient.generateContentWithFallback(
      "What are 3 benefits of meditation?",
      "You are a helpful assistant specialized in wellness topics."
    );
    
    console.log("\nFallback result:");
    console.log(result);
    return true;
  } catch (error: any) {
    console.error("Fallback mechanism failed:", error.message || String(error));
    return false;
  }
}

async function main() {
  console.log("OpenRouter Test");
  console.log("=".repeat(50));
  console.log("API Key:", config.openRouter.apiKey ? "✓ Present" : "✗ Missing");
  console.log("Default model:", config.openRouter.defaultModel || DEFAULT_MODEL);
  
  // Test each free model
  for (const [modelName, modelId] of Object.entries(FREE_MODELS)) {
    console.log(`\n${modelName}: ${modelId}`);
    await testModel(modelId);
  }
  
  // Test fallback mechanism
  await testFallbackMechanism();
}

// Run the tests
main().catch(console.error); 