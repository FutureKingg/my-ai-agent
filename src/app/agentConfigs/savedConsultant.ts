import { RealtimeAgent } from '@openai/agents/realtime';

export const savedConsultantAgent = new RealtimeAgent({
  name: 'savedConsultant',
  voice: 'sage',
  instructions: `You are a helpful assistant.`,
  tools: [],
  handoffs: [],
});

export const savedConsultantScenario = [savedConsultantAgent];
export const savedConsultantCompanyName = "저장된 상담사";
