/**
 * Constants for AI models used in the application
 */

/**
 * Free models available on OpenRouter
 */
export const FREE_MODELS = {
  MISTRAL_SMALL: 'mistralai/mistral-small',
  MISTRAL_TINY: 'mistralai/mistral-tiny',
  DEEPSEEK_CHAT: 'deepseek-ai/deepseek-chat-1.3b',
  QWEN_7B: 'qwen/qwen3-4b:free'
};

/**
 * Default model for our use case
 */
export const DEFAULT_MODEL = FREE_MODELS.QWEN_7B; 