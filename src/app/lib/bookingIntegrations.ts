// 한국 주요 예약 시스템 연동 서비스

// 네이버 예약 API
export class NaverBookingAPI {
  private baseUrl = 'https://api.booking.naver.com/v1';
  private clientId: string;
  private clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  // 네이버 로그인 후 예약 시스템 연동
  async connectNaverBooking(naverToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${naverToken}`,
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret
        }
      });
      return await response.json();
    } catch (error) {
      console.error('네이버 예약 연동 실패:', error);
      throw error;
    }
  }

  // 네이버 예약 조회
  async getNaverBookings(accessToken: string, date?: string) {
    try {
      const url = `${this.baseUrl}/bookings${date ? `?date=${date}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Naver-Client-Id': this.clientId
        }
      });
      return await response.json();
    } catch (error) {
      console.error('네이버 예약 조회 실패:', error);
      throw error;
    }
  }

  // 네이버 예약 생성
  async createNaverBooking(accessToken: string, bookingData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Naver-Client-Id': this.clientId
        },
        body: JSON.stringify(bookingData)
      });
      return await response.json();
    } catch (error) {
      console.error('네이버 예약 생성 실패:', error);
      throw error;
    }
  }
}

// 카카오 예약 API
export class KakaoBookingAPI {
  private baseUrl = 'https://kapi.kakao.com/v1/booking';
  private appKey: string;

  constructor(appKey: string) {
    this.appKey = appKey;
  }

  // 카카오 로그인 후 예약 시스템 연동
  async connectKakaoBooking(kakaoToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${kakaoToken}`,
          'KakaoAK': this.appKey
        }
      });
      return await response.json();
    } catch (error) {
      console.error('카카오 예약 연동 실패:', error);
      throw error;
    }
  }

  // 카카오 예약 조회
  async getKakaoBookings(accessToken: string, date?: string) {
    try {
      const url = `${this.baseUrl}/bookings${date ? `?date=${date}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'KakaoAK': this.appKey
        }
      });
      return await response.json();
    } catch (error) {
      console.error('카카오 예약 조회 실패:', error);
      throw error;
    }
  }
}

// 테이블매니저 API
export class TableManagerAPI {
  private baseUrl = 'https://api.tablemanager.co.kr/v1';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 테이블매니저 연동
  async connectTableManager(restaurantId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${restaurantId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('테이블매니저 연동 실패:', error);
      throw error;
    }
  }

  // 테이블매니저 예약 조회
  async getTableManagerBookings(restaurantId: string, date?: string) {
    try {
      const url = `${this.baseUrl}/restaurants/${restaurantId}/bookings${date ? `?date=${date}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('테이블매니저 예약 조회 실패:', error);
      throw error;
    }
  }

  // 테이블매니저 예약 생성
  async createTableManagerBooking(restaurantId: string, bookingData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/restaurants/${restaurantId}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(bookingData)
      });
      return await response.json();
    } catch (error) {
      console.error('테이블매니저 예약 생성 실패:', error);
      throw error;
    }
  }
}

// 통합 예약 관리 시스템
export class IntegratedBookingManager {
  private naverAPI: NaverBookingAPI;
  private kakaoAPI: KakaoBookingAPI;
  private tableManagerAPI: TableManagerAPI;

  constructor() {
    this.naverAPI = new NaverBookingAPI(
      process.env.NAVER_CLIENT_ID || '',
      process.env.NAVER_CLIENT_SECRET || ''
    );
    this.kakaoAPI = new KakaoBookingAPI(
      process.env.KAKAO_APP_KEY || ''
    );
    this.tableManagerAPI = new TableManagerAPI(
      process.env.TABLE_MANAGER_API_KEY || ''
    );
  }

