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
    const baseClasses = "text-white text-base p-2 w-36 rounded-md h-full";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> red
      return `bg-red-600 hover:bg-red-700 ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> black
    return `bg-black hover:bg-gray-900 ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="p-4 flex flex-row items-center justify-between">
      {/* 왼쪽 그룹: 통화 연결과 눌러서 말하기 */}
      <div className="flex flex-row items-center gap-x-8">
        <button
          onClick={onToggleConnection}
          className={getConnectionButtonClasses()}
          disabled={isConnecting}
        >
          {getConnectionButtonLabel()}
        </button>

        <div className="flex flex-row items-center gap-2">
          <input
            id="push-to-talk"
            type="checkbox"
            checked={isPTTActive}
            onChange={(e) => setIsPTTActive(e.target.checked)}
            disabled={!isConnected}
            className="w-4 h-4"
          />
          <label
            htmlFor="push-to-talk"
            className="flex items-center cursor-pointer"
          >
            눌러서 말하기
          </label>
          <button
            onMouseDown={handleTalkButtonDown}
            onMouseUp={handleTalkButtonUp}
            onTouchStart={handleTalkButtonDown}
            onTouchEnd={handleTalkButtonUp}
            disabled={!isPTTActive}
            className={
              (isPTTUserSpeaking ? "bg-gray-300" : "bg-gray-200") +
              " py-1 px-4 cursor-pointer rounded-md" +
              (!isPTTActive ? " bg-gray-100 text-gray-400" : "")
            }
          >
            말하기
          </button>
        </div>
      </div>

      {/* 오른쪽 그룹: 상담사 설정, 코덱, 로그 */}
      <div className="flex flex-row items-center gap-x-8">
        <div className="flex flex-row items-center gap-2">
          <button
            onClick={onConsultantSettingsClick}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-base"
          >
            상담사 설정
          </button>
        </div>

        <div className="flex flex-row items-center gap-2">
          <div>코덱:</div>
          <select
            id="codec-select"
            value={codec}
            onChange={handleCodecChange}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="opus">Opus (48 kHz)</option>
            <option value="pcmu">PCMU (8 kHz)</option>
            <option value="pcma">PCMA (8 kHz)</option>
          </select>
        </div>

        <div className="flex flex-row items-center gap-2">
          <input
            id="logs"
            type="checkbox"
            checked={isEventsPaneExpanded}
            onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="logs" className="flex items-center cursor-pointer">
            로그
          </label>
        </div>
      </div>
    </div>
  );
}

export default BottomToolbar;
