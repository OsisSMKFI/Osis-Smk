/**
 * Vercel AI Gateway Integration
 * Built on AI SDK 5 - Switch between 100+ models without managing rate limits
 * 
 * Supported providers: OpenAI, Anthropic, xAI, Google, Mistral, Cohere, and more
 * 
 * @see https://sdk.vercel.ai/docs
 */

import { streamText, generateText, generateObject, type CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Vercel AI Gateway API Key
const VERCEL_AI_API_KEY = process.env.VERCEL_AI_API_KEY || process.env.AI_GATEWAY_API_KEY;

// Create provider instances with Vercel AI Gateway
export const openai = createOpenAI({
  apiKey: VERCEL_AI_API_KEY,
  baseURL: 'https://api.vercel.ai/v1',
});

export const anthropic = createAnthropic({
  apiKey: VERCEL_AI_API_KEY,
  baseURL: 'https://api.vercel.ai/v1',
});

export const google = createGoogleGenerativeAI({
  apiKey: VERCEL_AI_API_KEY,
  baseURL: 'https://api.vercel.ai/v1',
});

// Model aliases for easier usage
export const models = {
  // OpenAI Models
  'gpt-4o': openai('gpt-4o'),
  'gpt-4o-mini': openai('gpt-4o-mini'),
  'gpt-4-turbo': openai('gpt-4-turbo'),
  'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
  'o1': openai('o1'),
  'o1-mini': openai('o1-mini'),
  
  // Anthropic Models
  'claude-3-5-sonnet': anthropic('claude-3-5-sonnet-20241022'),
  'claude-3-5-haiku': anthropic('claude-3-5-haiku-20241022'),
  'claude-3-opus': anthropic('claude-3-opus-20240229'),
  
  // Google Models
  'gemini-2.0-flash': google('gemini-2.0-flash-exp'),
  'gemini-1.5-pro': google('gemini-1.5-pro'),
  'gemini-1.5-flash': google('gemini-1.5-flash'),
} as const;

export type ModelName = keyof typeof models;

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
    model: models[model],
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
    model: models[model],
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
    model: models[model],
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
    model: models[model],
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
    model: models[model],
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
    model: models[model],
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
    model: models[model],
    prompt: prompts[analysisType],
    temperature: 0.3,
  });

  return result.text;
}
