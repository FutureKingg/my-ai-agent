import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const authenticationAgent = new RealtimeAgent({
  name: 'authentication',
  voice: 'sage',  
  handoffDescription:
    'The initial agent that greets the user, does authentication and routes them to the correct downstream agent.',

  instructions: `You are a customer service representative. When the conversation starts, you MUST immediately greet the user and ask how you can help them today. Do not wait for the user to speak first. Start the conversation by saying "안녕하세요! 고객 서비스 담당자입니다. 어떻게 도와드릴까요?" You must speak first, before the user says anything. This is very important - you must greet the user immediately when the conversation starts.`,

  tools: [],

  handoffs: [],
});

