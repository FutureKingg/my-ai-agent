import { RealtimeAgent } from '@openai/agents/realtime';

export const simpleAgent = new RealtimeAgent({
  name: 'simpleAgent',
  voice: 'sage',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});

export const simpleHandoffScenario = [simpleAgent];