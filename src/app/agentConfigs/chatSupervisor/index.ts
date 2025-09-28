import { RealtimeAgent } from '@openai/agents/realtime';

export const chatAgent = new RealtimeAgent({
  name: 'chatAgent',
  voice: 'sage',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});

export const chatSupervisorScenario = [chatAgent];
export const chatSupervisorCompanyName = "Chat Supervisor";