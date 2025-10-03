"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";
import MicrophoneSettings from "./components/MicrophoneSettings";

// Types
import { SessionStatus } from "@/app/types";
import { RealtimeAgent } from '@openai/agents/realtime';

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";
import { industryCategories, getDefaultSettingsByIndustry } from "@/app/lib/industryCategories";

// Agent configs
// import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs"; // 제거됨
import { customerServiceRetailScenario } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorScenario } from "@/app/agentConfigs/chatSupervisor";
import { customerServiceRetailCompanyName } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorCompanyName } from "@/app/agentConfigs/chatSupervisor";
import { simpleHandoffScenario } from "@/app/agentConfigs/simpleHandoff";
import { savedConsultantScenario, savedConsultantCompanyName } from "@/app/agentConfigs/savedConsultant";

// Voice configs
import { voices, getVoiceById } from "@/lib/voices";

// Base scenarios - only essential ones
const baseScenarioMap: Record<string, RealtimeAgent[]> = {
  newConsultant: savedConsultantScenario,
};

import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";
import { useUsageTracking } from "./hooks/useUsageTracking";
import UsageTrackerComponent from "./components/UsageTracker";
import SpeechQualityIndicator from "./components/SpeechQualityIndicator";
import { RealTimeUsageTracker } from "./lib/realTimeUsageTracker";
import { SpeechRecognitionFilter, SpeechQualityTracker } from "./lib/speechRecognitionFilter";

