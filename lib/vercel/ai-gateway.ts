/**
 * Vercel AI Gateway Integration
 * Built on AI SDK 5 - Switch between 100+ models without managing rate limits
 * 
 * Two modes:
 * 1. VERCEL_AI_GATEWAY_KEY - Use Vercel AI Gateway proxy (recommended)
 * 2. Provider API keys - Direct connection to OpenAI/Anthropic/Google
 * 
 * @see https://sdk.vercel.ai/docs
 * @see https://vercel.com/docs/ai
 */

import { streamText, generateText, generateObject, type CoreMessage } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Vercel AI Gateway Key (from Vercel Dashboard > AI Gateway)
const VERCEL_AI_GATEWAY_KEY = process.env.VERCEL_AI_GATEWAY_KEY || process.env.AI_GATEWAY_API_KEY;

// Fallback: Direct provider API keys
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// Use Vercel AI Gateway if key is available, otherwise use direct provider keys
const useGateway = !!VERCEL_AI_GATEWAY_KEY;

// Create provider instances
export const openai = createOpenAI({
  apiKey: useGateway ? VERCEL_AI_GATEWAY_KEY : OPENAI_API_KEY,
  baseURL: useGateway ? 'https://gateway.ai.vercel.sh/v1' : undefined,
});

export const anthropic = createAnthropic({
  apiKey: useGateway ? VERCEL_AI_GATEWAY_KEY : ANTHROPIC_API_KEY,
  baseURL: useGateway ? 'https://gateway.ai.vercel.sh/v1' : undefined,
});

export const google = createGoogleGenerativeAI({
  apiKey: useGateway ? VERCEL_AI_GATEWAY_KEY : GOOGLE_API_KEY,
  baseURL: useGateway ? 'https://gateway.ai.vercel.sh/v1' : undefined,
});

/**
 * Check if AI Gateway is properly configured
 */
export function getAIGatewayStatus() {
  return {
    mode: useGateway ? 'vercel-gateway' : 'direct-providers',
    vercelGateway: {
      configured: !!VERCEL_AI_GATEWAY_KEY,
      endpoint: 'https://gateway.ai.vercel.sh/v1',
    },
    openai: {
      configured: useGateway || !!OPENAI_API_KEY,
      provider: 'OpenAI',
    },
    anthropic: {
      configured: useGateway || !!ANTHROPIC_API_KEY,
      provider: 'Anthropic',
    },
    google: {
      configured: useGateway || !!GOOGLE_API_KEY,
      provider: 'Google',
    },
    anyAvailable: useGateway || !!(OPENAI_API_KEY || ANTHROPIC_API_KEY || GOOGLE_API_KEY),
    defaultProvider: useGateway ? 'vercel-gateway' : (OPENAI_API_KEY ? 'openai' : ANTHROPIC_API_KEY ? 'anthropic' : GOOGLE_API_KEY ? 'google' : null),
  };
}

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
