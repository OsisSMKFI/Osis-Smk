/**
 * Vercel AI Gateway Test Script
 * Run with: npx tsx gateway.ts
 */

import { streamText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { config } from 'dotenv';

// Load .env.local first, then .env
config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
  console.log('🚀 Testing Vercel AI Gateway...');
  console.log('');
  
  // Check if API key is available
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_KEY;
  if (!apiKey) {
    console.error('❌ No AI Gateway API key found!');
    console.error('   Set AI_GATEWAY_API_KEY or VERCEL_AI_GATEWAY_KEY in .env.local');
    process.exit(1);
  }
  
  console.log('✅ API Key found');
  console.log('📡 Connecting to Vercel AI Gateway...');
  console.log('');

  const result = streamText({
    model: gateway('openai/gpt-4o-mini'),
    prompt: 'Say "Hello from Vercel AI Gateway!" in a creative way, then explain what you are in one sentence.',
  });

  process.stdout.write('🤖 Response: ');
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }

  console.log('\n');
  console.log('📊 Token usage:', await result.usage);
  console.log('✅ Finish reason:', await result.finishReason);
  console.log('');
  console.log('🎉 AI Gateway is working!');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
