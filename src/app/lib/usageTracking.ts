// 사용량 추적 및 관리 시스템

export interface UserUsage {
  userId: string;
  totalCallTime: number; // 초 단위
  remainingTime: number; // 남은 시간 (초)
  lastCallDate: Date;
  isTestUser: boolean;
  testStartDate: Date;
  planType: 'free' | 'paid';
}

export interface CallSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // 초 단위
  status: 'active' | 'completed' | 'cancelled';
}

// 상수 정의
export const FREE_TRIAL_MINUTES = 30;
export const FREE_TRIAL_SECONDS = FREE_TRIAL_MINUTES * 60;

// 사용량 추적 클래스
export class UsageTracker {
  private static readonly FREE_TRIAL_MINUTES = FREE_TRIAL_MINUTES;
  private static readonly FREE_TRIAL_SECONDS = FREE_TRIAL_SECONDS;

  // 사용자 사용량 조회
  static getUserUsage(userId: string): UserUsage | null {
    try {
      const stored = localStorage.getItem(`usage_${userId}`);
      if (!stored) return null;
      
      const usage = JSON.parse(stored);
      return {
        ...usage,
        lastCallDate: new Date(usage.lastCallDate),
        testStartDate: new Date(usage.testStartDate)
      };
    } catch (error) {
      console.error('사용량 조회 실패:', error);
      return null;
    }
  }

  // 새 사용자 초기화 (30분 무료 체험)
  static initializeNewUser(userId: string): UserUsage {
    const newUsage: UserUsage = {
      userId,
      totalCallTime: 0,
      remainingTime: this.FREE_TRIAL_SECONDS,
      lastCallDate: new Date(),
      isTestUser: true,
      testStartDate: new Date(),
      planType: 'free'
    };

    this.saveUserUsage(newUsage);
    return newUsage;
  }

  // 사용량 저장
  static saveUserUsage(usage: UserUsage): void {
    try {
      localStorage.setItem(`usage_${usage.userId}`, JSON.stringify(usage));
    } catch (error) {
      console.error('사용량 저장 실패:', error);
    }
  }

  // 통화 시작
  static startCall(userId: string): CallSession {
    const sessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: CallSession = {
      sessionId,
      userId,
      startTime: new Date(),
      duration: 0,
      status: 'active'
    };

    // 세션 저장
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(session));
    return session;
  }

  // 통화 종료
  static endCall(sessionId: string): CallSession | null {
    try {
      const stored = localStorage.getItem(`session_${sessionId}`);
      if (!stored) return null;

      const session: CallSession = JSON.parse(stored);
      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(session.startTime).getTime()) / 1000);

      const updatedSession: CallSession = {
        ...session,
        endTime,
        duration,
        status: 'completed'
      };

      // 세션 업데이트
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(updatedSession));

      // 사용량 업데이트
      this.updateUserUsage(session.userId, duration);

      return updatedSession;
    } catch (error) {
      console.error('통화 종료 처리 실패:', error);
      return null;
    }
  }

  // 사용량 업데이트
  static updateUserUsage(userId: string, callDuration: number): UserUsage | null {
    const usage = this.getUserUsage(userId);
    if (!usage) return null;

    const updatedUsage: UserUsage = {
      ...usage,
      totalCallTime: usage.totalCallTime + callDuration,
      remainingTime: Math.max(0, usage.remainingTime - callDuration),
      lastCallDate: new Date()
    };

    this.saveUserUsage(updatedUsage);
    return updatedUsage;
  }

  // 실시간 사용량 업데이트 (1초씩)
  static updateUserUsageInRealTime(userId: string, seconds: number): UserUsage | null {
    const usage = this.getUserUsage(userId);
    if (!usage) return null;

    const updatedUsage: UserUsage = {
      ...usage,
      totalCallTime: usage.totalCallTime + seconds,
      remainingTime: Math.max(0, usage.remainingTime - seconds),
      lastCallDate: new Date()
    };

    this.saveUserUsage(updatedUsage);
    return updatedUsage;
  }

  // 사용 가능 여부 확인
  static canMakeCall(userId: string): { canCall: boolean; remainingTime: number; message?: string } {
    const usage = this.getUserUsage(userId);
    
    if (!usage) {
      return { canCall: true, remainingTime: this.FREE_TRIAL_SECONDS };
    }

    if (usage.remainingTime <= 0) {
      return {
        canCall: false,
        remainingTime: 0,
        message: '무료 체험 시간이 모두 소진되었습니다. 유료 플랜으로 업그레이드해주세요.'
      };
    }

    return {
      canCall: true,
      remainingTime: usage.remainingTime
    };
  }

  // 남은 시간 포맷팅
  static formatRemainingTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${remainingSeconds}초`;
  }

  // 사용량 경고 확인
  static checkUsageWarning(userId: string): { warning: boolean; message?: string } {
    const usage = this.getUserUsage(userId);
    if (!usage) return { warning: false };

    const remainingMinutes = Math.floor(usage.remainingTime / 60);
    
    if (remainingMinutes <= 5 && remainingMinutes > 0) {
      return {
        warning: true,
        message: `무료 체험이 ${remainingMinutes}분 남았습니다.`
      };
    }

    if (usage.remainingTime <= 0) {
      return {
        warning: true,
        message: '무료 체험이 완료되었습니다. 유료 플랜으로 업그레이드해주세요.'
      };
    }

    return { warning: false };
  }

  // 사용자 통계 조회
  static getUserStats(userId: string): {
    totalCallTime: number;
    remainingTime: number;
    usedPercentage: number;
    isTestUser: boolean;
    daysSinceStart: number;
  } {
    const usage = this.getUserUsage(userId);
    if (!usage) {
      return {
        totalCallTime: 0,
        remainingTime: this.FREE_TRIAL_SECONDS,
        usedPercentage: 0,
        isTestUser: true,
        daysSinceStart: 0
      };
    }

    const usedPercentage = Math.round((usage.totalCallTime / this.FREE_TRIAL_SECONDS) * 100);
    const daysSinceStart = Math.floor(
      (new Date().getTime() - new Date(usage.testStartDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      totalCallTime: usage.totalCallTime,
      remainingTime: usage.remainingTime,
      usedPercentage: Math.min(usedPercentage, 100),
      isTestUser: usage.isTestUser,
      daysSinceStart
    };
  }
}

// 실시간 사용량 모니터링
export class UsageMonitor {
  private static updateInterval: NodeJS.Timeout | null = null;
  private static listeners: ((usage: UserUsage) => void)[] = [];

  // 사용량 모니터링 시작
  static startMonitoring(userId: string, onUpdate: (usage: UserUsage) => void) {
    this.listeners.push(onUpdate);
    
    if (!this.updateInterval) {
      this.updateInterval = setInterval(() => {
        const usage = UsageTracker.getUserUsage(userId);
        if (usage) {
          this.listeners.forEach(listener => listener(usage));
        }
      }, 1000); // 1초마다 업데이트
    }
  }

  // 모니터링 중지
  static stopMonitoring() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.listeners = [];
  }
}