function App() {
  const searchParams = useSearchParams()!;

  // ---------------------------------------------------------------------
  // Codec selector – lets you toggle between wide-band Opus (48 kHz)
  // and narrow-band PCMU/PCMA (8 kHz) to hear what the agent sounds like on
  // a traditional phone line and to validate ASR / VAD behaviour under that
  // constraint.
  //
  // We read the `?codec=` query-param and rely on the `changePeerConnection`
  // hook (configured in `useRealtimeSession`) to set the preferred codec
  // before the offer/answer negotiation.
  // ---------------------------------------------------------------------
  const urlCodec = searchParams.get("codec") || "opus";

  // Agents SDK doesn't currently support codec selection so it is now forced 
  // via global codecPatch at module load 

  const {
    addTranscriptMessage,
    addTranscriptBreadcrumb,
  } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<
    RealtimeAgent[] | null
  >(null);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>("openai-sage");
  const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState<boolean>(false);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [conversationStyle, setConversationStyle] = useState<string>("standard");
  const [customConversationStyle, setCustomConversationStyle] = useState<string>("");
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(false);
  const [echoCancellation, setEchoCancellation] = useState<boolean>(false);
  const [autoGainControl, setAutoGainControl] = useState<boolean>(false);
  const [vadThreshold, setVadThreshold] = useState<number>(0.7); // VAD 임계값
  const [isMicrophoneSettingsOpen, setIsMicrophoneSettingsOpen] = useState<boolean>(false);
  
  // 상담사 설정 관련 상태
  const [consultantStoreName, setConsultantStoreName] = useState<string>("");
  const [consultantGreeting, setConsultantGreeting] = useState<string>("");
  const [consultantRole, setConsultantRole] = useState<string>("");
  const [consultantInfo, setConsultantInfo] = useState<string>("");
  const [industryBasedSettings, setIndustryBasedSettings] = useState<any>(null);

  // 대화 스타일 매핑 (SYSTEM 지시로 변경)
  const conversationStyleMap = {
    calm: `SYSTEM: 모든 응답을 차분하고 명확하게 해주세요.
SYSTEM: 천천히, 여유롭게 설명해주세요.
SYSTEM: 각 단어를 명확하게 발음하며 친근하게 대화해주세요.`,
    standard: `SYSTEM: 모든 응답을 빠르고 간결하게 해주세요.
SYSTEM: 응답 시간을 최대한 단축하고, 불필요한 설명은 생략해주세요.
SYSTEM: 질문에 대해 즉시 핵심만 답변해주세요.`,
    energetic: `SYSTEM: 모든 응답을 즉시, 에너지 있게 해주세요.
SYSTEM: 활기차고 빠르게 답변해주세요.
SYSTEM: 동기부여가 되는 톤으로 대화해주세요.`,
    custom: ""
  };

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Ref to identify whether the latest agent switch came from an automatic handoff
  const handoffTriggeredRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    el.playbackRate = voiceSpeed; // Set initial playback rate
    document.body.appendChild(el);
    console.log('🎵 SDK Audio Element created with playbackRate:', el.playbackRate);
    return el;
  }, [voiceSpeed]);

  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const {
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
    onAgentHandoff: (agentName: string) => {
      handoffTriggeredRef.current = true;
      // Agent handoff is handled automatically by the SDK
    },
    onResponseComplete: (itemId: string) => {
      console.log('🎵 Response complete, applying audio speed:', voiceSpeed);
      // Apply audio speed when AI response is complete
      setTimeout(() => {
        applyAudioSpeedToAllElements(voiceSpeed);
      }, 100);
    },
  });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(false);
  const [isConsultantSettingsOpen, setIsConsultantSettingsOpen] = useState<boolean>(false);
  const [isScenarioNameModalOpen, setIsScenarioNameModalOpen] = useState<boolean>(false);
  const [editingScenarioKey, setEditingScenarioKey] = useState<string>("");
  const [newScenarioName, setNewScenarioName] = useState<string>("");
  const [isSaveConsultantModalOpen, setIsSaveConsultantModalOpen] = useState<boolean>(false);
  const [consultantSaveName, setConsultantSaveName] = useState<string>("");
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [deletingScenarioKey, setDeletingScenarioKey] = useState<string>("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<string>("newConsultant");
  const [scenarioNames, setScenarioNames] = useState<Record<string, string>>({
    newConsultant: "AI 상담사 생성"
  });
  const [savedConsultants, setSavedConsultants] = useState<Record<string, {
    name: string;
    greeting: string;
    role: string;
    info: string;
    storeName: string;
    voiceId: string;
    voiceSpeed: number;
    conversationStyle: string;
    customConversationStyle: string;
    industry?: string;
    companyName?: string;
    businessHours?: string;
    location?: string;
    serviceTypes?: string[];
  }>>({});
  const [userText, setUserText] = useState<string>("");

  // 사용량 추적
  const [currentUserId] = useState<string>(() => {
    // 실제로는 로그인된 사용자 ID를 사용
    return `user_${Date.now()}`;
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const {
    usage,
    stats,
    canMakeCall,
    remainingTime,
    startCall: startCallTracking,
    endCall: endCallTracking,
    formatTime,
    isLoading: usageLoading
  } = useUsageTracking(currentUserId);

  // Note: Voice speed is now handled during connection, not in real-time

  // Apply voice speed when slider changes (client-side audio processing)
  const handleVoiceSpeedChange = (newSpeed: number) => {
    setVoiceSpeed(newSpeed);
    console.log('🎵 Voice speed changed to:', newSpeed);
    
    // Apply to all audio elements immediately
    applyAudioSpeedToAllElements(newSpeed);
  };

  // Voice preview function
  const playVoicePreview = async (voiceId: string) => {
    const selectedVoice = getVoiceById(voiceId);
    console.log('🎵 Playing voice preview with OpenAI TTS:', selectedVoice);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: '안녕하세요 상담사 목소리 테스트입니다.',
          voice: selectedVoice.voice,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS API request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('🎵 Voice preview failed:', error);
    }
  };

  // Apply speed to all audio elements on the page (simplified)
  const applyAudioSpeedToAllElements = (speed: number) => {
    const audioElements = document.querySelectorAll('audio');
    console.log('🎵 SIMPLE: Applying speed to', audioElements.length, 'audio elements');
    
    audioElements.forEach((audio, index) => {
      console.log(`🎵 SIMPLE: Audio ${index} playbackRate: ${audio.playbackRate} -> ${speed}`);
      audio.playbackRate = speed;
    });
  };

  // Create dynamic scenario map including saved consultants
  const sdkScenarioMap = useMemo(() => {
    const dynamicMap = { ...baseScenarioMap };
    
    // Add saved consultants as scenarios
    Object.keys(savedConsultants).forEach(consultantId => {
      dynamicMap[consultantId] = savedConsultantScenario;
    });
    
    // Remove deleted scenarios from the map (but keep base scenarios)
    const baseScenarioKeys = Object.keys(baseScenarioMap);
    Object.keys(scenarioNames).forEach(scenarioKey => {
      // Only remove if it's not a base scenario and it's deleted
      if (!baseScenarioKeys.includes(scenarioKey) && !scenarioNames[scenarioKey]) {
        delete dynamicMap[scenarioKey];
      }
    });
    
    return dynamicMap;
  }, [savedConsultants, scenarioNames]);
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);
  const [isPTTUserSpeaking, setIsPTTUserSpeaking] = useState<boolean>(false);
  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return true;
      const stored = localStorage.getItem('audioPlaybackEnabled');
      return stored ? stored === 'true' : true;
    },
  );

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useHandleSessionHistory();

  useEffect(() => {
    let finalAgentConfig = searchParams.get("agentConfig");
    if (!finalAgentConfig || !sdkScenarioMap[finalAgentConfig]) {
      finalAgentConfig = "newConsultant";
      const url = new URL(window.location.toString());
      url.searchParams.set("agentConfig", finalAgentConfig);
      window.location.replace(url.toString());
      return;
    }

    const agents = sdkScenarioMap[finalAgentConfig];
    setSelectedAgentConfigSet(agents);
  }, [searchParams, sdkScenarioMap]);

  // 자동 연결 기능 제거 - 사용자가 Connect 버튼을 클릭할 때만 연결

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet
    ) {
      const currentAgent = selectedAgentConfigSet[0]; // Use first agent as root
      console.log(`🤖 Agent: ${currentAgent.name}`, currentAgent);
      // 채팅창에는 표시하지 않고 콘솔에만 로그
      updateSession(!handoffTriggeredRef.current);
      // Reset flag after handling so subsequent effects behave normally
      handoffTriggeredRef.current = false;
    }
  }, [selectedAgentConfigSet, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive, sessionStatus]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async () => {
    // 사용량 확인
    if (!canMakeCall) {
      alert('무료 체험 시간이 모두 소진되었습니다. 유료 플랜으로 업그레이드해주세요.');
      return;
    }

    const agentSetKey = selectedAgentConfig;
    console.log('🎵 Connecting to realtime with agentSetKey:', agentSetKey);
    console.log('🎵 Available scenarios:', Object.keys(sdkScenarioMap));
    
    if (!sdkScenarioMap[agentSetKey]) {
      console.error('🎵 Scenario not found:', agentSetKey);
      setSessionStatus("DISCONNECTED");
      return;
    }
    
    if (sessionStatus !== "DISCONNECTED") {
      console.log('🎵 Already connected or connecting');
      return;
    }
    
    setSessionStatus("CONNECTING");

    // 통화 세션 시작 (연결 성공 후에만 시간 추적)
    const sessionId = startCallTracking();
    if (!sessionId) {
      alert('통화를 시작할 수 없습니다. 사용량을 확인해주세요.');
      setSessionStatus("DISCONNECTED");
      return;
    }
    setCurrentSessionId(sessionId);
    
    // 실시간 사용량 추적은 연결 성공 후에 시작

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) {
        console.error('🎵 No ephemeral key received');
        setSessionStatus("DISCONNECTED");
        return;
      }
      
      console.log('🎵 Ephemeral key received, starting connection...');

        // Use the first agent as root (no reordering needed)
        const agents = [...sdkScenarioMap[agentSetKey]];

        // Check if this is a saved consultant (outside the loop for access)
        const savedConsultant = savedConsultants[agentSetKey];
        
        if (agentSetKey.startsWith('consultant_') && !savedConsultant) {
          console.error('🎵 Saved consultant not found:', agentSetKey);
          setSessionStatus("DISCONNECTED");
          alert('저장된 상담사 데이터를 찾을 수 없습니다. 새로고침 후 다시 시도해주세요.');
          return;
        }

        // Apply selected voice and COMPLETELY REPLACE instructions with user prompts
        const voiceIdToUse = savedConsultant ? (savedConsultant.voiceId || selectedVoiceId) : selectedVoiceId;
        const selectedVoice = getVoiceById(voiceIdToUse);
        const finalVoiceSpeed = savedConsultant ? (savedConsultant.voiceSpeed || 1.0) : voiceSpeed;
        
        console.log('🎵 Voice Settings:', {
          voiceIdToUse,
          selectedVoiceId,
          savedConsultantVoiceId: savedConsultant?.voiceId,
          selectedVoice: selectedVoice.voice,
          voiceSpeed,
          savedConsultantSpeed: savedConsultant?.voiceSpeed,
          finalVoiceSpeed,
          agentSetKey,
          sessionStatus,
          timestamp: new Date().toISOString()
        });
        
        // Create completely new agents array with updated voice and speed
        const newAgents = agents.map((agent) => {
          // Create completely new agent instance with updated voice and speed
          const newAgent = new RealtimeAgent({
            name: agent.name,
            voice: selectedVoice.voice,  // Use selected voice
            instructions: agent.instructions,
            tools: agent.tools || [],
            handoffs: agent.handoffs || [],
            handoffDescription: agent.handoffDescription
          });
          
          console.log('🎵 Creating new agent:', {
            name: agent.name,
            voice: selectedVoice.voice,
            speed: finalVoiceSpeed,
            originalVoice: agent.voice
          });
          
          return newAgent;
        });
        
        // Replace the entire agents array
        agents.splice(0, agents.length, ...newAgents);
        
        console.log('🎵 All agents updated with voice:', selectedVoice.voice);
        console.log('🎵 Final agents array:', agents.map(a => ({ name: a.name, voice: a.voice })));
        console.log('🎵 About to connect with agents:', agents.map(a => ({ 
          name: a.name, 
          voice: a.voice, 
          instructionsLength: a.instructions?.length || 0 
        })));
        
        // Update agent instructions for each agent
        agents.forEach((agent) => {
          // COMPLETELY REPLACE agent instructions with user's custom prompts
          let customInstructions = "";
          
          // Get conversation style
          const currentStyle = savedConsultant ? (savedConsultant.conversationStyle || "standard") : conversationStyle;
          const currentCustomStyle = savedConsultant ? (savedConsultant.customConversationStyle || "") : customConversationStyle;
          
          let styleText = "";
          if (currentStyle === "custom") {
            // 사용자 지정이 비어있으면 기본 시스템 스타일만 적용 (빈 문자열 반환)
            styleText = currentCustomStyle || "";
          } else {
            styleText = conversationStyleMap[currentStyle as keyof typeof conversationStyleMap] || conversationStyleMap.standard;
          }
          
          // 한국어 대화 최적화 지시 추가
          const koreanOptimization = `SYSTEM: 말할 때 중간에 끊어 말하는 부분의 간격을 짧게 하여 자연스럽고 끊김 없이 말해주세요.
SYSTEM: 한국어 대화에 최적화된 속도와 리듬으로 답변해주세요.
SYSTEM: 문장과 문장 사이의 간격을 최소화하여 끊김 없는 자연스러운 대화를 해주세요.
SYSTEM: 숫자를 말할 때는 자연스러운 한국어로 발음해주세요. 예: "열시"가 아닌 "10시", "십시"가 아닌 "10시", "오전 열시부터 오후 십시까지"가 아닌 "오전 10시부터 오후 10시까지"로 말해주세요.
SYSTEM: 시간, 가격, 수량 등을 말할 때는 숫자를 명확하고 자연스럽게 발음해주세요.
SYSTEM: 메뉴 관련 질문에 답할 때는 질문한 내용에만 집중해서 답변해주세요. 예: "대표 메뉴는 뭐뭐있나요?"라고 물어보면 "삼겹살, 갈비입니다"라고 메뉴명만 답하고 가격은 말하지 마세요. 가격을 묻지 않았으면 가격을 말하지 마세요.
SYSTEM: 시간 관련 질문에 답할 때는 현재 시간 맥락을 고려해서 자연스럽게 답변해주세요. 예: 오후에 "9시에 방문한다"고 하면 오전 9시인지 오후 9시인지 묻지 말고, 당연히 오후 9시로 이해하고 답변해주세요. 시간을 말할 때는 맥락에 맞게 자연스럽게 해주세요.`;

          if (savedConsultant) {
            // Use saved consultant settings
            const greetingText = savedConsultant.greeting.trim() || "안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?";
            customInstructions += `SYSTEM: 당신은 상담원입니다. 첫 번째 메시지로 반드시 다음 문장을 정확히 그대로 말해야 합니다:

"${greetingText}"

이 문장 외에는 다른 어떤 단어도 추가하지 마세요. 변형하지 마세요. 정확히 이 문장만 말하세요.\n\n`;
            
            const roleText = (savedConsultant.role || "").trim() || "당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다.";
            customInstructions += `**역할 및 성격**: ${roleText}\n\n`;
            
            const storeNameText = (savedConsultant.storeName || "").trim() || "";
            const storeNameSection = storeNameText ? `**업체명**: ${storeNameText}\n\n` : "";
            customInstructions += storeNameSection;
            
            const infoText = (savedConsultant.info || "").trim() || "운영시간: 오전 10시 - 오후 10시\n메뉴: 삼겹살 15,000원, 갈비 25,000원\n주차: 건물 지하 1층, 2시간 무료\n최대 예약 가능 인원: 8명";
            customInstructions += `**참고 정보**: ${infoText}\n\n`;
            
            // Add conversation style and Korean optimization
            if (styleText) {
              customInstructions += `${styleText}\n\n`;
            }
            customInstructions += `${koreanOptimization}`;
          } else {
            // Use current form settings (for new consultants)
            const greetingText = (consultantGreeting || "").trim() || "안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?";
            customInstructions += `SYSTEM: 당신은 상담원입니다. 첫 번째 메시지로 반드시 다음 문장을 정확히 그대로 말해야 합니다:

"${greetingText}"

이 문장 외에는 다른 어떤 단어도 추가하지 마세요. 변형하지 마세요. 정확히 이 문장만 말하세요.\n\n`;
            
            const roleText = (consultantRole || "").trim() || "당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다.";
            customInstructions += `**역할 및 성격**: ${roleText}\n\n`;
            
            const storeNameText = (consultantStoreName || "").trim() || "";
            const storeNameSection = storeNameText ? `**업체명**: ${storeNameText}\n\n` : "";
            customInstructions += storeNameSection;
            
            const infoText = (consultantInfo || "").trim() || "운영시간: 오전 10시 - 오후 10시\n메뉴: 삼겹살 15,000원, 갈비 25,000원\n주차: 건물 지하 1층, 2시간 무료\n최대 예약 가능 인원: 8명";
            customInstructions += `**참고 정보**: ${infoText}\n\n`;
            
            // Add conversation style and Korean optimization
            if (styleText) {
              customInstructions += `${styleText}\n\n`;
            }
            customInstructions += `${koreanOptimization}`;
          }
          
          // COMPLETELY REPLACE instructions - no scenario instructions remain
          agent.instructions = customInstructions.trim();
          
          // Debug: Log the final instructions
          console.log('=== FINAL AGENT INSTRUCTIONS ===');
          console.log(agent.instructions);
          console.log('=== END INSTRUCTIONS ===');
        });

        const companyName = agentSetKey === 'customerServiceRetail'
          ? customerServiceRetailCompanyName
          : agentSetKey === 'savedConsultant'
          ? savedConsultantCompanyName
          : chatSupervisorCompanyName;
        const guardrail = createModerationGuardrail(companyName);

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        console.error('🎵 Connection timeout after 10 seconds');
        setSessionStatus("DISCONNECTED");
      }, 10000);

      console.log('🎵 연결 시도 중...', {
        agents: agents.length,
        voiceSpeed: finalVoiceSpeed,
        vadThreshold: vadThreshold,
        audioOptions: { noiseSuppression, echoCancellation, autoGainControl }
      });
      
      console.log('🎵 Final Agents Before Connect:', agents.map(agent => ({
        name: agent.name,
        voice: agent.voice,
        instructions: agent.instructions?.substring(0, 100) + '...'
      })));
      
      console.log('🎵 VAD 설정:', {
        threshold: vadThreshold,
        description: vadThreshold >= 0.7 ? '소음 많은 환경 (엄격)' : 
                    vadThreshold >= 0.5 ? '일반 환경 (보통)' : '조용한 환경 (민감)'
      });

      try {
        await connect({
          getEphemeralKey: async () => EPHEMERAL_KEY,
          initialAgents: agents,
          audioElement: sdkAudioElement,
          outputGuardrails: [guardrail],
          extraContext: {
            addTranscriptBreadcrumb,
          },
          voiceSpeed: finalVoiceSpeed,
          vadThreshold: vadThreshold,
          audioOptions: {
            noiseSuppression,
            echoCancellation,
            autoGainControl,
          },
        });

        // Clear timeout on successful connection
        clearTimeout(connectionTimeout);
        console.log('🎵 Connection established successfully');
        
        // 연결 성공 후에만 실시간 사용량 추적 시작
        RealTimeUsageTracker.startCall(currentUserId, sessionId);
      } catch (error) {
        console.error('🎵 Connection failed:', error);
        console.error('🎵 Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        clearTimeout(connectionTimeout);
        setSessionStatus("DISCONNECTED");
        
        // 연결 실패 시 사용량 추적 중지
        if (sessionId) {
          RealTimeUsageTracker.endCall(sessionId);
          endCallTracking(sessionId);
          setCurrentSessionId(null);
        }
        
        console.error('🎵 Connection error details:', {
          error: error,
          message: error.message,
          stack: error.stack,
          name: error.name,
          selectedVoice: selectedVoice.voice,
          voiceId: voiceIdToUse,
          agentVoice: agents[0]?.voice
        });
        alert(`연결에 실패했습니다: ${error.message}\n\n선택된 목소리: ${selectedVoice.name} (${selectedVoice.voice})\n에이전트 목소리: ${agents[0]?.voice}`);
        return;
      }

      console.log('🎵 Connected with voice speed:', finalVoiceSpeed);

      // Apply audio speed after connection (client-side)
      setTimeout(() => {
        console.log('🎵 Applying initial audio speed after connection:', finalVoiceSpeed);
        applyAudioSpeedToAllElements(finalVoiceSpeed);
      }, 2000); // Wait for audio elements to be created

      // Send an initial 'hi' message to trigger the agent to greet the user immediately
      setTimeout(() => {
        console.log('🎵 Sending initial greeting trigger...');
        sendSimulatedUserMessage('hi');
      }, 500); // Send immediately after connection
    } catch (err) {
      console.error("🎵 Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
      // Show user-friendly error message
      alert(`연결에 실패했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      return;
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
    
    // 통화 세션 종료
    if (currentSessionId) {
      RealTimeUsageTracker.endCall(currentSessionId);
      endCallTracking(currentSessionId);
      setCurrentSessionId(null);
    }
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: 'conversation.item.create',
      item: {
        id,
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    sendClientEvent({ type: 'response.create' }, '(simulated user text message)');
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // Reflect Push-to-Talk UI state by (de)activating server VAD on the
    // backend. The Realtime SDK supports live session updates via the
    // `session.update` event.
    const turnDetection = isPTTActive
      ? null
      : {
          type: 'server_vad',
          threshold: 0.9,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        };

    sendEvent({
      type: 'session.update',
      session: {
        turn_detection: turnDetection,
      },
    });

    // Send an initial 'hi' message to trigger the agent to greet the user
    if (shouldTriggerResponse) {
      console.log('🎵 Sending initial greeting trigger...');
      sendSimulatedUserMessage('hi');
    }
    return;
  }

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();

    try {
      sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };

  const handleTalkButtonDown = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTActive || isPTTUserSpeaking) return;

    interrupt();
    setIsPTTUserSpeaking(true);
    sendClientEvent({ type: 'input_audio_buffer.clear' }, 'clear PTT buffer');
  };

  const handleTalkButtonUp = () => {
    if (sessionStatus !== 'CONNECTED' || !isPTTActive || !isPTTUserSpeaking) return;

    setIsPTTUserSpeaking(false);
    sendClientEvent({ type: 'input_audio_buffer.commit' }, 'commit PTT');
    sendClientEvent({ type: 'response.create' }, 'trigger response PTT');
  };

  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      console.log('🎵 DISCONNECTING...');
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      console.log('🎵 CONNECTING...');
      // Ensure clean state before connecting
      setSessionStatus("DISCONNECTED");
      setTimeout(() => {
        connectToRealtime();
      }, 100);
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentConfig = e.target.value;
    setSelectedAgentConfig(newAgentConfig);
  };


  const handleVoiceChange = (newVoiceId: string) => {
    console.log('🎵 Voice change requested:', { from: selectedVoiceId, to: newVoiceId });
    
    setSelectedVoiceId(newVoiceId);
    setIsVoiceDropdownOpen(false);
    
    // Play voice preview
    playVoicePreview(newVoiceId);
    
    // If connected, force complete disconnection and reconnection
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      console.log('🎵 Voice changed while connected/connecting, forcing complete reconnection...');
      
      // Force disconnect and clear all state
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
      
      // Clear any pending timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Wait longer for complete cleanup, then reconnect
      setTimeout(() => {
        console.log('🎵 Reconnecting with new voice:', newVoiceId);
        connectToRealtime();
      }, 1500);
    }
  };

  // Because we need a new connection, refresh the page when codec changes
  const handleCodecChange = (newCodec: string) => {
    const url = new URL(window.location.toString());
    url.searchParams.set("codec", newCodec);
    window.location.replace(url.toString());
  };

  const handleConsultantSettingsClick = () => {
    console.log('상담사 설정 버튼 클릭됨');
    setIsConsultantSettingsOpen(!isConsultantSettingsOpen);
  };

  const handleSaveConsultantSettings = () => {
    console.log('🎵 Save button clicked! selectedAgentConfig:', selectedAgentConfig);
    console.log('🎵 Current form values:', {
      consultantGreeting,
      consultantRole,
      consultantInfo,
      consultantStoreName,
      selectedVoiceId,
      voiceSpeed,
      conversationStyle,
      customConversationStyle
    });
    
    // 새 상담사인 경우에만 이름 입력 모달 열기
    if (selectedAgentConfig === "newConsultant") {
      console.log('🎵 Opening save modal for new consultant');
      setConsultantSaveName("");
      setIsSaveConsultantModalOpen(true);
    } else if (selectedAgentConfig.startsWith("consultant_")) {
      // 저장된 상담사인 경우 현재 폼의 값으로 업데이트
      const existingConsultant = savedConsultants[selectedAgentConfig];
      if (existingConsultant) {
        const updatedConsultant = {
          ...existingConsultant,
          greeting: consultantGreeting,
          role: consultantRole,
          info: consultantInfo,
          storeName: consultantStoreName,
          voiceId: selectedVoiceId,
          voiceSpeed: voiceSpeed,
          conversationStyle: conversationStyle,
          customConversationStyle: customConversationStyle,
          industry: industryBasedSettings?.industry,
          companyName: industryBasedSettings?.companyName,
          businessHours: industryBasedSettings?.businessHours,
          location: industryBasedSettings?.location,
          serviceTypes: industryBasedSettings?.serviceTypes
        };
        
        setSavedConsultants(prev => ({
          ...prev,
          [selectedAgentConfig]: updatedConsultant
        }));
        
        showToast(`"${existingConsultant.name}" 상담사 설정이 업데이트되었습니다.`, 'success');
      }
    }
  };

  const handleConfirmSaveConsultant = () => {
    if (consultantSaveName.trim()) {
      // Check if a consultant with the same name already exists
      const existingConsultantId = Object.keys(savedConsultants).find(id => 
        savedConsultants[id].name === consultantSaveName.trim()
      );
      
      const consultantId = existingConsultantId || `consultant_${Date.now()}`;
      const newConsultant = {
        name: consultantSaveName.trim(),
        greeting: consultantGreeting,
        role: consultantRole,
        info: consultantInfo,
        storeName: consultantStoreName,
        voiceId: selectedVoiceId,
        voiceSpeed: voiceSpeed,
        conversationStyle: conversationStyle,
        customConversationStyle: customConversationStyle,
        industry: industryBasedSettings?.industry,
        companyName: industryBasedSettings?.companyName,
        businessHours: industryBasedSettings?.businessHours,
        location: industryBasedSettings?.location,
        serviceTypes: industryBasedSettings?.serviceTypes
      };
      
      setSavedConsultants(prev => {
        const updated = {
          ...prev,
          [consultantId]: newConsultant
        };
        console.log('🎵 Saving consultant to state:', consultantId, newConsultant);
        return updated;
      });
      
      // 시나리오 이름에도 추가/업데이트
      setScenarioNames(prev => ({
        ...prev,
        [consultantId]: consultantSaveName.trim()
      }));
      
      // 자동으로 저장된 상담사 선택
      console.log('🎵 Setting selected agent config to:', consultantId);
      setSelectedAgentConfig(consultantId);
      
      // Show confirmation message
      if (existingConsultantId) {
        showToast(`"${consultantSaveName.trim()}" 상담사 설정이 업데이트되었습니다.`, 'success');
      } else {
        showToast(`"${consultantSaveName.trim()}" 상담사가 저장되었습니다.`, 'success');
      }
    }
    
    setIsSaveConsultantModalOpen(false);
  };

  const handleCancelSaveConsultant = () => {
    setIsSaveConsultantModalOpen(false);
  };

  const handleEditScenarioName = (scenarioKey: string) => {
    setEditingScenarioKey(scenarioKey);
    setNewScenarioName(scenarioNames[scenarioKey] || scenarioKey);
    setIsScenarioNameModalOpen(true);
  };

  const handleSaveScenarioName = () => {
    if (editingScenarioKey && newScenarioName.trim()) {
      setScenarioNames(prev => ({
        ...prev,
        [editingScenarioKey]: newScenarioName.trim()
      }));
    }
    setIsScenarioNameModalOpen(false);
    setEditingScenarioKey("");
    setNewScenarioName("");
  };

  const handleDeleteScenarioName = (scenarioKey: string) => {
    // 커스텀 삭제 확인 모달 열기
    setDeletingScenarioKey(scenarioKey);
    setIsDeleteConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    const scenarioKey = deletingScenarioKey;
    
    // 저장된 상담사인 경우 savedConsultants에서도 삭제
    if (scenarioKey.startsWith('consultant_')) {
      setSavedConsultants(prev => {
        const newConsultants = { ...prev };
        delete newConsultants[scenarioKey];
        localStorage.setItem('savedConsultants', JSON.stringify(newConsultants));
        return newConsultants;
      });
    }
    
    // 기본 상담사들도 삭제 가능하도록 수정
    // (chatSupervisor, customerServiceRetail, simpleHandoff 등)
    
    // 현재 선택된 상담사가 삭제되는 상담사라면 새 상담사로 변경
    if (selectedAgentConfig === scenarioKey) {
      setSelectedAgentConfig('newConsultant');
    }
    
    setScenarioNames(prev => {
      const newNames = { ...prev };
      delete newNames[scenarioKey];
      localStorage.setItem('scenarioNames', JSON.stringify(newNames));
      return newNames;
    });
    
    showToast(`"${scenarioNames[scenarioKey] || scenarioKey}" 상담사가 삭제되었습니다.`, 'success');
    
    // 모달 닫기
    setIsDeleteConfirmModalOpen(false);
    setIsScenarioNameModalOpen(false);
    setDeletingScenarioKey("");
  };

  const handleCancelDelete = () => {
    setIsDeleteConfirmModalOpen(false);
    setDeletingScenarioKey("");
  };

  // 토스트 알림 함수
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleCancelScenarioNameEdit = () => {
    setIsScenarioNameModalOpen(false);
    setEditingScenarioKey("");
    setNewScenarioName("");
  };

  const handleCancelConsultantSettings = () => {
    // 취소 시 사이드바만 닫기
    setIsConsultantSettingsOpen(false);
  };

  // 성별에 따라 목소리 필터링
  const getFilteredVoices = () => {
    if (voiceGenderFilter === 'all') {
      return voices;
    }
    return voices.filter(voice => voice.gender === voiceGenderFilter);
  };

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    // 로그는 항상 비활성화로 시작
    localStorage.removeItem("logsExpanded");
    setIsEventsPaneExpanded(false);
    
    // 마이크 설정도 항상 비활성화로 시작
    setNoiseSuppression(false);
    setEchoCancellation(false);
    setAutoGainControl(false);
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
    const storedVoiceId = localStorage.getItem("selectedVoiceId");
    if (storedVoiceId) {
      setSelectedVoiceId(storedVoiceId);
    }
    const storedConsultantGreeting = localStorage.getItem("consultantGreeting");
    if (storedConsultantGreeting) {
      setConsultantGreeting(storedConsultantGreeting);
    }
    const storedConsultantRole = localStorage.getItem("consultantRole");
    if (storedConsultantRole) {
      setConsultantRole(storedConsultantRole);
    }
    const storedConsultantInfo = localStorage.getItem("consultantInfo");
    if (storedConsultantInfo) {
      setConsultantInfo(storedConsultantInfo);
    }
    const storedConsultantStoreName = localStorage.getItem("consultantStoreName");
    if (storedConsultantStoreName) {
      setConsultantStoreName(storedConsultantStoreName);
    }
    // 목소리 속도는 항상 표준(1.0)으로 초기화 (미구현 상태)
    setVoiceSpeed(1.0);
    const storedConversationStyle = localStorage.getItem("conversationStyle");
    if (storedConversationStyle) {
      setConversationStyle(storedConversationStyle);
    }
    const storedCustomConversationStyle = localStorage.getItem("customConversationStyle");
    if (storedCustomConversationStyle) {
      setCustomConversationStyle(storedCustomConversationStyle);
    }
    const storedScenarioNames = localStorage.getItem("scenarioNames");
    if (storedScenarioNames) {
      try {
        const parsedNames = JSON.parse(storedScenarioNames);
        // 강제로 newConsultant 이름 업데이트
        parsedNames.newConsultant = "AI 상담사 생성";
        setScenarioNames(parsedNames);
        localStorage.setItem("scenarioNames", JSON.stringify(parsedNames));
      } catch (e) {
        console.error("Failed to parse scenario names:", e);
      }
    }
    const storedSavedConsultants = localStorage.getItem("savedConsultants");
    if (storedSavedConsultants) {
      try {
        const parsedConsultants = JSON.parse(storedSavedConsultants);
        console.log('🎵 Loading saved consultants from localStorage:', parsedConsultants);
        setSavedConsultants(parsedConsultants);
      } catch (e) {
        console.error("Failed to parse saved consultants:", e);
      }
    } else {
      console.log('🎵 No saved consultants found in localStorage');
    }
    
    // selectedAgentConfig를 마지막에 설정하여 저장된 상담사 설정이 제대로 로드되도록 함
    const storedSelectedAgentConfig = localStorage.getItem("selectedAgentConfig");
    if (storedSelectedAgentConfig) {
      console.log('🎵 Loading selected agent config:', storedSelectedAgentConfig);
      setSelectedAgentConfig(storedSelectedAgentConfig);
      
      // 저장된 상담사인 경우 목소리 설정도 로드
      if (storedSelectedAgentConfig.startsWith('consultant_')) {
        const storedSavedConsultants = localStorage.getItem("savedConsultants");
        if (storedSavedConsultants) {
          try {
            const parsedConsultants = JSON.parse(storedSavedConsultants);
            const consultant = parsedConsultants[storedSelectedAgentConfig];
            if (consultant && consultant.voiceId) {
              console.log('🎵 Loading saved consultant voice:', consultant.voiceId);
              setSelectedVoiceId(consultant.voiceId);
              
              // UI 업데이트를 위한 강제 리렌더링
              setTimeout(() => {
                console.log('🎵 Force UI update for initial voice load');
                setSelectedVoiceId(consultant.voiceId);
              }, 200);
            }
          } catch (e) {
            console.error("Failed to parse saved consultants for voice:", e);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    localStorage.setItem("selectedVoiceId", selectedVoiceId);
  }, [selectedVoiceId]);

  useEffect(() => {
    localStorage.setItem("consultantGreeting", consultantGreeting);
  }, [consultantGreeting]);

  useEffect(() => {
    localStorage.setItem("consultantRole", consultantRole);
  }, [consultantRole]);

  useEffect(() => {
    localStorage.setItem("consultantInfo", consultantInfo);
  }, [consultantInfo]);

  useEffect(() => {
    localStorage.setItem("consultantStoreName", consultantStoreName);
  }, [consultantStoreName]);

  useEffect(() => {
    localStorage.setItem("voiceSpeed", voiceSpeed.toString());
  }, [voiceSpeed]);

  // 목소리 속도 슬라이더를 항상 표준(1.0) 위치로 강제 설정
  useEffect(() => {
    setVoiceSpeed(1.0);
  }, []);

  useEffect(() => {
    localStorage.setItem("conversationStyle", conversationStyle);
  }, [conversationStyle]);

  useEffect(() => {
    localStorage.setItem("customConversationStyle", customConversationStyle);
  }, [customConversationStyle]);

  useEffect(() => {
    localStorage.setItem("selectedAgentConfig", selectedAgentConfig);
    
    // 상담사 선택 시 자동 로딩
    if (selectedAgentConfig === "newConsultant") {
      // 새 상담사 선택 시 필드 초기화
      console.log('🎵 Loading new consultant - resetting all fields');
      setConsultantGreeting("");
      setConsultantRole("");
      setConsultantInfo("");
      setConsultantStoreName("");
      setSelectedVoiceId("alloy");
      setConversationStyle("standard");
      setCustomConversationStyle("");
      setVoiceSpeed(1.0); // 표준 위치로 리셋
      setIndustryBasedSettings(null); // 업종 설정 초기화
    } else if (selectedAgentConfig.startsWith("consultant_")) {
      // 저장된 상담사 선택 시 해당 상담사 설정 로드
      const consultant = savedConsultants[selectedAgentConfig];
      if (consultant) {
        console.log('🎵 Loading saved consultant:', consultant.name, consultant);
        setConsultantGreeting(consultant.greeting);
        setConsultantRole(consultant.role);
        setConsultantInfo(consultant.info);
        setConsultantStoreName(consultant.storeName);
        // 목소리 설정을 더 안정적으로 로드
        if (consultant.voiceId) {
          console.log('🎵 Setting voice ID to:', consultant.voiceId);
          setSelectedVoiceId(consultant.voiceId);
          
          // UI 업데이트를 위한 강제 리렌더링
          setTimeout(() => {
            console.log('🎵 Force UI update for voice selection');
            setSelectedVoiceId(consultant.voiceId);
          }, 100);
        }
        setVoiceSpeed(consultant.voiceSpeed || 1.0);
        setConversationStyle(consultant.conversationStyle || "standard");
        setCustomConversationStyle(consultant.customConversationStyle || "");
        
        // 업종 정보 로드
        if (consultant.industry) {
          setIndustryBasedSettings({
            industry: consultant.industry,
            companyName: consultant.companyName || consultant.storeName,
            greeting: consultant.greeting,
            serviceTypes: consultant.serviceTypes || [],
            businessHours: consultant.businessHours || '',
            location: consultant.location || ''
          });
        }
      } else {
        console.log('🎵 Saved consultant not found:', selectedAgentConfig);
      }
    }
  }, [selectedAgentConfig, savedConsultants]);

  useEffect(() => {
    localStorage.setItem("scenarioNames", JSON.stringify(scenarioNames));
  }, [scenarioNames]);

  useEffect(() => {
    console.log('🎵 Saving savedConsultants to localStorage:', savedConsultants);
    localStorage.setItem("savedConsultants", JSON.stringify(savedConsultants));
  }, [savedConsultants]);

  // 성별 필터 변경 시 현재 선택된 목소리가 필터된 목록에 없으면 첫 번째 목소리로 변경
  useEffect(() => {
    const filteredVoices = getFilteredVoices();
    const currentVoice = filteredVoices.find(voice => voice.id === selectedVoiceId);
    
    if (!currentVoice && filteredVoices.length > 0) {
      setSelectedVoiceId(filteredVoices[0].id);
    }
  }, [voiceGenderFilter, selectedVoiceId]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.voice-dropdown-container')) {
        setIsVoiceDropdownOpen(false);
      }
    };

    if (isVoiceDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVoiceDropdownOpen]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. 
    try {
      mute(!isAudioPlaybackEnabled);
    } catch (err) {
      console.warn('Failed to toggle SDK mute', err);
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      try {
        mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  const agentSetKey = selectedAgentConfig;

  return (
    <div className="text-base flex flex-col h-screen bg-white text-gray-900 relative">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-8 h-8 bg-[#58CC02] rounded-lg flex items-center justify-center hover:bg-[#4BB302] transition-all cursor-pointer shadow-sm"
              title="홈으로 이동"
            >
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 font-inter">AI 상담사 테스트</h1>
              <p className="text-xs text-gray-500">실시간 AI 통화 시뮬레이션</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-base font-medium text-gray-700">
                상담사 선택
              </label>
              <div className="relative">
                <select
                  value={agentSetKey}
                  onChange={handleAgentChange}
                  className="appearance-none bg-white border border-gray-300 rounded-lg text-gray-900 px-3 py-1 pr-8 cursor-pointer font-normal focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                >
                  {Object.keys(sdkScenarioMap).map((agentKey) => {
                    const displayName = scenarioNames[agentKey] || agentKey;
                    return (
                      <option key={agentKey} value={agentKey} className="bg-white text-gray-900">
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-300">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111.04 1.08l-4.25 3.65a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
            
            {agentSetKey !== "newConsultant" && (
              <button
                onClick={() => handleEditScenarioName(agentSetKey)}
                className="px-3 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-all"
                title="시나리오 이름 편집"
              >
                편집
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 px-6 py-4 overflow-hidden relative">
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <Transcript
            userText={userText}
            setUserText={setUserText}
            onSendMessage={handleSendTextMessage}
            downloadRecording={downloadRecording}
            canSend={
              sessionStatus === "CONNECTED"
            }
          />
        </div>

        {/* 사용량 추적 컴포넌트 */}
        <div className="w-80 h-full">
          <UsageTrackerComponent 
            userId={currentUserId}
            onUsageLimitReached={() => {
              alert('무료 체험이 완료되었습니다. 유료 플랜으로 업그레이드해주세요.');
              disconnectFromRealtime();
            }}
            onWarningShown={(message) => {
              // 경고 메시지 표시 (토스트 등)
              console.log('사용량 경고:', message);
            }}
          />
        </div>
        
        {/* 상담사 설정 사이드바 */}
        {isConsultantSettingsOpen && (
          <div className="w-1/3 bg-white rounded-2xl border border-gray-200 shadow-lg flex flex-col h-full max-h-[80vh]">
            <div className="flex justify-between items-center px-6 py-2 sticky top-0 z-10 text-base border-b border-gray-200 bg-white rounded-t-2xl">
              <div>
                <span className="font-semibold text-gray-900 text-lg">상담사 설정</span>
                {selectedAgentConfig.startsWith("consultant_") && savedConsultants[selectedAgentConfig]?.industry && (
                  <div className="text-xs text-gray-500 mt-1">
                    {industryCategories.find(cat => cat.id === savedConsultants[selectedAgentConfig].industry)?.name}
                  </div>
                )}
              </div>
                <button
                  onClick={() => setIsConsultantSettingsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                ×
                </button>
            </div>
            
            <div 
              className="flex-1 space-y-6 overflow-y-auto p-6" 
              style={{ 
                maxHeight: 'calc(80vh - 120px)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 0, 0, 0.2) transparent'
              }}
            >
              {/* 업종 선택 */}
              <div>
                <h3 className="text-base font-medium text-gray-700 mb-3">업종 선택</h3>
                <div className="grid grid-cols-2 gap-2">
                  {industryCategories.map((industry) => (
                    <div
                      key={industry.id}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all text-center ${
                        industryBasedSettings?.industry === industry.id
                          ? `bg-gray-200 border-gray-400 shadow-md`
                          : `bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm`
                      }`}
                      onClick={() => {
                        const defaultSettings = getDefaultSettingsByIndustry(industry.id);
                        const newSettings = {
                          industry: industry.id,
                          companyName: defaultSettings.companyName,
                          greeting: defaultSettings.greeting,
                          serviceTypes: defaultSettings.serviceTypes,
                          businessHours: defaultSettings.businessHours,
                          location: defaultSettings.location
                        };
                        setIndustryBasedSettings(newSettings);

                        // 모든 관련 설정을 업종에 맞게 업데이트
                        setConsultantGreeting(defaultSettings.greeting);
                        setConsultantStoreName(defaultSettings.companyName);
                        // 업종별 맞춤 정보 설정
                        let customInfo = '';
                        switch (industry.id) {
                          case 'beauty':
                            customInfo = `${defaultSettings.companyName}는 헤어컷, 펌, 염색, 네일아트, 피부관리 등 다양한 미용 서비스를 제공합니다. 전문 디자이너가 고객님만의 아름다움을 찾아드립니다.`;
                            break;
                          case 'restaurant':
                            customInfo = `${defaultSettings.companyName}는 신선한 재료로 만든 맛있는 음식과 따뜻한 서비스를 제공합니다. 특별한 날을 위한 예약과 단체 모임도 환영합니다.`;
                            break;
                          case 'medical':
                            customInfo = `${defaultSettings.companyName}는 환자의 건강을 최우선으로 하는 의료 서비스를 제공합니다. 정기 검진, 진료 예약, 건강 상담을 도와드립니다.`;
                            break;
                          case 'fitness':
                            customInfo = `${defaultSettings.companyName}는 개인 맞춤형 운동 프로그램과 전문 트레이너의 지도를 제공합니다. 헬스, 요가, 필라테스, 개인PT 등 다양한 수업을 운영합니다.`;
                            break;
                          case 'education':
                            customInfo = `${defaultSettings.companyName}는 개인별 학습 수준에 맞는 맞춤형 교육을 제공합니다. 개인과외, 그룹수업, 온라인수업 등 다양한 학습 방법을 지원합니다.`;
                            break;
                          case 'automotive':
                            customInfo = `${defaultSettings.companyName}는 정기점검, 수리, 세차, 타이어교체 등 자동차 관련 모든 서비스를 제공합니다. 안전한 운전을 위한 전문적인 정비 서비스를 자랑합니다.`;
                            break;
                          case 'pet':
                            customInfo = `${defaultSettings.companyName}는 반려동물의 건강과 아름다움을 위한 전문 서비스를 제공합니다. 목욕, 미용, 진료, 호텔, 훈련 등 다양한 펫 서비스를 운영합니다.`;
                            break;
                          case 'wedding':
                            customInfo = `${defaultSettings.companyName}는 특별한 순간을 위한 완벽한 웨딩 서비스를 제공합니다. 예식, 스튜디오촬영, 드레스대여, 헤어메이크업 등 원스톱 웨딩 서비스를 자랑합니다.`;
                            break;
                          case 'personalAssistant':
                            customInfo = `${defaultSettings.companyName}는 개인 맞춤형 비서 서비스를 제공합니다. 일정 관리, 업무 지원, 생활 도우미, 쇼핑 대행, 여행 계획 등 개인의 모든 업무를 효율적으로 도와드립니다.`;
                            break;
                          default:
                            customInfo = `${defaultSettings.companyName}는 고객님의 편의를 위해 최선을 다하는 서비스를 제공합니다. 전문적인 상담과 맞춤형 서비스로 고객 만족을 추구합니다.`;
                        }
                        setConsultantInfo(customInfo);
                        // 업종별 맞춤 역할 설정
                        let customRole = '';
                        switch (industry.id) {
                          case 'beauty':
                            customRole = '미용 전문 상담사 - 헤어, 네일, 피부관리 서비스 안내';
                            break;
                          case 'restaurant':
                            customRole = '레스토랑 상담사 - 예약, 메뉴 안내, 서비스 상담';
                            break;
                          case 'medical':
                            customRole = '의료 상담사 - 진료 예약, 건강 상담, 병원 안내';
                            break;
                          case 'fitness':
                            customRole = '피트니스 상담사 - 수업 예약, 운동 상담, 프로그램 안내';
                            break;
                          case 'education':
                            customRole = '교육 상담사 - 수강 상담, 학습 프로그램 안내';
                            break;
                          case 'automotive':
                            customRole = '자동차 정비 상담사 - 정비 예약, 차량 점검 안내';
                            break;
                          case 'pet':
                            customRole = '펫 서비스 상담사 - 반려동물 서비스 예약 및 상담';
                            break;
                          case 'wedding':
                            customRole = '웨딩 상담사 - 예식 예약, 웨딩 서비스 안내';
                            break;
                          case 'personalAssistant':
                            customRole = '개인 비서 - 일정 관리, 업무 지원, 생활 도우미 서비스';
                            break;
                          default:
                            customRole = '고객 서비스 상담사 - 전반적인 서비스 안내 및 상담';
                        }
                        setConsultantRole(customRole);

                        // 업종별 맞춤 인사말 생성
                        const industryName = industryCategories.find(cat => cat.id === industry.id)?.name;
                        let customGreeting = '';

                        switch (industry.id) {
                          case 'beauty':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 아름다운 변화를 위해 헤어, 네일, 피부관리 서비스를 제공하고 있습니다. 어떤 서비스를 도와드릴까요?`;
                            break;
                          case 'restaurant':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 맛있는 음식과 따뜻한 서비스로 고객님을 맞이하겠습니다. 예약이나 문의사항을 도와드릴까요?`;
                            break;
                          case 'medical':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 건강한 하루를 위한 의료 서비스를 제공하고 있습니다. 진료 예약이나 상담을 도와드릴까요?`;
                            break;
                          case 'fitness':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 건강한 몸과 마음을 위한 피트니스 서비스를 제공하고 있습니다. 수업 예약이나 상담을 도와드릴까요?`;
                            break;
                          case 'education':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 꿈을 향한 학습을 도와드리는 교육 서비스를 제공하고 있습니다. 수강 상담이나 문의사항을 도와드릴까요?`;
                            break;
                          case 'automotive':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 안전한 운전을 위한 자동차 정비 서비스를 제공하고 있습니다. 정비 예약이나 상담을 도와드릴까요?`;
                            break;
                          case 'pet':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 소중한 반려동물을 위한 펫 서비스를 제공하고 있습니다. 서비스 예약이나 상담을 도와드릴까요?`;
                            break;
                          case 'wedding':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 특별한 순간을 만들어드리는 웨딩 서비스를 제공하고 있습니다. 예식 예약이나 상담을 도와드릴까요?`;
                            break;
                          case 'personalAssistant':
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 개인 맞춤형 비서 서비스를 제공하고 있습니다. 일정 관리, 업무 지원, 생활 도우미 등 어떤 도움이 필요하신가요?`;
                            break;
                          default:
                            customGreeting = `안녕하세요! ${defaultSettings.companyName}입니다. 고객님의 편의를 위해 최선을 다하는 서비스를 제공하고 있습니다. 어떤 도움이 필요하신가요?`;
                        }

                        setConsultantGreeting(customGreeting);
                      }}
                    >
                      <div className="text-lg mb-1">{industry.icon}</div>
                      <div className="text-xs font-medium text-gray-900">{industry.name}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 업종 선택 후에만 표시되는 설정들 */}
              {industryBasedSettings?.industry && (
                <>
                  {/* 업체명 설정 */}
                  <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  업체명
                </label>
                <input
                  type="text"
                  value={consultantStoreName || ""}
                  onChange={(e) => setConsultantStoreName(e.target.value)}
                  placeholder="예: 맛있는 고깃집, 따뜻한 카페 등"
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                />
              </div>
              
              {/* 인사말 설정 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  인사말
                </label>
                <textarea
                  value={consultantGreeting || ""}
                  onChange={(e) => setConsultantGreeting(e.target.value)}
                  placeholder="안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?"
                  className="w-full h-20 p-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                  style={{ overflowY: 'auto', minHeight: '80px', maxHeight: '120px' }}
                />
              </div>
              
              {/* 역할 설정 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  역할
                </label>
                <textarea
                  value={consultantRole || ""}
                  onChange={(e) => setConsultantRole(e.target.value)}
                  placeholder="당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다."
                  className="w-full h-32 p-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                  style={{ overflowY: 'hidden', minHeight: '128px', maxHeight: '200px' }}
                />
              </div>

              {/* 정보 설정 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  정보
                </label>
                <textarea
                  value={consultantInfo || ""}
                  onChange={(e) => setConsultantInfo(e.target.value)}
                  placeholder={`운영시간: 오전 10시 - 오후 10시
메뉴: 삼겹살 15,000원, 갈비 25,000원
주차: 건물 지하 1층, 2시간 무료
최대 예약 가능 인원: 8명`}
                  className="w-full h-32 p-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                  style={{ overflowY: 'hidden', minHeight: '128px', maxHeight: '200px' }}
                />
              </div>

              {/* 상담사 목소리 설정 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  상담사 목소리
                </label>
                
                {/* 성별 필터 버튼들 */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setVoiceGenderFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      voiceGenderFilter === 'all' 
                        ? 'bg-[#58CC02] text-white border border-[#58CC02]' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setVoiceGenderFilter('male')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      voiceGenderFilter === 'male' 
                        ? 'bg-[#58CC02] text-white border border-[#58CC02]' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    onClick={() => setVoiceGenderFilter('female')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      voiceGenderFilter === 'female' 
                        ? 'bg-[#58CC02] text-white border border-[#58CC02]' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    여성
                  </button>
                </div>
            
                 <div className="relative inline-block voice-dropdown-container w-full">
                   <button
                     onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                     className="w-full appearance-none bg-white border-2 border-gray-400 rounded-lg text-sm px-3 py-1.5 pr-8 cursor-pointer font-medium focus:outline-none text-gray-900 text-left hover:bg-gray-50 hover:border-gray-500 transition-all shadow-sm"
                   >
                    <span 
                      style={{ 
                        color: getVoiceById(selectedVoiceId).gender === 'male' ? '#60a5fa' : '#f472b6' 
                      }}
                    >
                      {getVoiceById(selectedVoiceId).name}
                    </span>
                    <span className="text-gray-700"> : {getVoiceById(selectedVoiceId).description}</span>
                  </button>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600">
                    <svg
                      className="h-4 w-4 text-gray-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111.04 1.08l-4.25 3.65a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
              
                  {/* 드롭다운 메뉴 */}
                  {isVoiceDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border-2 border-gray-400 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                      {getFilteredVoices().map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => handleVoiceChange(voice.id)}
                          className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-sm font-medium text-gray-900 transition-colors"
                        >
                          <span 
                            style={{ 
                              color: voice.gender === 'male' ? '#60a5fa' : '#f472b6' 
                            }}
                          >
                            {voice.name}
                          </span>
                          <span className="text-gray-700"> : {voice.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 대화 스타일 설정 */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  대화 스타일
                </label>
                 <div className="relative inline-block w-full">
                   <select
                     value={conversationStyle}
                     onChange={(e) => setConversationStyle(e.target.value)}
                     className="w-full appearance-none bg-white border-2 border-gray-400 rounded-lg text-sm px-3 py-1.5 pr-8 cursor-pointer font-medium focus:outline-none text-gray-900 text-left hover:bg-gray-50 hover:border-gray-500 transition-all shadow-sm"
                    title={
                      conversationStyle === "calm" 
                        ? "차분하고 명확하게, 천천히 여유롭게 설명해주세요."
                        : conversationStyle === "standard"
                        ? "빠르고 간결하게, 즉시 핵심만 답변해주세요."
                        : conversationStyle === "energetic"
                        ? "즉시, 에너지 있게, 활기차고 빠르게 답변해주세요."
                        : "사용자가 직접 대화 스타일을 입력할 수 있습니다."
                    }
                  >
                    <option value="calm" className="bg-white text-gray-900">차분한 스타일</option>
                    <option value="standard" className="bg-white text-gray-900">표준 스타일</option>
                    <option value="energetic" className="bg-white text-gray-900">활발한 스타일</option>
                    <option value="custom" className="bg-white text-gray-900">사용자 지정</option>
                  </select>
                   <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                     <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                     </svg>
                   </div>
                </div>

                {/* 사용자 지정 스타일 입력창 */}
                {conversationStyle === "custom" && (
                  <div className="mt-3">
                    <textarea
                      value={customConversationStyle}
                      onChange={(e) => setCustomConversationStyle(e.target.value)}
                      placeholder="예: SYSTEM: 모든 응답을 빠르고 간결하게 해주세요. SYSTEM: 즉시 핵심만 답변해주세요."
                      className="w-full h-20 p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent text-sm"
                      style={{ overflowY: 'auto', minHeight: '80px', maxHeight: '120px' }}
                    />
                  </div>
                )}
              </div>

              {/* 목소리 속도 설정 (미구현) */}
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  목소리 속도 (미구현)
                </label>
                <div className="relative">
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={voiceSpeed}
                        onChange={(e) => {
                          console.log('🎵 SLIDER CHANGED TO:', parseFloat(e.target.value));
                          handleVoiceSpeedChange(parseFloat(e.target.value));
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer opacity-50"
                        disabled
                      />
                      {/* 슬라이더 기준 라벨 */}
                      <div className="absolute top-8 left-0 w-full">
                        <div className="relative text-xs text-gray-400">
                          <span className="absolute left-0">느림</span>
                          <span className="absolute left-1/2 transform -translate-x-1/2">표준</span>
                          <span className="absolute right-0">빠름</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-500 min-w-[3rem]">
                      {voiceSpeed}x
                    </span>
                  </div>
                </div>
              </div>
                </>
              )}

            </div>
            
            {/* 저장/취소 버튼 - 스크롤 영역 밖에 고정 */}
            <div className="flex justify-end space-x-3 py-2 px-6 border-t border-gray-200">
              <button
                onClick={handleCancelConsultantSettings}
                className="px-4 py-1 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveConsultantSettings}
                className="px-6 py-1 bg-[#58CC02] text-white rounded-lg hover:bg-[#4BB302] transition-all font-medium"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {isDeleteConfirmModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[60]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelDelete();
              }
            }}
          >
            <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-96 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-red-400">상담사 삭제 확인</h3>
              
              <div className="mb-6">
                <p className="text-gray-300">
                  <span className="font-semibold text-white">"{scenarioNames[deletingScenarioKey] || deletingScenarioKey}"</span> 상담사를 삭제하시겠습니까?
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  삭제된 상담사는 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-300 hover:text-white border border-white/20 rounded-lg hover:bg-white/10 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 상담사 저장 모달 */}
        {isSaveConsultantModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelSaveConsultant();
              }
            }}
          >
            <div className="bg-white rounded-2xl p-6 w-96 shadow-xl border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 font-inter">상담사 저장</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담사 이름
                </label>
                <input
                  type="text"
                  value={consultantSaveName || ""}
                  onChange={(e) => setConsultantSaveName(e.target.value)}
                  className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                  placeholder="예: 고깃집 상담사, 카페 상담사"
                  autoFocus
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelSaveConsultant}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSaveConsultant}
                  disabled={!consultantSaveName.trim()}
                  className="px-4 py-2 bg-[#58CC02] text-white rounded-lg hover:bg-[#4BB302] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 시나리오 이름 편집 모달 */}
        {isScenarioNameModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelScenarioNameEdit();
              }
            }}
          >
            <div className="bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-2xl p-6 w-96 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4 text-white">시나리오 이름 편집</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  시나리오 이름
                </label>
                <input
                  type="text"
                  value={newScenarioName || ""}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="시나리오 이름을 입력하세요"
                  autoFocus
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleDeleteScenarioName.bind(null, editingScenarioKey)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  삭제
                </button>
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelScenarioNameEdit}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveScenarioName}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 토스트 알림 */}
        {toast && (
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ease-in-out ${
            toast.type === 'success' 
              ? 'bg-green-500/90 text-white border-green-400/50' 
              : toast.type === 'error' 
              ? 'bg-red-500/90 text-white border-red-400/50' 
              : 'bg-blue-500/90 text-white border-blue-400/50'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="ml-2 text-white hover:text-gray-200 w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <Events isExpanded={isEventsPaneExpanded} />
      </div>

      {/* 음성 인식 품질 표시기 */}
      <SpeechQualityIndicator isVisible={sessionStatus === "CONNECTED"} />

      <BottomToolbar
        sessionStatus={sessionStatus}
        onToggleConnection={onToggleConnection}
        isPTTActive={isPTTActive}
        setIsPTTActive={setIsPTTActive}
        isPTTUserSpeaking={isPTTUserSpeaking}
        handleTalkButtonDown={handleTalkButtonDown}
        handleTalkButtonUp={handleTalkButtonUp}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        codec={urlCodec}
        onCodecChange={handleCodecChange}
        onConsultantSettingsClick={handleConsultantSettingsClick}
        onMicrophoneSettingsClick={() => setIsMicrophoneSettingsOpen(true)}
      />

      {/* 마이크 설정 모달 */}
      <MicrophoneSettings
        isOpen={isMicrophoneSettingsOpen}
        onClose={() => setIsMicrophoneSettingsOpen(false)}
        noiseSuppression={noiseSuppression}
        setNoiseSuppression={setNoiseSuppression}
        echoCancellation={echoCancellation}
        setEchoCancellation={setEchoCancellation}
        autoGainControl={autoGainControl}
        setAutoGainControl={setAutoGainControl}
        codec={urlCodec}
        onCodecChange={handleCodecChange}
        isEventsPaneExpanded={isEventsPaneExpanded}
        setIsEventsPaneExpanded={setIsEventsPaneExpanded}
        vadThreshold={vadThreshold}
        setVadThreshold={setVadThreshold}
      />
    </div>
  );
}

export default App;
