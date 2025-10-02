import { useState, useEffect, useCallback } from 'react';
import { UsageTracker, UserUsage } from '@/app/lib/usageTracking';
import { RealTimeUsageTracker } from '@/app/lib/realTimeUsageTracker';

export interface UseUsageTrackingReturn {
  usage: UserUsage | null;
  stats: any;
  canMakeCall: boolean;
  remainingTime: number;
  startCall: () => string | null;
  endCall: (sessionId: string) => void;
  checkUsage: () => { canCall: boolean; remainingTime: number; message?: string };
  formatTime: (seconds: number) => string;
  isLoading: boolean;
}

export function useUsageTracking(userId: string): UseUsageTrackingReturn {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // 사용량 로드
  const loadUsage = useCallback(() => {
    try {
      const userUsage = UsageTracker.getUserUsage(userId);
      if (!userUsage) {
        // 새 사용자 초기화
        const newUsage = UsageTracker.initializeNewUser(userId);
        setUsage(newUsage);
      } else {
        setUsage(userUsage);
      }

      const userStats = UsageTracker.getUserStats(userId);
      setStats(userStats);
    } catch (error) {
      console.error('사용량 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 사용 가능 여부 확인
  const checkUsage = useCallback(() => {
    return UsageTracker.canMakeCall(userId);
  }, [userId]);

  // 통화 시작
  const startCall = useCallback(() => {
    const usageCheck = checkUsage();
    if (!usageCheck.canCall) {
      return null;
    }

    const session = UsageTracker.startCall(userId);
    setCurrentSessionId(session.sessionId);
    return session.sessionId;
  }, [userId, checkUsage]);

  // 통화 종료
  const endCall = useCallback((sessionId: string) => {
    const endedSession = UsageTracker.endCall(sessionId);
    if (endedSession) {
      // 사용량 업데이트
      loadUsage();
    }
    setCurrentSessionId(null);
  }, [loadUsage]);

  // 시간 포맷팅
  const formatTime = useCallback((seconds: number) => {
    return UsageTracker.formatRemainingTime(seconds);
  }, []);

  // 초기 로드
  useEffect(() => {
    loadUsage();
  }, [loadUsage]);

  // 실시간 업데이트 (1초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      // 통화 중일 때만 더 자주 업데이트
      if (currentSessionId) {
        loadUsage();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [loadUsage, currentSessionId]);

  // RealTimeUsageTracker 리스너 등록
  useEffect(() => {
    const handleUsageUpdate = (updatedUsage: UserUsage) => {
      setUsage(updatedUsage);
      // 로그 제거 - UI에서만 업데이트 표시
    };

    RealTimeUsageTracker.addListener(handleUsageUpdate);

    return () => {
      RealTimeUsageTracker.removeListener(handleUsageUpdate);
    };
  }, []);

  const usageCheck = checkUsage();

  return {
    usage,
    stats,
    canMakeCall: usageCheck.canCall,
    remainingTime: usageCheck.remainingTime,
    startCall,
    endCall,
    checkUsage,
    formatTime,
    isLoading
  };
}
