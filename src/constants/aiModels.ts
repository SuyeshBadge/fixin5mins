/**
 * Constants for AI models used in the application
 */

/**
 * Free models available on OpenRouter
 */
export const FREE_MODELS = {
  META_LLAMA_4_MAVERICK: 'meta-llama/llama-4-maverick:free',
  META_LLAMA_3_8B: 'meta-llama/llama-3.1-8b-instruct:free',
  QWEN_7B: 'qwen/qwen3-4b:free',
  MISTRAL_SMALL: 'mistralai/mistral-small-3.1-24b-instruct:free'
};

/**
 * Default model for our use case
 */
export const DEFAULT_MODEL = FREE_MODELS.QWEN_7B; 