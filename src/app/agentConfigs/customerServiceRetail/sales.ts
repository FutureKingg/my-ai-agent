import { RealtimeAgent } from '@openai/agents/realtime';

export const salesAgent = new RealtimeAgent({
  name: 'salesAgent',
  voice: 'sage',
  handoffDescription: 'Handles sales-related inquiries.',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});