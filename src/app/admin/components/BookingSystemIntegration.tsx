"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  LinkIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { integratedBookingManager } from '@/app/lib/bookingIntegrations';

interface BookingSystem {
  id: string;
  name: string;
  type: 'naver' | 'kakao' | 'tableManager';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  bookingCount: number;
}

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  source: string;
  system: string;
}

export default function BookingSystemIntegration() {
  const [bookingSystems, setBookingSystems] = useState<BookingSystem[]>([
    {
      id: 'naver',
      name: '네이버 예약',
      type: 'naver',
      status: 'connected',
      lastSync: '2024-01-15 14:30',
      bookingCount: 12
    },
    {
      id: 'kakao',
      name: '카카오 예약',
      type: 'kakao',
      status: 'connected',
      lastSync: '2024-01-15 14:25',
      bookingCount: 8
    },
    {
      id: 'tableManager',
      name: '테이블매니저',
      type: 'tableManager',
      status: 'connected',
      lastSync: '2024-01-15 14:20',
      bookingCount: 15
    }
  ]);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 통합 예약 조회
  const loadAllBookings = async () => {
    setLoading(true);
    try {
      // 실제 API 호출
      const bookings = await integratedBookingManager.getAllBookings('user123', selectedDate);
      setAllBookings(bookings);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      // 더미 데이터 사용
      setAllBookings([
        {
          id: '1',
          customerName: '김철수',
          customerPhone: '010-1234-5678',
          serviceType: '헤어컷',
          date: '2024-01-16',
          time: '14:00',
          status: 'confirmed',
          source: 'naver',
          system: '네이버 예약'
        },
        {
          id: '2',
          customerName: '이영희',
          customerPhone: '010-9876-5432',
          serviceType: '네일아트',
          date: '2024-01-16',
          time: '16:30',
          status: 'pending',
          source: 'kakao',
          system: '카카오 예약'
        },
        {
          id: '3',
          customerName: '박민수',
          customerPhone: '010-5555-1234',
          serviceType: '저녁 식사',
          date: '2024-01-16',
          time: '19:00',
          status: 'confirmed',
          source: 'tableManager',
          system: '테이블매니저'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 예약 시스템 연동
  const connectBookingSystem = async (systemType: string) => {
    try {
      const result = await integratedBookingManager.connectUserBookingSystems('user123', {
        [systemType]: { token: 'sample_token' }
      });
      
      // 연동 결과에 따라 상태 업데이트
      setBookingSystems(prev => prev.map(system => 
        system.type === systemType 
          ? { ...system, status: 'connected', lastSync: new Date().toLocaleString() }
          : system
      ));
      
      console.log(`${systemType} 연동 완료:`, result);
    } catch (error) {
      console.error(`${systemType} 연동 실패:`, error);
    }
  };

  // 실시간 동기화
  const syncAllSystems = async () => {
    setLoading(true);
    try {
      await integratedBookingManager.syncBookingStatus('user123');
      await loadAllBookings();
      
      // 마지막 동기화 시간 업데이트
      setBookingSystems(prev => prev.map(system => ({
        ...system,
        lastSync: new Date().toLocaleString()
      })));
    } catch (error) {
      console.error('동기화 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBookings();
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '연결됨';
      case 'disconnected': return '연결 안됨';
      case 'error': return '오류';
      default: return status;
    }
  };

  const getSystemLogo = (type: string) => {
    switch (type) {
      case 'naver': return '/images/logos/네이버.png';
      case 'kakao': return '/images/logos/카카오.png';
      case 'tableManager': return '/images/logos/테이블매니저.png';
      default: return '/images/logos/CatchTable.png';
    }
  };

  return (
    <div className="space-y-6">
      {/* 예약 시스템 연동 상태 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">예약 시스템 연동</h3>
            <button
              onClick={syncAllSystems}
              disabled={loading}
              className="bg-[#58CC02] text-white px-4 py-2 rounded-lg hover:bg-[#4BB302] transition-colors disabled:opacity-50"
            >
              {loading ? '동기화 중...' : '전체 동기화'}
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bookingSystems.map((system) => (
              <div key={system.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <Image
                        src={getSystemLogo(system.type)}
                        alt={system.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<div class="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-xs font-medium">${system.name.charAt(0)}</div>`;
                          }
                        }}
                      />
                    </div>
                    <span className="font-medium text-gray-900">{system.name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(system.status)}`}>
                    {getStatusText(system.status)}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>예약 수:</span>
                    <span className="font-medium">{system.bookingCount}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span>마지막 동기화:</span>
                    <span className="font-medium">{system.lastSync}</span>
                  </div>
                </div>
                {system.status === 'disconnected' && (
                  <button
                    onClick={() => connectBookingSystem(system.type)}
                    className="w-full mt-3 bg-[#58CC02] text-white py-2 rounded-lg hover:bg-[#4BB302] transition-colors text-sm"
                  >
                    연동하기
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 통합 예약 관리 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">통합 예약 관리</h3>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
              />
              <button
                onClick={loadAllBookings}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                새로고침
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#58CC02] mx-auto"></div>
              <p className="text-gray-500 mt-2">예약 데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#58CC02] rounded-full flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{booking.customerName}</p>
                      <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                      <p className="text-sm text-gray-600">{booking.serviceType}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{booking.date}</p>
                      <p className="text-sm text-gray-500">{booking.time}</p>
                      <p className="text-xs text-gray-400">{booking.system}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {booking.status === 'confirmed' ? '확정' :
                       booking.status === 'pending' ? '대기' : '취소'}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-[#58CC02] hover:text-[#4BB302] text-sm">편집</button>
                      <button className="text-red-600 hover:text-red-900 text-sm">취소</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI 통화 연동 설정 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">AI 통화 연동 설정</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">자동 예약 생성</p>
                <p className="text-sm text-gray-500">AI 통화 후 자동으로 예약을 생성합니다</p>
              </div>
              <button className="bg-[#58CC02] text-white px-4 py-2 rounded-lg">활성화</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">실시간 동기화</p>
                <p className="text-sm text-gray-500">예약 상태를 실시간으로 동기화합니다</p>
              </div>
              <button className="bg-[#58CC02] text-white px-4 py-2 rounded-lg">활성화</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">고객 알림</p>
                <p className="text-sm text-gray-500">예약 확정/변경 시 고객에게 알림을 보냅니다</p>
              </div>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">비활성화</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
