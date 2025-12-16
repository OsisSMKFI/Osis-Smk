/**
 * Vercel AI Gateway Integration
 * Built on AI SDK 5 with @ai-sdk/gateway
 * 
 * Uses Vercel AI Gateway for unified access to all AI models
 * Get your API key from: Vercel Dashboard > AI Gateway > Create API Key
 * 
 * @see https://sdk.vercel.ai/docs
 * @see https://vercel.com/docs/ai
 */

import { streamText, generateText, generateObject, type CoreMessage } from 'ai';
import { gateway } from '@ai-sdk/gateway';

// Vercel AI Gateway API Key
const AI_GATEWAY_KEY = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_KEY;

/**
 * Check if AI Gateway is properly configured
 */
export function getAIGatewayStatus() {
  return {
    mode: 'vercel-gateway',
    configured: !!AI_GATEWAY_KEY,
    endpoint: 'https://gateway.ai.vercel.sh/v1',
    anyAvailable: !!AI_GATEWAY_KEY,
    defaultProvider: AI_GATEWAY_KEY ? 'vercel-gateway' : null,
    availableModels: AI_GATEWAY_KEY ? [
      'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4-turbo', 'openai/o1', 'openai/o1-mini',
      'anthropic/claude-3-5-sonnet', 'anthropic/claude-3-5-haiku', 'anthropic/claude-3-opus',
      'google/gemini-2.0-flash', 'google/gemini-1.5-pro', 'google/gemini-1.5-flash',
    ] : [],
  };
}

// Model aliases - using gateway() function for all models
export type ModelName = 
  | 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'o1' | 'o1-mini'
  | 'claude-3-5-sonnet' | 'claude-3-5-haiku' | 'claude-3-opus'
  | 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash';

// Map simple names to gateway model IDs
const modelMapping: Record<ModelName, string> = {
  'gpt-4o': 'openai/gpt-4o',
  'gpt-4o-mini': 'openai/gpt-4o-mini',
  'gpt-4-turbo': 'openai/gpt-4-turbo',
  'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
  'o1': 'openai/o1',
  'o1-mini': 'openai/o1-mini',
  'claude-3-5-sonnet': 'anthropic/claude-3-5-sonnet-latest',
  'claude-3-5-haiku': 'anthropic/claude-3-5-haiku-latest',
  'claude-3-opus': 'anthropic/claude-3-opus-latest',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-exp',
  'gemini-1.5-pro': 'google/gemini-1.5-pro',
  'gemini-1.5-flash': 'google/gemini-1.5-flash',
};

function getModel(name: ModelName) {
  return gateway(modelMapping[name]);
}

/**
 * Stream text from any AI model via Vercel AI Gateway (with prompt)
 */
export async function streamAITextWithPrompt(options: {
  model: ModelName;
  prompt: string;
  system?: string;
  temperature?: number;
}) {
  const { model, prompt, system, temperature = 0.7 } = options;

  return streamText({
    model: getModel(model),
    prompt,
    system,
    temperature,
  });
}

/**
 * Stream text from any AI model via Vercel AI Gateway (with messages)
 */
export async function streamAIText(options: {
  model: ModelName;
  messages: CoreMessage[];
  system?: string;
  temperature?: number;
}) {
  const { model, messages, system, temperature = 0.7 } = options;

  return streamText({
    model: getModel(model),
    messages,
    system,
    temperature,
  });
}

/**
 * Generate text (non-streaming) from any AI model with prompt
 */
export async function generateAITextWithPrompt(options: {
  model: ModelName;
  prompt: string;
  system?: string;
  temperature?: number;
}) {
  const { model, prompt, system, temperature = 0.7 } = options;

  return generateText({
    model: getModel(model),
    prompt,
    system,
    temperature,
  });
}

/**
 * Generate text (non-streaming) from any AI model with messages
 */
export async function generateAIText(options: {
  model: ModelName;
  messages: CoreMessage[];
  system?: string;
  temperature?: number;
}) {
  const { model, messages, system, temperature = 0.7 } = options;

  return generateText({
    model: getModel(model),
    messages,
    system,
    temperature,
  });
}

/**
 * Generate structured object from AI with Zod schema validation
 */
export async function generateAIObject<T>(options: {
  model: ModelName;
  prompt: string;
  system?: string;
  schema: import('zod').ZodSchema<T>;
}) {
  const { model, prompt, system, schema } = options;

  return generateObject({
    model: getModel(model),
    prompt,
    system,
    schema,
  });
}

/**
 * Quick helper for simple chat completion
 */
export async function chat(
  message: string,
  options?: {
    model?: ModelName;
    system?: string;
    temperature?: number;
  }
) {
  const { model = 'gpt-4o-mini', system, temperature = 0.7 } = options || {};

  const result = await generateText({
    model: getModel(model),
    prompt: message,
    system,
    temperature,
  });

  return result.text;
}

/**
 * Analyze text with AI (useful for content moderation, sentiment, etc.)
 */
export async function analyzeText(
  text: string,
  analysisType: 'sentiment' | 'moderation' | 'summary' | 'classification',
  options?: { model?: ModelName }
) {
  const model = options?.model || 'gpt-4o-mini';

  const prompts = {
    sentiment: `Analyze the sentiment of this text and respond with JSON: { "sentiment": "positive" | "negative" | "neutral", "confidence": 0-1, "emotions": string[] }

Text: ${text}`,
    moderation: `Check this text for inappropriate content and respond with JSON: { "safe": boolean, "categories": string[], "reasoning": string }

Text: ${text}`,
    summary: `Summarize this text concisely in 2-3 sentences:

${text}`,
    classification: `Classify this text into relevant categories and respond with JSON: { "categories": string[], "primaryCategory": string, "confidence": 0-1 }

Text: ${text}`,
  };

  const result = await generateText({
    model: getModel(model),
    prompt: prompts[analysisType],
    temperature: 0.3,
  });

  return result.text;
}