  // 사용자 예약 시스템 연동
  async connectUserBookingSystems(userId: string, connections: {
    naver?: { token: string };
    kakao?: { token: string };
    tableManager?: { restaurantId: string };
  }) {
    const results = [];

    // 네이버 예약 연동
    if (connections.naver) {
      try {
        const naverResult = await this.naverAPI.connectNaverBooking(connections.naver.token);
        results.push({
          system: 'naver',
          status: 'connected',
          data: naverResult
        });
      } catch (error) {
        results.push({
          system: 'naver',
          status: 'failed',
          error: error.message
        });
      }
    }

    // 카카오 예약 연동
    if (connections.kakao) {
      try {
        const kakaoResult = await this.kakaoAPI.connectKakaoBooking(connections.kakao.token);
        results.push({
          system: 'kakao',
          status: 'connected',
          data: kakaoResult
        });
      } catch (error) {
        results.push({
          system: 'kakao',
          status: 'failed',
          error: error.message
        });
      }
    }

    // 테이블매니저 연동
    if (connections.tableManager) {
      try {
        const tmResult = await this.tableManagerAPI.connectTableManager(connections.tableManager.restaurantId);
        results.push({
          system: 'tableManager',
          status: 'connected',
          data: tmResult
        });
      } catch (error) {
        results.push({
          system: 'tableManager',
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }

  // 통합 예약 조회
  async getAllBookings(userId: string, date?: string) {
    const allBookings = [];

    // 사용자의 연동된 시스템들 조회 (실제로는 DB에서 조회)
    const userConnections = await this.getUserConnections(userId);

    // 네이버 예약 조회
    if (userConnections.naver) {
      try {
        const naverBookings = await this.naverAPI.getNaverBookings(
          userConnections.naver.accessToken,
          date
        );
        allBookings.push(...naverBookings.map((booking: any) => ({
          ...booking,
          source: 'naver',
          system: '네이버 예약'
        })));
      } catch (error) {
        console.error('네이버 예약 조회 실패:', error);
      }
    }

    // 카카오 예약 조회
    if (userConnections.kakao) {
      try {
        const kakaoBookings = await this.kakaoAPI.getKakaoBookings(
          userConnections.kakao.accessToken,
          date
        );
        allBookings.push(...kakaoBookings.map((booking: any) => ({
          ...booking,
          source: 'kakao',
          system: '카카오 예약'
        })));
      } catch (error) {
        console.error('카카오 예약 조회 실패:', error);
      }
    }

    // 테이블매니저 예약 조회
    if (userConnections.tableManager) {
      try {
        const tmBookings = await this.tableManagerAPI.getTableManagerBookings(
          userConnections.tableManager.restaurantId,
          date
        );
        allBookings.push(...tmBookings.map((booking: any) => ({
          ...booking,
          source: 'tableManager',
          system: '테이블매니저'
        })));
      } catch (error) {
        console.error('테이블매니저 예약 조회 실패:', error);
      }
    }

    return allBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 실시간 예약 상태 동기화
  async syncBookingStatus(userId: string) {
    const bookings = await this.getAllBookings(userId);
    
    // 예약 상태 업데이트 (실제로는 DB에 저장)
    await this.updateBookingStatus(userId, bookings);
    
    return bookings;
  }

  // AI 통화 후 예약 생성
  async createBookingFromCall(callData: {
    userId: string;
    customerPhone: string;
    serviceType: string;
    preferredDate: string;
    preferredTime: string;
    notes?: string;
  }) {
    const userConnections = await this.getUserConnections(callData.userId);
    
    // 가장 적합한 예약 시스템 선택
    const targetSystem = this.selectBestBookingSystem(callData.serviceType, userConnections);
    
    if (!targetSystem) {
      throw new Error('연동된 예약 시스템이 없습니다.');
    }

    // 선택된 시스템에 예약 생성
    switch (targetSystem) {
      case 'naver':
        return await this.naverAPI.createNaverBooking(
          userConnections.naver.accessToken,
          {
            customerPhone: callData.customerPhone,
            serviceType: callData.serviceType,
            date: callData.preferredDate,
            time: callData.preferredTime,
            notes: callData.notes
          }
        );
      
      case 'kakao':
        return await this.kakaoAPI.getKakaoBookings(
          userConnections.kakao.accessToken,
          callData.preferredDate
        );
      
      case 'tableManager':
        return await this.tableManagerAPI.createTableManagerBooking(
          userConnections.tableManager.restaurantId,
          {
            customerPhone: callData.customerPhone,
            serviceType: callData.serviceType,
            date: callData.preferredDate,
            time: callData.preferredTime,
            notes: callData.notes
          }
        );
      
      default:
        throw new Error('지원하지 않는 예약 시스템입니다.');
    }
  }

  // 사용자 연동 정보 조회 (더미 데이터)
  private async getUserConnections(userId: string) {
    // 실제로는 DB에서 조회
    return {
      naver: {
        accessToken: 'naver_access_token_here',
        refreshToken: 'naver_refresh_token_here'
      },
      kakao: {
        accessToken: 'kakao_access_token_here',
        refreshToken: 'kakao_refresh_token_here'
      },
      tableManager: {
        restaurantId: 'restaurant_123',
        apiKey: 'table_manager_api_key_here'
      }
    };
  }

  // 예약 상태 업데이트 (더미 함수)
  private async updateBookingStatus(userId: string, bookings: any[]) {
    // 실제로는 DB에 저장
    console.log(`사용자 ${userId}의 예약 상태 업데이트:`, bookings.length, '개 예약');
  }

  // 최적 예약 시스템 선택
  private selectBestBookingSystem(serviceType: string, connections: any): string | null {
    if (serviceType.includes('미용') || serviceType.includes('헤어') || serviceType.includes('네일')) {
      if (connections.naver) return 'naver';
      if (connections.kakao) return 'kakao';
    }
    
    if (serviceType.includes('음식') || serviceType.includes('식당') || serviceType.includes('카페')) {
      if (connections.tableManager) return 'tableManager';
      if (connections.naver) return 'naver';
    }
    
    // 기본적으로 첫 번째 사용 가능한 시스템 선택
    if (connections.naver) return 'naver';
    if (connections.kakao) return 'kakao';
    if (connections.tableManager) return 'tableManager';
    
    return null;
  }
}

// API 인스턴스 생성
export const integratedBookingManager = new IntegratedBookingManager();
