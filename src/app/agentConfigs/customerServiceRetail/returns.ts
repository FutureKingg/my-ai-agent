import { RealtimeAgent } from '@openai/agents/realtime';

export const returnsAgent = new RealtimeAgent({
  name: 'returns',
  voice: 'sage',
  handoffDescription: 'Customer Service Agent specialized in returns.',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});

