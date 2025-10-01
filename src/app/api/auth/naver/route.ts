import { NextRequest, NextResponse } from 'next/server';
import { NaverAuth } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json({ error: '인증 코드가 없습니다.' }, { status: 400 });
    }

    // 네이버 OAuth 콜백 처리
    const tokenResponse = await NaverAuth.getAccessToken(code, state);
    const userInfo = await NaverAuth.getUserInfo(tokenResponse.access_token);

    // 사용자 정보 반환
    return NextResponse.json({
      success: true,
      user: {
        email: userInfo.response.email,
        name: userInfo.response.name,
        profileImage: userInfo.response.profile_image,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token
      }
    });

  } catch (error) {
    console.error('네이버 OAuth 처리 실패:', error);
    return NextResponse.json({ error: '인증 처리에 실패했습니다.' }, { status: 500 });
  }
}
