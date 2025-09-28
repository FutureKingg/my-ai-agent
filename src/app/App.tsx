"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";

// Types
import { SessionStatus } from "@/app/types";
import type { RealtimeAgent } from '@openai/agents/realtime';

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";

// Agent configs
import { allAgentSets, defaultAgentSetKey } from "@/app/agentConfigs";
import { customerServiceRetailScenario } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorScenario } from "@/app/agentConfigs/chatSupervisor";
import { customerServiceRetailCompanyName } from "@/app/agentConfigs/customerServiceRetail";
import { chatSupervisorCompanyName } from "@/app/agentConfigs/chatSupervisor";
import { simpleHandoffScenario } from "@/app/agentConfigs/simpleHandoff";
import { savedConsultantScenario, savedConsultantCompanyName } from "@/app/agentConfigs/savedConsultant";

// Voice configs
import { voices, getVoiceById } from "@/lib/voices";

// Base scenarios - these are static
const baseScenarioMap: Record<string, RealtimeAgent[]> = {
  newConsultant: savedConsultantScenario,
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  savedConsultant: savedConsultantScenario,
};

import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";

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

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Ref to identify whether the latest agent switch came from an automatic handoff
  const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

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
  });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [isConsultantSettingsOpen, setIsConsultantSettingsOpen] = useState<boolean>(false);
  const [isScenarioNameModalOpen, setIsScenarioNameModalOpen] = useState<boolean>(false);
  const [editingScenarioKey, setEditingScenarioKey] = useState<string>("");
  const [newScenarioName, setNewScenarioName] = useState<string>("");
  const [isSaveConsultantModalOpen, setIsSaveConsultantModalOpen] = useState<boolean>(false);
  const [consultantSaveName, setConsultantSaveName] = useState<string>("");
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState<boolean>(false);
  const [deletingScenarioKey, setDeletingScenarioKey] = useState<string>("");
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [consultantGreeting, setConsultantGreeting] = useState<string>("");
  const [consultantRole, setConsultantRole] = useState<string>("");
  const [consultantInfo, setConsultantInfo] = useState<string>("");
  const [consultantStoreName, setConsultantStoreName] = useState<string>("");
  const [voiceGenderFilter, setVoiceGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [selectedAgentConfig, setSelectedAgentConfig] = useState<string>("newConsultant");
  const [scenarioNames, setScenarioNames] = useState<Record<string, string>>({
    newConsultant: "새 상담사",
    chatSupervisor: "채팅 관리자",
    customerServiceRetail: "고객 서비스 소매", 
    simpleHandoff: "간단한 인수인계",
    savedConsultant: "저장된 상담사"
  });
  const [savedConsultants, setSavedConsultants] = useState<Record<string, {
    name: string;
    greeting: string;
    role: string;
    info: string;
    storeName: string;
    voiceId: string;
  }>>({});
  const [userText, setUserText] = useState<string>("");

  // Create dynamic scenario map including saved consultants
  const sdkScenarioMap = useMemo(() => {
    const dynamicMap = { ...baseScenarioMap };
    
    // Add saved consultants as scenarios
    Object.keys(savedConsultants).forEach(consultantId => {
      dynamicMap[consultantId] = savedConsultantScenario;
    });
    
    return dynamicMap;
  }, [savedConsultants]);
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
      finalAgentConfig = "savedConsultant";
      const url = new URL(window.location.toString());
      url.searchParams.set("agentConfig", finalAgentConfig);
      window.location.replace(url.toString());
      return;
    }

    const agents = allAgentSets[finalAgentConfig];
    setSelectedAgentConfigSet(agents);
  }, [searchParams]);

  // 자동 연결 기능 제거 - 사용자가 Connect 버튼을 클릭할 때만 연결

  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet
    ) {
      const currentAgent = selectedAgentConfigSet[0]; // Use first agent as root
      addTranscriptBreadcrumb(`Agent: ${currentAgent.name}`, currentAgent);
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
    const agentSetKey = selectedAgentConfig;
    if (sdkScenarioMap[agentSetKey]) {
    if (sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");

    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;

        // Use the first agent as root (no reordering needed)
        const agents = [...sdkScenarioMap[agentSetKey]];

        // Apply selected voice and COMPLETELY REPLACE instructions with user prompts
        const selectedVoice = getVoiceById(selectedVoiceId);
        agents.forEach(agent => {
          // Create new agent with updated voice
          Object.assign(agent, { voice: selectedVoice.voice });
          
          // COMPLETELY REPLACE agent instructions with user's custom prompts
          let customInstructions = "";
          
          // Check if this is a saved consultant
          const savedConsultant = savedConsultants[agentSetKey];
          
          if (savedConsultant) {
            // Use saved consultant settings
            const greetingText = savedConsultant.greeting.trim() || "안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?";
            customInstructions += `SYSTEM: 당신은 상담원입니다. 첫 번째 메시지로 반드시 다음 문장을 정확히 그대로 말해야 합니다:

"${greetingText}"

이 문장 외에는 다른 어떤 단어도 추가하지 마세요. 변형하지 마세요. 정확히 이 문장만 말하세요.\n\n`;
            
            const roleText = (savedConsultant.role || "").trim() || "당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다.";
            customInstructions += `**역할 및 성격**: ${roleText}\n\n`;
            
            const storeNameText = (savedConsultant.storeName || "").trim() || "";
            const storeNameSection = storeNameText ? `**가게명**: ${storeNameText}\n\n` : "";
            customInstructions += storeNameSection;
            
            const infoText = (savedConsultant.info || "").trim() || "운영시간: 오전 10시 - 오후 10시\n메뉴: 삼겹살 15,000원, 갈비 25,000원\n주차: 건물 지하 1층, 2시간 무료\n최대 예약 가능 인원: 8명";
            customInstructions += `**참고 정보**: ${infoText}`;
          } else {
            // Use current form settings (for new consultants)
            const greetingText = (consultantGreeting || "").trim() || "안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?";
            customInstructions += `SYSTEM: 당신은 상담원입니다. 첫 번째 메시지로 반드시 다음 문장을 정확히 그대로 말해야 합니다:

"${greetingText}"

이 문장 외에는 다른 어떤 단어도 추가하지 마세요. 변형하지 마세요. 정확히 이 문장만 말하세요.\n\n`;
            
            const roleText = (consultantRole || "").trim() || "당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다.";
            customInstructions += `**역할 및 성격**: ${roleText}\n\n`;
            
            const storeNameText = (consultantStoreName || "").trim() || "";
            const storeNameSection = storeNameText ? `**가게명**: ${storeNameText}\n\n` : "";
            customInstructions += storeNameSection;
            
            const infoText = (consultantInfo || "").trim() || "운영시간: 오전 10시 - 오후 10시\n메뉴: 삼겹살 15,000원, 갈비 25,000원\n주차: 건물 지하 1층, 2시간 무료\n최대 예약 가능 인원: 8명";
            customInstructions += `**참고 정보**: ${infoText}`;
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

      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
          initialAgents: agents,
        audioElement: sdkAudioElement,
        outputGuardrails: [guardrail],
        extraContext: {
          addTranscriptBreadcrumb,
        },
      });
    } catch (err) {
      console.error("Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
      }
      return;
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus("DISCONNECTED");
    setIsPTTUserSpeaking(false);
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
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAgentConfig = e.target.value;
    setSelectedAgentConfig(newAgentConfig);
  };


  const handleVoiceChange = (newVoiceId: string) => {
    setSelectedVoiceId(newVoiceId);
    setIsVoiceDropdownOpen(false);
    
    // If connected, update all agents' voice
    if (sessionStatus === "CONNECTED" && selectedAgentConfigSet) {
      const selectedVoice = getVoiceById(newVoiceId);
      selectedAgentConfigSet.forEach(agent => {
        Object.assign(agent, { voice: selectedVoice.voice });
      });
      
      // Send session update to change voice
      sendEvent({
        type: 'session.update',
        session: {
          turn_detection: {
            type: 'server_vad',
            threshold: 0.9,
            prefix_padding_ms: 300,
            silence_duration_ms: 500,
            create_response: true,
          },
        },
      });
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
    // 새 상담사인 경우에만 이름 입력 모달 열기
    if (selectedAgentConfig === "newConsultant") {
      setConsultantSaveName("");
      setIsSaveConsultantModalOpen(true);
    } else if (selectedAgentConfig.startsWith("consultant_")) {
      // 저장된 상담사인 경우 바로 덮어쓰기
      const existingConsultant = savedConsultants[selectedAgentConfig];
      if (existingConsultant) {
        const updatedConsultant = {
          ...existingConsultant,
          greeting: consultantGreeting,
          role: consultantRole,
          info: consultantInfo,
          storeName: consultantStoreName,
          voiceId: selectedVoiceId
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
        voiceId: selectedVoiceId
      };
      
      setSavedConsultants(prev => ({
        ...prev,
        [consultantId]: newConsultant
      }));
      
      // 시나리오 이름에도 추가/업데이트
      setScenarioNames(prev => ({
        ...prev,
        [consultantId]: consultantSaveName.trim()
      }));
      
      // 자동으로 저장된 상담사 선택
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
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
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
    const storedSelectedAgentConfig = localStorage.getItem("selectedAgentConfig");
    if (storedSelectedAgentConfig) {
      setSelectedAgentConfig(storedSelectedAgentConfig);
    }
    const storedScenarioNames = localStorage.getItem("scenarioNames");
    if (storedScenarioNames) {
      try {
        setScenarioNames(JSON.parse(storedScenarioNames));
      } catch (e) {
        console.error("Failed to parse scenario names:", e);
      }
    }
    const storedSavedConsultants = localStorage.getItem("savedConsultants");
    if (storedSavedConsultants) {
      try {
        setSavedConsultants(JSON.parse(storedSavedConsultants));
      } catch (e) {
        console.error("Failed to parse saved consultants:", e);
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
    localStorage.setItem("selectedAgentConfig", selectedAgentConfig);
    
    // 상담사 선택 시 자동 로딩
    if (selectedAgentConfig === "newConsultant") {
      // 새 상담사 선택 시 필드 초기화
      setConsultantGreeting("");
      setConsultantRole("");
      setConsultantInfo("");
      setConsultantStoreName("");
      setSelectedVoiceId("alloy");
    } else if (selectedAgentConfig.startsWith("consultant_")) {
      // 저장된 상담사 선택 시 해당 상담사 설정 로드
      const consultant = savedConsultants[selectedAgentConfig];
      if (consultant) {
        setConsultantGreeting(consultant.greeting);
        setConsultantRole(consultant.role);
        setConsultantInfo(consultant.info);
        setConsultantStoreName(consultant.storeName);
        setSelectedVoiceId(consultant.voiceId);
      }
    }
  }, [selectedAgentConfig]);

  useEffect(() => {
    localStorage.setItem("scenarioNames", JSON.stringify(scenarioNames));
  }, [scenarioNames]);

  useEffect(() => {
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
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      <div className="p-5 text-lg font-semibold flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div>
            <Image
              src="/openai-logomark.svg"
              alt="OpenAI Logo"
              width={20}
              height={20}
              className="mr-2"
            />
          </div>
          <div>
            AI 상담사 테스트
          </div>
        </div>
        <div className="flex items-center">
            <label className="flex items-center text-base gap-1 mr-2 font-medium">
            저장된 상담사
            </label>
            <div className="relative inline-block">
              <select
              value={agentSetKey}
              onChange={handleAgentChange}
              className="appearance-none border border-gray-300 rounded-lg text-base px-2 py-1 pr-8 cursor-pointer font-normal focus:outline-none"
            >
              {Object.keys(sdkScenarioMap).map((agentKey) => {
                const displayName = scenarioNames[agentKey] || agentKey;
                return (
                  <option key={agentKey} value={agentKey}>
                    {displayName}
                  </option>
                );
              })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.44l3.71-3.21a.75.75 0 111.04 1.08l-4.25 3.65a.75.75 0 01-1.04 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          <button
            onClick={() => handleEditScenarioName(agentSetKey)}
            className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="시나리오 이름 편집"
          >
            편집
          </button>

        </div>
      </div>

      <div className="flex flex-1 gap-2 px-2 overflow-hidden relative">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          downloadRecording={downloadRecording}
          canSend={
            sessionStatus === "CONNECTED"
          }
        />
        
        {/* 상담사 설정 사이드바 */}
        {isConsultantSettingsOpen && (
          <div className="w-1/3 bg-white rounded-lg shadow-lg flex flex-col h-full max-h-[80vh]">
            <div className="flex justify-between items-center px-6 py-3 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
              <span className="font-semibold">상담사 역할 설정</span>
                <button
                  onClick={() => setIsConsultantSettingsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
                >
                ×
                </button>
              </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto p-4" style={{ maxHeight: 'calc(80vh - 80px)' }}>
              {/* 상담사 목소리 설정 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담사 목소리
                </label>
                
                {/* 성별 필터 버튼들 */}
                <div className="flex gap-1 mb-3">
                  <button
                    onClick={() => setVoiceGenderFilter('all')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      voiceGenderFilter === 'all' 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    전체
                  </button>
                  <button
                    onClick={() => setVoiceGenderFilter('male')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      voiceGenderFilter === 'male' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
                    }`}
                  >
                    남성
                  </button>
                  <button
                    onClick={() => setVoiceGenderFilter('female')}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      voiceGenderFilter === 'female' 
                        ? 'bg-pink-100 text-pink-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-pink-50'
                    }`}
                  >
                    여성
                  </button>
            </div>
            
                  <div className="relative inline-block voice-dropdown-container w-full">
                  <button
                    onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                    className="w-full appearance-none border border-gray-300 rounded-lg text-base px-2 py-1 pr-8 cursor-pointer font-normal focus:outline-none bg-white text-left"
                  >
                    <span 
                      style={{ 
                        color: getVoiceById(selectedVoiceId).gender === 'male' ? '#3b82f6' : '#ec4899' 
                      }}
                    >
                      {getVoiceById(selectedVoiceId).name}
                    </span>
                    <span className="text-gray-800"> : {getVoiceById(selectedVoiceId).description}</span>
                  </button>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-600">
                    <svg
                      className="h-4 w-4"
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
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      {getFilteredVoices().map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => handleVoiceChange(voice.id)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100 text-base font-normal"
                        >
                          <span 
                            style={{ 
                              color: voice.gender === 'male' ? '#3b82f6' : '#ec4899' 
                            }}
                          >
                            {voice.name}
                          </span>
                          <span className="text-gray-800"> : {voice.description}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인사말
                </label>
                <textarea
                  value={consultantGreeting || ""}
                  onChange={(e) => setConsultantGreeting(e.target.value)}
                  placeholder="안녕하세요! 저는 고객 만족을 최우선으로 하는 친근한 상담사입니다. 무엇을 도와드릴까요?"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ overflowY: 'auto', minHeight: '96px', maxHeight: '150px' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <textarea
                  value={consultantRole || ""}
                  onChange={(e) => setConsultantRole(e.target.value)}
                  placeholder="당신은 전문적이고 친근한 한국인 상담사입니다. 고객의 문제를 신속하고 정확하게 해결하며, 항상 친절하고 도움이 되는 서비스를 제공합니다."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ overflowY: 'auto', minHeight: '128px', maxHeight: '200px' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업체명
                </label>
                <input
                  type="text"
                  value={consultantStoreName || ""}
                  onChange={(e) => setConsultantStoreName(e.target.value)}
                  placeholder="예: 맛있는 고깃집, 따뜻한 카페 등"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정보
                </label>
                <textarea
                  value={consultantInfo || ""}
                  onChange={(e) => setConsultantInfo(e.target.value)}
                  placeholder={`운영시간: 오전 10시 - 오후 10시
메뉴: 삼겹살 15,000원, 갈비 25,000원
주차: 건물 지하 1층, 2시간 무료
최대 예약 가능 인원: 8명`}
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ overflowY: 'auto', minHeight: '128px', maxHeight: '200px' }}
                />
              </div>
            </div>
            
            {/* 저장/취소 버튼 - 스크롤 영역 밖에 고정 */}
            <div className="flex justify-end space-x-2 py-2 px-4">
              <button 
                onClick={handleCancelConsultantSettings}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button 
                onClick={handleSaveConsultantSettings}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        )}

        {/* 삭제 확인 모달 */}
        {isDeleteConfirmModalOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelDelete();
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4 text-red-600">상담사 삭제 확인</h3>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  <span className="font-semibold">"{scenarioNames[deletingScenarioKey] || deletingScenarioKey}"</span> 상담사를 삭제하시겠습니까?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  삭제된 상담사는 복구할 수 없습니다.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelSaveConsultant();
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">상담사 저장</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상담사 이름
                </label>
                <input
                  type="text"
                  value={consultantSaveName || ""}
                  onChange={(e) => setConsultantSaveName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="예: 고깃집 상담사, 카페 상담사"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelSaveConsultant}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmSaveConsultant}
                  disabled={!consultantSaveName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCancelScenarioNameEdit();
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">시나리오 이름 편집</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  시나리오 이름
                </label>
                <input
                  type="text"
                  value={newScenarioName || ""}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="시나리오 이름을 입력하세요"
                  autoFocus
                />
              </div>

              <div className="flex justify-between">
                <button
                  onClick={handleDeleteScenarioName.bind(null, editingScenarioKey)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  삭제
                </button>
                <div className="flex space-x-2">
                <button
                    onClick={handleCancelScenarioNameEdit}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveScenarioName}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
          <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[70] px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
            toast.type === 'success' 
              ? 'bg-green-500 text-white' 
              : toast.type === 'error' 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex items-center space-x-2">
              <span>{toast.message}</span>
              <button 
                onClick={() => setToast(null)}
                className="ml-2 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <Events isExpanded={isEventsPaneExpanded} />
      </div>

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
      />
    </div>
  );
}

export default App;
