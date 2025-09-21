export interface Voice {
  id: string;
  name: string;
  voice: string;
  description: string;
  gender: 'male' | 'female';
}

export const voices: Voice[] = [
  {
    id: 'openai-alloy',
    name: 'Alloy',
    voice: 'alloy',
    description: '밝고 친근한',
    gender: 'female'
  },
  {
    id: 'openai-echo',
    name: 'Echo',
    voice: 'echo',
    description: '따뜻한',
    gender: 'male'
  },
  {
    id: 'openai-fable',
    name: 'Fable',
    voice: 'fable',
    description: '영국식 억양',
    gender: 'male'
  },
  {
    id: 'openai-onyx',
    name: 'Onyx',
    voice: 'onyx',
    description: '깊고 강렬한',
    gender: 'male'
  },
  {
    id: 'openai-nova',
    name: 'Nova',
    voice: 'nova',
    description: '젊고 활기찬',
    gender: 'female'
  },
  {
    id: 'openai-sage',
    name: 'Sage',
    voice: 'sage',
    description: '차분하고 전문적',
    gender: 'female'
  },
  {
    id: 'openai-shimmer',
    name: 'Shimmer',
    voice: 'shimmer',
    description: '부드럽고 매력적인',
    gender: 'female'
  }
];

export const getVoiceById = (voiceId: string): Voice => {
  const voice = voices.find(v => v.id === voiceId);
  return voice || voices[0]; // 기본값으로 첫 번째 음성 반환
};

export const getVoiceByVoiceName = (voiceName: string): Voice => {
  const voice = voices.find(v => v.voice === voiceName);
  return voice || voices[0]; // 기본값으로 첫 번째 음성 반환
};
