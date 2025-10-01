import { NextRequest, NextResponse } from 'next/server';
import { integratedBookingManager } from '@/app/lib/bookingIntegrations';

// 예약 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const date = searchParams.get('date');

    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    // 모든 예약 조회
    const bookings = await integratedBookingManager.getAllBookings(userId, date || undefined);

    return NextResponse.json({
      success: true,
      bookings,
      count: bookings.length
    });

  } catch (error) {
    console.error('예약 조회 실패:', error);
    return NextResponse.json({ error: '예약 조회에 실패했습니다.' }, { status: 500 });
  }
}

// 예약 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, customerPhone, serviceType, preferredDate, preferredTime, notes } = body;

    if (!userId || !customerPhone || !serviceType || !preferredDate || !preferredTime) {
      return NextResponse.json({ 
        error: '필수 정보가 누락되었습니다.' 
      }, { status: 400 });
    }

    // AI 통화 후 예약 생성
    const booking = await integratedBookingManager.createBookingFromCall({
      userId,
      customerPhone,
      serviceType,
      preferredDate,
      preferredTime,
      notes
    });

    return NextResponse.json({
      success: true,
      booking,
      message: '예약이 성공적으로 생성되었습니다.'
    });

  } catch (error) {
    console.error('예약 생성 실패:', error);
    return NextResponse.json({ 
      error: '예약 생성에 실패했습니다.',
      details: error.message 
    }, { status: 500 });
  }
}
