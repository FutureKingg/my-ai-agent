import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const authenticationAgent = new RealtimeAgent({
  name: 'authentication',
  voice: 'sage',  
  handoffDescription:
    'The initial agent that greets the user, does authentication and routes them to the correct downstream agent.',

  instructions: `You are a helpful assistant.`,

  tools: [],

  handoffs: [],
});

