"use client";

import React, { useState, useEffect } from 'react';
import { UsageTracker, UsageMonitor, UserUsage } from '@/app/lib/usageTracking';

interface UsageTrackerProps {
  userId: string;
  onUsageLimitReached?: () => void;
  onWarningShown?: (message: string) => void;
}

export default function UsageTrackerComponent({ 
  userId, 
  onUsageLimitReached, 
  onWarningShown 
}: UsageTrackerProps) {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // 초기 사용량 로드
    const initialUsage = UsageTracker.getUserUsage(userId);
    if (!initialUsage) {
      // 새 사용자 초기화
      const newUsage = UsageTracker.initializeNewUser(userId);
      setUsage(newUsage);
    } else {
      setUsage(initialUsage);
    }

    // 통계 로드
    const userStats = UsageTracker.getUserStats(userId);
    setStats(userStats);

    // 사용량 경고 확인
    const warning = UsageTracker.checkUsageWarning(userId);
    if (warning.warning && warning.message) {
      onWarningShown?.(warning.message);
    }

    // 실시간 모니터링 시작
    setIsMonitoring(true);
    UsageMonitor.startMonitoring(userId, (updatedUsage) => {
      setUsage(updatedUsage);
      const updatedStats = UsageTracker.getUserStats(userId);
      setStats(updatedStats);
      
      // 로그 제거 - UI에서만 업데이트 표시

      // 사용량 한도 도달 확인
      if (updatedUsage.remainingTime <= 0) {
        onUsageLimitReached?.();
      }

      // 경고 확인
      const warning = UsageTracker.checkUsageWarning(userId);
      if (warning.warning && warning.message) {
        onWarningShown?.(warning.message);
      }
    });

    return () => {
      UsageMonitor.stopMonitoring();
      setIsMonitoring(false);
    };
  }, [userId, onUsageLimitReached, onWarningShown]);

  if (!usage || !stats) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#58CC02]"></div>
      </div>
    );
  }

  const progressPercentage = Math.min((usage.totalCallTime / (30 * 60)) * 100, 100);
  const isNearLimit = usage.remainingTime <= 5 * 60; // 5분 이하
  const isLimitReached = usage.remainingTime <= 0;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-4 shadow-lg h-full flex flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#58CC02] to-[#4BB302] rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {usage.isTestUser ? '무료 체험' : '사용량'}
            </h3>
            <p className="text-xs text-gray-500">AI 통화 서비스</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-gray-500 font-medium">
            {isMonitoring ? '실시간' : '대기'}
          </span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium text-gray-700">사용 진행률</span>
          <span className="text-lg font-bold text-gray-900">{Math.round(progressPercentage)}%</span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ease-out relative ${
                isLimitReached 
                  ? 'bg-gradient-to-r from-red-500 to-red-600' 
                  : isNearLimit 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-[#58CC02] to-[#4BB302]'
              }`}
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>0분</span>
            <span>30분</span>
          </div>
        </div>
      </div>

      {/* 사용량 정보 */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">사용 시간</span>
          </div>
          <div className="text-lg font-bold text-gray-900">
            {UsageTracker.formatRemainingTime(usage.totalCallTime)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isLimitReached 
                ? 'bg-red-100' 
                : isNearLimit 
                ? 'bg-yellow-100' 
                : 'bg-green-100'
            }`}>
              <svg className={`w-3 h-3 ${
                isLimitReached 
                  ? 'text-red-600' 
                  : isNearLimit 
                  ? 'text-yellow-600' 
                  : 'text-green-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-600">남은 시간</span>
          </div>
          <div className={`text-lg font-bold ${
            isLimitReached 
              ? 'text-red-600' 
              : isNearLimit 
              ? 'text-yellow-600' 
              : 'text-gray-900'
          }`}>
            {isLimitReached ? '0초' : UsageTracker.formatRemainingTime(usage.remainingTime)}
          </div>
        </div>
      </div>

      {/* 상태 메시지 */}
      {isLimitReached && (
        <div className="mb-4 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-red-800">체험 완료</div>
              <div className="text-xs text-red-600">유료 플랜으로 업그레이드해주세요</div>
            </div>
          </div>
        </div>
      )}

      {isNearLimit && !isLimitReached && (
        <div className="mb-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-100 border border-yellow-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-yellow-800">체험 종료 임박</div>
              <div className="text-xs text-yellow-600">
                {UsageTracker.formatRemainingTime(usage.remainingTime)} 남음
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 통계 정보 */}
      <div className="mt-auto pt-3 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs font-medium text-gray-600 mb-2">체험 정보</div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">시작일</span>
              <span className="text-xs font-medium text-gray-700">
                {new Date(usage.testStartDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">마지막 사용</span>
              <span className="text-xs font-medium text-gray-700">
                {new Date(usage.lastCallDate).toLocaleTimeString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">사용 일수</span>
              <span className="text-xs font-medium text-gray-700">
                {stats.daysSinceStart}일
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
