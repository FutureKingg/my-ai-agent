"use-client";

import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { TranscriptItem } from "@/app/types";
import Image from "next/image";
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { DownloadIcon, ClipboardCopyIcon } from "@radix-ui/react-icons";
import { GuardrailChip } from "./GuardrailChip";

export interface TranscriptProps {
  userText: string;
  setUserText: (val: string) => void;
  onSendMessage: () => void;
  canSend: boolean;
  downloadRecording: () => void;
}

function Transcript({
  userText,
  setUserText,
  onSendMessage,
  canSend,
  downloadRecording,
}: TranscriptProps) {
  const { transcriptItems, toggleTranscriptItemExpand } = useTranscript();
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const [prevLogs, setPrevLogs] = useState<TranscriptItem[]>([]);
  const [justCopied, setJustCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function scrollToBottom() {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }

  useEffect(() => {
    const hasNewMessage = transcriptItems.length > prevLogs.length;
    const hasUpdatedMessage = transcriptItems.some((newItem, index) => {
      const oldItem = prevLogs[index];
      return (
        oldItem &&
        (newItem.title !== oldItem.title || newItem.data !== oldItem.data)
      );
    });

    if (hasNewMessage || hasUpdatedMessage) {
      scrollToBottom();
    }

    setPrevLogs(transcriptItems);
  }, [transcriptItems]);

  // Autofocus on text box input on load
  useEffect(() => {
    if (canSend && inputRef.current) {
      inputRef.current.focus();
    }
  }, [canSend]);

  const handleCopyTranscript = async () => {
    if (!transcriptRef.current) return;
    try {
      await navigator.clipboard.writeText(transcriptRef.current.innerText);
      setJustCopied(true);
      setTimeout(() => setJustCopied(false), 1500);
    } catch (error) {
      console.error("Failed to copy transcript:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0">
        <span className="font-semibold text-gray-900 text-sm">대화 내용</span>
        <div className="flex gap-x-2">
          <button
            onClick={handleCopyTranscript}
            className="w-24 text-sm px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-x-1 transition-all"
          >
            <ClipboardCopyIcon />
            {justCopied ? "복사됨!" : "복사"}
          </button>
          <button
            onClick={downloadRecording}
            className="w-40 text-sm px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 flex items-center justify-center gap-x-1 transition-all"
          >
            <DownloadIcon />
            <span>오디오 다운로드</span>
          </button>
        </div>
      </div>

      {/* Transcript Content - Takes remaining space */}
      <div
        ref={transcriptRef}
        className="flex-1 overflow-auto p-4 flex flex-col gap-y-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent'
        }}
      >
          {[...transcriptItems]
            .sort((a, b) => a.createdAtMs - b.createdAtMs)
            .map((item) => {
              const {
                itemId,
                type,
                role,
                data,
                expanded,
                timestamp,
                title = "",
                isHidden,
                guardrailResult,
              } = item;

            if (isHidden) {
              return null;
            }

            if (type === "MESSAGE") {
              const isUser = role === "user";
              const containerClasses = `flex justify-end flex-col ${
                isUser ? "items-end" : "items-start"
              }`;
              const bubbleBase = `max-w-lg p-2.5 ${
                isUser ? "bg-[#58CC02] text-white" : "bg-gray-100 border border-gray-200 text-gray-900"
              }`;
              const isBracketedMessage =
                title.startsWith("[") && title.endsWith("]");
              const messageStyle = isBracketedMessage
                ? 'italic text-gray-500'
                : '';
              const displayTitle = isBracketedMessage
                ? title.slice(1, -1)
                : title;

              return (
                <div key={itemId} className={containerClasses}>
                  <div className="max-w-lg">
                    <div
                      className={`${bubbleBase} rounded-xl ${
                        guardrailResult ? "rounded-b-none" : ""
                      } shadow-lg`}
                    >
                      <div
                        className={`text-xs ${
                          isUser ? "text-blue-100" : "text-gray-400"
                        } font-inter`}
                      >
                        {timestamp}
                      </div>
                      <div className={`whitespace-pre-wrap ${messageStyle}`}>
                        <ReactMarkdown>{displayTitle}</ReactMarkdown>
                      </div>
                    </div>
                    {guardrailResult && (
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-2 rounded-b-xl">
                        <GuardrailChip guardrailResult={guardrailResult} />
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (type === "BREADCRUMB") {
              return (
                <div
                  key={itemId}
                  className="flex flex-col justify-start items-start text-gray-400 text-sm"
                >
                  <span className="text-xs font-inter text-gray-500">{timestamp}</span>
                  <div
                    className={`whitespace-pre-wrap flex items-center font-mono text-sm text-gray-300 ${
                      data ? "cursor-pointer hover:text-white" : ""
                    }`}
                    onClick={() => data && toggleTranscriptItemExpand(itemId)}
                  >
                    {data && (
                      <span
                        className={`text-gray-400 mr-1 transform transition-transform duration-200 select-none font-mono ${
                          expanded ? "rotate-90" : "rotate-0"
                        }`}
                      >
                        ▶
                      </span>
                    )}
                    {title}
                  </div>
                  {expanded && data && (
                    <div className="text-gray-300 text-left">
                      <pre className="border-l-2 ml-1 border-white/20 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            } else {
              // Fallback if type is neither MESSAGE nor BREADCRUMB
              return (
                <div
                  key={itemId}
                  className="flex justify-center text-gray-400 text-sm italic font-mono"
                >
                  Unknown item type: {type}{" "}
                  <span className="ml-2 text-xs font-inter text-gray-500">{timestamp}</span>
                </div>
              );
            }
          })}
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="p-3 flex-shrink-0 border-t border-gray-200">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSend) {
                onSendMessage();
              }
            }}
            className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent transition-all"
            placeholder="메시지를 입력하세요..."
          />
          <button
            onClick={onSendMessage}
            disabled={!canSend || !userText.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#58CC02] text-white rounded-full p-2 disabled:opacity-50 hover:bg-[#4BB302] transition-all shadow-lg"
          >
            <Image src="arrow.svg" alt="전송" width={16} height={16} className="filter brightness-0 invert" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Transcript;
