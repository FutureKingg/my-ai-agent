// 실시간 사용량 추적 시스템

import { UsageTracker, UserUsage } from './usageTracking';

export class RealTimeUsageTracker {
  private static activeSessions: Map<string, { startTime: Date; userId: string }> = new Map();
  private static updateInterval: NodeJS.Timeout | null = null;
  private static listeners: ((usage: UserUsage) => void)[] = [];

  // 통화 시작
  static startCall(userId: string, sessionId: string): void {
    this.activeSessions.set(sessionId, {
      startTime: new Date(),
      userId
    });

    // 실시간 업데이트 시작 (아직 시작되지 않은 경우)
    if (!this.updateInterval) {
      this.startRealTimeUpdates();
    }

    // 로그 제거 - 성능 최적화
  }

  // 통화 종료
  static endCall(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
      
      // 사용량 업데이트
      UsageTracker.updateUserUsage(session.userId, duration);
      
      this.activeSessions.delete(sessionId);
      // 로그 제거 - 성능 최적화
    }

    // 활성 세션이 없으면 업데이트 중지
    if (this.activeSessions.size === 0) {
      this.stopRealTimeUpdates();
    }
  }

  // 실시간 업데이트 시작
  private static startRealTimeUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateActiveSessions();
    }, 1000); // 1초마다 업데이트
  }

  // 실시간 업데이트 중지
  private static stopRealTimeUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // 활성 세션들 업데이트
  private static updateActiveSessions(): void {
    const now = new Date();
    
    for (const [sessionId, session] of this.activeSessions) {
      const currentDuration = Math.floor((now.getTime() - session.startTime.getTime()) / 1000);
      
      // 실제로 사용량을 업데이트하고 저장 (로그 제거)
      const updatedUsage = UsageTracker.updateUserUsageInRealTime(session.userId, 1); // 1초씩 증가
      
      if (updatedUsage) {
        // 리스너들에게 업데이트 알림
        this.notifyListeners(updatedUsage);
      }
    }
  }

  // 리스너 추가
  static addListener(listener: (usage: UserUsage) => void): void {
    this.listeners.push(listener);
  }

  // 리스너 제거
  static removeListener(listener: (usage: UserUsage) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 리스너들에게 알림
  private static notifyListeners(usage: UserUsage): void {
    this.listeners.forEach(listener => {
      try {
        listener(usage);
      } catch (error) {
        console.error('사용량 리스너 오류:', error);
      }
    });
  }

  // 활성 세션 수 조회
  static getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  // 사용자별 활성 세션 조회
  static getUserActiveSessions(userId: string): string[] {
    const userSessions: string[] = [];
    for (const [sessionId, session] of this.activeSessions) {
      if (session.userId === userId) {
        userSessions.push(sessionId);
      }
    }
    return userSessions;
  }

  // 모든 세션 정리
  static cleanup(): void {
    this.activeSessions.clear();
    this.stopRealTimeUpdates();
    this.listeners = [];
  }
}
