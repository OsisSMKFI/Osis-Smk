import { getUserProfileContext } from './aiAutoLearn';

export async function buildAIContext(): Promise<string> {
  const context: string[] = [];

  // Global discipline
  context.push(`
Answer based only on relevant information.
Do not force unrelated context into the reply.
`);

  // Silent background (always loaded)
  context.push(getUserProfileContext());

  return context.join('\n');
}

console.log('🧠 [AI] buildAIContext EXECUTED');
