import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
  onConsultantSettingsClick: () => void;
  onMicrophoneSettingsClick: () => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  codec,
  onCodecChange,
  onConsultantSettingsClick,
  onMicrophoneSettingsClick,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCodec = e.target.value;
    onCodecChange(newCodec);
  };

  function getConnectionButtonLabel() {
    if (isConnected) return "통화 종료";
    if (isConnecting) return "연결 중...";
    return "통화 연결";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-white text-base p-2 w-36 rounded-full h-full font-medium transition-all duration-300";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-red-500 hover:bg-red-600 shadow-lg ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> green
    return `bg-[#58CC02] hover:bg-[#4BB302] shadow-lg ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4 flex flex-row items-center justify-between">
      {/* 왼쪽 그룹: 통화 연결과 눌러서 말하기 */}
      <div className="flex flex-row items-center gap-x-8">
        <button
          onClick={onToggleConnection}
          className={getConnectionButtonClasses()}
          disabled={isConnecting}
        >
          {getConnectionButtonLabel()}
        </button>

        <div className="flex flex-row items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              id="push-to-talk"
              type="checkbox"
              checked={isPTTActive}
              onChange={(e) => setIsPTTActive(e.target.checked)}
              disabled={!isConnected}
              className="w-4 h-4 text-[#58CC02] bg-white border-gray-300 rounded focus:ring-[#58CC02] focus:ring-2"
            />
            <label
              htmlFor="push-to-talk"
              className="flex items-center cursor-pointer text-gray-600 text-sm"
            >
              눌러서 말하기
            </label>
          </div>
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              handleTalkButtonDown();
            }}
            onMouseUp={(e) => {
              e.preventDefault();
              handleTalkButtonUp();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              handleTalkButtonDown();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleTalkButtonUp();
            }}
            disabled={!isPTTActive}
            className={
              (isPTTUserSpeaking ? "bg-green-500" : "bg-gray-100") +
              " py-2 px-4 cursor-pointer rounded-full select-none text-gray-700 border border-gray-300 transition-all" +
              (!isPTTActive ? " bg-gray-50 text-gray-400 border-gray-200" : " hover:bg-gray-200")
            }
          >
            말하기
          </button>
        </div>
      </div>

      {/* 오른쪽 그룹: 상담사 설정, 코덱, 로그 */}
      <div className="flex flex-row items-center gap-x-6">
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={onConsultantSettingsClick}
            className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all shadow-sm"
          >
            상담사 설정
          </button>
          <button
            onClick={onMicrophoneSettingsClick}
            className="px-3 py-1 bg-gray-100 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}

export default BottomToolbar;
