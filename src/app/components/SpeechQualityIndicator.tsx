"use client";

import React, { useState, useEffect } from 'react';
import { SpeechQualityTracker } from '@/app/lib/speechRecognitionFilter';

interface SpeechQualityIndicatorProps {
  isVisible?: boolean;
}

export default function SpeechQualityIndicator({ isVisible = true }: SpeechQualityIndicatorProps) {
  const [qualityStats, setQualityStats] = useState({
    totalRecognitions: 0,
    successfulRecognitions: 0,
    filteredRecognitions: 0,
    averageConfidence: 0,
    koreanRatio: 0
  });

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      const stats = SpeechQualityTracker.getQualityStats();
      setQualityStats(stats);
    };

    // 초기 로드
    updateStats();

    // 2초마다 업데이트
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || qualityStats.totalRecognitions === 0) {
    return null;
  }

  const qualityScore = qualityStats.koreanRatio;
  const isGoodQuality = qualityScore >= 70;
  const isPoorQuality = qualityScore < 30;

  return (
    <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${
          isGoodQuality ? 'bg-green-500' : isPoorQuality ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
        <span className="text-xs font-medium text-gray-700">음성 인식 품질</span>
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div>한국어 인식률: {qualityScore.toFixed(1)}%</div>
        <div>성공: {qualityStats.successfulRecognitions}/{qualityStats.totalRecognitions}</div>
        <div>필터링: {qualityStats.filteredRecognitions}회</div>
      </div>

      {isPoorQuality && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-700">
          💡 더 명확하게 말씀해주세요
        </div>
      )}
    </div>
  );
}
