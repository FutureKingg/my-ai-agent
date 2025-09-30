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
}: MicrophoneSettingsProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-5 w-80 max-w-sm mx-4 shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">마이크 설정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {/* 노이즈 제거 */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <h3 className="font-medium text-gray-800 text-sm">노이즈 제거</h3>
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
              <h3 className="font-medium text-gray-800 text-sm">에코 제거</h3>
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
              <h3 className="font-medium text-gray-800 text-sm">자동 게인 제어</h3>
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
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
}

export default MicrophoneSettings;
