import { RealtimeAgent } from '@openai/agents/realtime';

export const simulatedHumanAgent = new RealtimeAgent({
  name: 'simulatedHuman',
  voice: 'sage',
  handoffDescription: 'Simulated human agent.',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});
