"use client";

import { useRef } from "react";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { SpeechRecognitionFilter, SpeechQualityTracker } from "@/app/lib/speechRecognitionFilter";
import { useEvent } from "@/app/contexts/EventContext";

export function useHandleSessionHistory() {
  const {
    transcriptItems,
    addTranscriptBreadcrumb,
    addTranscriptMessage,
    updateTranscriptMessage,
    updateTranscriptItem,
  } = useTranscript();

  const { logServerEvent } = useEvent();

  /* ----------------------- helpers ------------------------- */

  const extractMessageText = (content: any[] = []): string => {
    if (!Array.isArray(content)) return "";

    return content
      .map((c) => {
        if (!c || typeof c !== "object") return "";
        if (c.type === "input_text") return c.text ?? "";
        if (c.type === "audio") return c.transcript ?? "";
        return "";
      })
      .filter(Boolean)
      .join("\n");
  };

  const extractFunctionCallByName = (name: string, content: any[] = []): any => {
    if (!Array.isArray(content)) return undefined;
    return content.find((c: any) => c.type === 'function_call' && c.name === name);
  };

  const maybeParseJson = (val: any) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        console.warn('Failed to parse JSON:', val);
        return val;
      }
    }
    return val;
  };

  const extractLastAssistantMessage = (history: any[] = []): any => {
    if (!Array.isArray(history)) return undefined;
    return history.reverse().find((c: any) => c.type === 'message' && c.role === 'assistant');
  };

  const extractModeration = (obj: any) => {
    if ('moderationCategory' in obj) return obj;
    if ('outputInfo' in obj) return extractModeration(obj.outputInfo);
    if ('output' in obj) return extractModeration(obj.output);
    if ('result' in obj) return extractModeration(obj.result);
  };

  // Temporary helper until the guardrail_tripped event includes the itemId in the next version of the SDK
  const sketchilyDetectGuardrailMessage = (text: string) => {
    return text.match(/Failure Details: (\{.*?\})/)?.[1];
  };

  /* ----------------------- event handlers ------------------------- */

  function handleAgentToolStart(details: any, _agent: any, functionCall: any) {
    const lastFunctionCall = extractFunctionCallByName(functionCall.name, details?.context?.history);
    const function_name = lastFunctionCall?.name;
    const function_args = lastFunctionCall?.arguments;

    console.log(`🔧 Function call: ${function_name}`, function_args);
    // 채팅창에는 표시하지 않고 콘솔에만 로그    
  }
  function handleAgentToolEnd(details: any, _agent: any, _functionCall: any, result: any) {
    const lastFunctionCall = extractFunctionCallByName(_functionCall.name, details?.context?.history);
    console.log(`🔧 Function call result: ${lastFunctionCall?.name}`, maybeParseJson(result));
    // 채팅창에는 표시하지 않고 콘솔에만 로그
  }

  function handleHistoryAdded(item: any) {
    console.log("[handleHistoryAdded] ", item);
    if (!item || item.type !== 'message') return;

    const { itemId, role, content = [] } = item;
    if (itemId && role) {
      const isUser = role === "user";
      let text = extractMessageText(content);

      if (isUser && !text) {
        text = "[Transcribing...]";
      }

      // If the guardrail has been tripped, this message is a message that gets sent to the 
      // assistant to correct it, so we add it as a breadcrumb instead of a message.
      const guardrailMessage = sketchilyDetectGuardrailMessage(text);
      if (guardrailMessage) {
        const failureDetails = JSON.parse(guardrailMessage);
        console.log('🛡️ Output Guardrail Active', { details: failureDetails });
        // 채팅창에는 표시하지 않고 콘솔에만 로그
      } else {
        addTranscriptMessage(itemId, role, text);
      }
    }
  }

  function handleHistoryUpdated(items: any[]) {
    console.log("[handleHistoryUpdated] ", items);
    items.forEach((item: any) => {
      if (!item || item.type !== 'message') return;

      const { itemId, content = [] } = item;

      const text = extractMessageText(content);

      if (text) {
        updateTranscriptMessage(itemId, text, false);
      }
    });
  }

  function handleTranscriptionDelta(item: any) {
    const itemId = item.item_id;
    const deltaText = item.delta || "";
    
    if (itemId && deltaText) {
      // 더 강력한 필터링 적용
      const filteredResult = SpeechRecognitionFilter.filterRecognitionResult(deltaText, 0.9);
      
      // 추가 체크: 불완전한 영어 문장들
      const isIncompleteEnglish = /^(I|you|he|she|it|we|they)\s+(have|has|had|am|is|are|was|were)\s*$/i.test(deltaText.trim());
      const isShortEnglish = /^[a-zA-Z]{1,3}\s*$/.test(deltaText.trim());
      const hasDePattern = /de\s*$/i.test(deltaText.trim());
      
      if (isIncompleteEnglish || isShortEnglish || hasDePattern) {
        console.log('🎤 불완전한 영어 문장 필터링됨:', deltaText);
        // 필터링된 경우 "적고 있는 중..." 표시
        updateTranscriptMessage(itemId, "[적고 있는 중...]", true);
        return;
      }
      
      if (!filteredResult.isFiltered && filteredResult.text && filteredResult.text.length > 2) {
        // 필터링 통과한 텍스트만 표시
        updateTranscriptMessage(itemId, filteredResult.text, true);
        
        // 품질 추적에 추가
        SpeechQualityTracker.addRecognitionResult(filteredResult);
      } else {
        // 필터링된 텍스트는 표시하지 않음
        console.log('🎤 음성 인식 필터링됨:', {
          original: deltaText,
          reason: filteredResult.language,
          confidence: filteredResult.confidence
        });
      }
    }
  }

  function handleTranscriptionCompleted(item: any) {
    // History updates don't reliably end in a completed item, 
    // so we need to handle finishing up when the transcription is completed.
    const itemId = item.item_id;
    const rawTranscript = item.transcript || "";
    
    if (itemId) {
      // 최종 전사 결과도 강력한 필터링 적용
      const finalFilteredResult = SpeechRecognitionFilter.filterRecognitionResult(rawTranscript, 0.9);
      
      // 추가 체크: 불완전한 영어 문장들
      const isIncompleteEnglish = /^(I|you|he|she|it|we|they)\s+(have|has|had|am|is|are|was|were)\s*$/i.test(rawTranscript.trim());
      const isShortEnglish = /^[a-zA-Z]{1,3}\s*$/.test(rawTranscript.trim());
      const hasDePattern = /de\s*$/i.test(rawTranscript.trim());
      
      let finalTranscript;
      if (finalFilteredResult.isFiltered || !finalFilteredResult.text || 
          isIncompleteEnglish || isShortEnglish || hasDePattern) {
        // 필터링된 경우 사용자가 말하는 중으로 표시
        finalTranscript = "[적고 있는 중...]";
        console.log('🎤 최종 전사 필터링됨:', rawTranscript);
      } else {
        finalTranscript = finalFilteredResult.text;
      }
      
      updateTranscriptMessage(itemId, finalTranscript, false);
      
      // 품질 추적에 최종 결과 추가
      SpeechQualityTracker.addRecognitionResult(finalFilteredResult);
      
      // Use the ref to get the latest transcriptItems
      const transcriptItem = transcriptItems.find((i) => i.itemId === itemId);
      updateTranscriptItem(itemId, { status: 'DONE' });

      // If guardrailResult still pending, mark PASS.
      if (transcriptItem?.guardrailResult?.status === 'IN_PROGRESS') {
        updateTranscriptItem(itemId, {
          guardrailResult: {
            status: 'DONE',
            category: 'NONE',
            rationale: '',
          },
        });
      }
    }
  }

  function handleGuardrailTripped(details: any, _agent: any, guardrail: any) {
    console.log("[guardrail tripped]", details, _agent, guardrail);
    const moderation = extractModeration(guardrail.result.output.outputInfo);
    logServerEvent({ type: 'guardrail_tripped', payload: moderation });

    // find the last assistant message in details.context.history
    const lastAssistant = extractLastAssistantMessage(details?.context?.history);

    if (lastAssistant && moderation) {
      const category = moderation.moderationCategory ?? 'NONE';
      const rationale = moderation.moderationRationale ?? '';
      const offendingText: string | undefined = moderation?.testText;

      updateTranscriptItem(lastAssistant.itemId, {
        guardrailResult: {
          status: 'DONE',
          category,
          rationale,
          testText: offendingText,
        },
      });
    }
  }

  const handlersRef = useRef({
    handleAgentToolStart,
    handleAgentToolEnd,
    handleHistoryUpdated,
    handleHistoryAdded,
    handleTranscriptionDelta,
    handleTranscriptionCompleted,
    handleGuardrailTripped,
  });

  return handlersRef;
}