// 사용자 인증 및 OAuth 연동 시스템

// 네이버 OAuth 설정
export const NAVER_OAUTH_CONFIG = {
  clientId: process.env.NAVER_CLIENT_ID || '',
  clientSecret: process.env.NAVER_CLIENT_SECRET || '',
  redirectUri: process.env.NAVER_REDIRECT_URI || 'http://localhost:3000/auth/naver/callback',
  authUrl: 'https://nid.naver.com/oauth2.0/authorize'
};

// 카카오 OAuth 설정
export const KAKAO_OAUTH_CONFIG = {
  clientId: process.env.KAKAO_CLIENT_ID || '',
  clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
  redirectUri: process.env.KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback',
  authUrl: 'https://kauth.kakao.com/oauth/authorize'
};

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  name: string;
  profileImage?: string;
  connectedServices: {
    naver?: {
      accessToken: string;
      refreshToken: string;
      connectedAt: Date;
    };
    kakao?: {
      accessToken: string;
      refreshToken: string;
      connectedAt: Date;
    };
    tableManager?: {
      restaurantId: string;
      apiKey: string;
      connectedAt: Date;
    };
  };
  createdAt: Date;
  lastLoginAt: Date;
}

// 네이버 OAuth 인증
export class NaverAuth {
  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: NAVER_OAUTH_CONFIG.clientId,
      redirect_uri: NAVER_OAUTH_CONFIG.redirectUri,
      state: state
    });
    
    return `${NAVER_OAUTH_CONFIG.authUrl}?${params.toString()}`;
  }

  static async getAccessToken(code: string, state: string): Promise<any> {
    try {
      const response = await fetch('https://nid.naver.com/oauth2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: NAVER_OAUTH_CONFIG.clientId,
          client_secret: NAVER_OAUTH_CONFIG.clientSecret,
          redirect_uri: NAVER_OAUTH_CONFIG.redirectUri,
          code: code,
          state: state
        })
      });

      return await response.json();
    } catch (error) {
      console.error('네이버 토큰 발급 실패:', error);
      throw error;
    }
  }

  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('네이버 사용자 정보 조회 실패:', error);
      throw error;
    }
  }
}

// 카카오 OAuth 인증
export class KakaoAuth {
  static getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: KAKAO_OAUTH_CONFIG.clientId,
      redirect_uri: KAKAO_OAUTH_CONFIG.redirectUri,
      state: state
    });
    
    return `${KAKAO_OAUTH_CONFIG.authUrl}?${params.toString()}`;
  }

  static async getAccessToken(code: string, state: string): Promise<any> {
    try {
      const response = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: KAKAO_OAUTH_CONFIG.clientId,
          client_secret: KAKAO_OAUTH_CONFIG.clientSecret,
          redirect_uri: KAKAO_OAUTH_CONFIG.redirectUri,
          code: code,
          state: state
        })
      });

      return await response.json();
    } catch (error) {
      console.error('카카오 토큰 발급 실패:', error);
      throw error;
    }
  }

  static async getUserInfo(accessToken: string): Promise<any> {
    try {
      const response = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('카카오 사용자 정보 조회 실패:', error);
      throw error;
    }
  }
}

// 사용자 관리 클래스
export class UserManager {
  // 사용자 생성 또는 업데이트
  static async createOrUpdateUser(userData: {
    email: string;
    name: string;
    profileImage?: string;
    service: 'naver' | 'kakao';
    accessToken: string;
    refreshToken: string;
  }): Promise<User> {
    // 실제로는 DB에 저장
    const user: User = {
      id: `user_${Date.now()}`,
      email: userData.email,
      name: userData.name,
      profileImage: userData.profileImage,
      connectedServices: {
        [userData.service]: {
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          connectedAt: new Date()
        }
      },
      createdAt: new Date(),
      lastLoginAt: new Date()
    };

    // 로컬 스토리지에 저장 (실제로는 DB)
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  }

  // 현재 사용자 조회
  static getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      return null;
    }
  }

  // 서비스 연동 추가
  static async connectService(userId: string, service: 'naver' | 'kakao' | 'tableManager', serviceData: any): Promise<User> {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 서비스 연동 정보 추가
    user.connectedServices[service] = {
      ...serviceData,
      connectedAt: new Date()
    };

    // 업데이트된 사용자 정보 저장
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  }

  // 서비스 연동 해제
  static async disconnectService(userId: string, service: 'naver' | 'kakao' | 'tableManager'): Promise<User> {
    const user = this.getCurrentUser();
    if (!user || user.id !== userId) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // 서비스 연동 정보 제거
    delete user.connectedServices[service];

    // 업데이트된 사용자 정보 저장
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    return user;
  }

  // 로그아웃
  static logout(): void {
    localStorage.removeItem('currentUser');
  }
}

// OAuth 콜백 처리
export class OAuthCallbackHandler {
  static async handleNaverCallback(code: string, state: string): Promise<User> {
    try {
      // 네이버에서 액세스 토큰 발급
      const tokenResponse = await NaverAuth.getAccessToken(code, state);
      
      // 사용자 정보 조회
      const userInfo = await NaverAuth.getUserInfo(tokenResponse.access_token);
      
      // 사용자 생성 또는 업데이트
      const user = await UserManager.createOrUpdateUser({
        email: userInfo.response.email,
        name: userInfo.response.name,
        profileImage: userInfo.response.profile_image,
        service: 'naver',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token
      });

      return user;
    } catch (error) {
      console.error('네이버 OAuth 콜백 처리 실패:', error);
      throw error;
    }
  }

  static async handleKakaoCallback(code: string, state: string): Promise<User> {
    try {
      // 카카오에서 액세스 토큰 발급
      const tokenResponse = await KakaoAuth.getAccessToken(code, state);
      
      // 사용자 정보 조회
      const userInfo = await KakaoAuth.getUserInfo(tokenResponse.access_token);
      
      // 사용자 생성 또는 업데이트
      const user = await UserManager.createOrUpdateUser({
        email: userInfo.kakao_account.email,
        name: userInfo.kakao_account.profile.nickname,
        profileImage: userInfo.kakao_account.profile.profile_image_url,
        service: 'kakao',
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token
      });

      return user;
    } catch (error) {
      console.error('카카오 OAuth 콜백 처리 실패:', error);
      throw error;
    }
  }
}
