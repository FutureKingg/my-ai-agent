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
    const baseClasses = "text-white text-base p-2 w-36 rounded-xl h-full font-medium transition-all duration-300";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red gradient
      return `bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> blue gradient
    return `bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border-t border-white/10 px-6 py-4 flex flex-row items-center justify-between">
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
              className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="push-to-talk"
              className="flex items-center cursor-pointer text-gray-300 text-sm"
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
              (isPTTUserSpeaking ? "bg-green-500/80" : "bg-white/10") +
              " py-2 px-4 cursor-pointer rounded-lg select-none text-white border border-white/20 transition-all" +
              (!isPTTActive ? " bg-white/5 text-gray-500 border-white/10" : " hover:bg-white/20")
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
            className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 text-sm font-medium transition-all shadow-sm"
          >
            상담사 설정
          </button>
          <button
            onClick={onMicrophoneSettingsClick}
            className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-lg hover:bg-white/20 text-sm font-medium transition-all shadow-sm"
          >
            마이크 설정
          </button>
        </div>

        <div className="flex flex-row items-center gap-2">
          <div className="text-gray-300 text-sm">코덱:</div>
          <select
            id="codec-select"
            value={codec}
            onChange={handleCodecChange}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-2 py-0 focus:outline-none cursor-pointer text-white text-sm"
          >
            <option value="opus" className="bg-slate-800 text-white">Opus (48 kHz)</option>
            <option value="pcmu" className="bg-slate-800 text-white">PCMU (8 kHz)</option>
            <option value="pcma" className="bg-slate-800 text-white">PCMA (8 kHz)</option>
          </select>
        </div>

        <div className="flex flex-row items-center gap-2">
          <input
            id="logs"
            type="checkbox"
            checked={isEventsPaneExpanded}
            onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="logs" className="flex items-center cursor-pointer text-gray-300 text-sm">
            로그
          </label>
        </div>
      </div>
    </div>
  );
}

export default BottomToolbar;
