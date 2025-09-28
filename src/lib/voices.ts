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
    description: '중립적이고 균형 잡힌',
    gender: 'male'
  },
  {
    id: 'openai-echo',
    name: 'Echo',
    voice: 'echo',
    description: '공명하고 깊은',
    gender: 'male'
  },
  {
    id: 'openai-onyx',
    name: 'Onyx',
    voice: 'onyx',
    description: '강하고 자신감 있는',
    gender: 'male'
  },
  {
    id: 'openai-nova',
    name: 'Nova',
    voice: 'nova',
    description: '밝고 표현력이 풍부한',
    gender: 'female'
  },
  {
    id: 'openai-sage',
    name: 'Sage',
    voice: 'sage',
    description: '침착하고 사려 깊은',
    gender: 'male'
  },
  {
    id: 'openai-shimmer',
    name: 'Shimmer',
    voice: 'shimmer',
    description: '밝고 에너지가 넘치는',
    gender: 'female'
  },
  {
    id: 'openai-ash',
    name: 'Ash',
    voice: 'ash',
    description: '맑고 정확한 발음',
    gender: 'female'
  },
  {
    id: 'openai-ballad',
    name: 'Ballad',
    voice: 'ballad',
    description: '부드럽고 멜로디컬한',
    gender: 'male'
  },
  {
    id: 'openai-coral',
    name: 'Coral',
    voice: 'coral',
    description: '따뜻하고 친근한',
    gender: 'female'
  },
  {
    id: 'openai-verse',
    name: 'Verse',
    voice: 'verse',
    description: '다재다능하고 표현력이 뛰어난',
    gender: 'male'
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
