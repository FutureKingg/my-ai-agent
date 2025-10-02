import React from "react";

interface MicrophoneSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (val: boolean) => void;
  echoCancellation: boolean;
  setEchoCancellation: (val: boolean) => void;
  autoGainControl: boolean;
  setAutoGainControl: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  vadThreshold: number;
  setVadThreshold: (val: number) => void;
}

function MicrophoneSettings({
  isOpen,
  onClose,
  noiseSuppression,
  setNoiseSuppression,
  echoCancellation,
  setEchoCancellation,
  autoGainControl,
  setAutoGainControl,
  codec,
  onCodecChange,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  vadThreshold,
  setVadThreshold,
}: MicrophoneSettingsProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-5 w-80 max-w-sm mx-4 shadow-2xl border border-gray-200 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">통합 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        {/* 마이크 설정 섹션 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-base border-b border-gray-200 pb-2">마이크 설정</h3>
          <div className="space-y-3">
            {/* 잡음 제거 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">잡음 제거</h4>
                <p className="text-xs text-gray-500 mt-0.5">배경 소음을 자동으로 제거합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={(e) => setNoiseSuppression(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 에코 제거 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">에코 제거</h4>
                <p className="text-xs text-gray-500 mt-0.5">스피커 소리가 마이크로 다시 들어가는 것을 방지합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={echoCancellation}
                  onChange={(e) => setEchoCancellation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 자동 게인 제어 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">자동 게인 제어</h4>
                <p className="text-xs text-gray-500 mt-0.5">음량을 자동으로 조절하여 일정한 음질을 유지합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoGainControl}
                  onChange={(e) => setAutoGainControl(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 음성 감지 민감도 */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm mb-2">음성 감지 민감도 <span className="text-red-500 text-xs">(미구현)</span></h4>
                <p className="text-xs text-gray-500 mb-3">소음이 많은 환경에서는 높게 설정하세요</p>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-gray-600">낮음</span>
                  <input
                    type="range"
                    min="0.3"
                    max="0.9"
                    step="0.1"
                    value={vadThreshold}
                    onChange={(e) => setVadThreshold(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-600">높음</span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  현재 값: {vadThreshold.toFixed(1)} 
                  {vadThreshold >= 0.7 ? ' (소음 많은 환경 권장)' : 
                   vadThreshold >= 0.5 ? ' (일반 환경)' : ' (조용한 환경)'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* 오디오 설정 섹션 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-base border-b border-gray-200 pb-2">오디오 설정</h3>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm mb-2">오디오 코덱</h4>
                <p className="text-xs text-gray-500 mb-3">음질과 대역폭을 선택하세요</p>
                <select
                  value={codec}
                  onChange={(e) => onCodecChange(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58CC02]"
                >
                  <option value="opus" className="bg-white text-gray-900">Opus (48 kHz) - 고품질</option>
                  <option value="pcmu" className="bg-white text-gray-900">PCMU (8 kHz) - 전화와 동일</option>
                  <option value="pcma" className="bg-white text-gray-900">PCMA (8 kHz) - 전화와 동일</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* 로그 설정 섹션 */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 text-base border-b border-gray-200 pb-2">로그 설정</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">이벤트 로그</h4>
                <p className="text-xs text-gray-500 mt-0.5">통화 이벤트를 실시간으로 표시합니다</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEventsPaneExpanded}
                  onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#58CC02] text-white rounded-lg hover:bg-[#4BB302] transition-colors text-sm font-medium shadow-sm"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default MicrophoneSettings;
