"use client";

import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { bookingAPI, crmAPI, integratedAPI } from '@/app/lib/apiServices';
import Image from 'next/image';

interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  totalCalls: number;
  lastCallDate: string;
}

export default function BookingIntegration() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // 예약 데이터 로드
  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await bookingAPI.getBookings(selectedDate);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('예약 데이터 로드 실패:', error);
      // 더미 데이터 사용
      setBookings([
        {
          id: '1',
          customerName: '김철수',
          customerPhone: '010-1234-5678',
          serviceType: '미용',
          date: '2024-01-16',
          time: '14:00',
          status: 'confirmed',
          notes: '단발 스타일 요청'
        },
        {
          id: '2',
          customerName: '이영희',
          customerPhone: '010-9876-5432',
          serviceType: '네일',
          date: '2024-01-16',
          time: '16:30',
          status: 'pending',
          notes: '프렌치 매니큐어'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 고객 데이터 로드
  const loadCustomers = async () => {
    try {
      const data = await crmAPI.getCustomers({ limit: 10 });
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('고객 데이터 로드 실패:', error);
      // 더미 데이터 사용
      setCustomers([
        {
          id: '1',
          name: '김철수',
          email: 'kim@example.com',
          phone: '010-1234-5678',
          company: 'ABC 회사',
          totalCalls: 15,
          lastCallDate: '2024-01-15'
        },
        {
          id: '2',
          name: '이영희',
          email: 'lee@example.com',
          phone: '010-9876-5432',
          totalCalls: 8,
          lastCallDate: '2024-01-14'
        }
      ]);
    }
  };

  useEffect(() => {
    loadBookings();
    loadCustomers();
  }, [selectedDate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return '확정';
      case 'pending': return '대기';
      case 'cancelled': return '취소';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* 예약 관리 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">예약 관리</h3>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
              />
              <button
                onClick={loadBookings}
                className="bg-[#58CC02] text-white px-4 py-2 rounded-lg hover:bg-[#4BB302] transition-colors"
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
              <p className="text-gray-500 mt-2">데이터를 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
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
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                      {getStatusText(booking.status)}
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

      {/* 고객 관리 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">고객 관리</h3>
            <button className="bg-[#58CC02] text-white px-4 py-2 rounded-lg hover:bg-[#4BB302] transition-colors">
              새 고객 추가
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    {customer.company && (
                      <p className="text-sm text-gray-600">{customer.company}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#58CC02]">{customer.totalCalls}</p>
                    <p className="text-xs text-gray-500">총 통화</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">마지막 통화</p>
                    <p className="text-sm text-gray-900">{customer.lastCallDate}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-[#58CC02] hover:text-[#4BB302] text-sm">편집</button>
                    <button className="text-blue-600 hover:text-blue-900 text-sm">통화 기록</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API 연동 상태 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">예약 시스템 연동 상태</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 네이버 예약 */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Image 
                    src="/naver-logo.svg" 
                    alt="네이버 로고" 
                    width={40} 
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900">네이버 예약</span>
                  <p className="text-xs text-gray-500">45개 예약</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-green-600 font-medium">연결됨</span>
                <p className="text-xs text-gray-500">14:30 동기화</p>
              </div>
            </div>

            {/* 카카오 예약 */}
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Image 
                    src="/kakao-logo.svg" 
                    alt="카카오 로고" 
                    width={40} 
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900">카카오 예약</span>
                  <p className="text-xs text-gray-500">23개 예약</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-yellow-600 font-medium">연결됨</span>
                <p className="text-xs text-gray-500">14:25 동기화</p>
              </div>
            </div>

            {/* TableManager */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Image 
                    src="/tablemanager-logo.svg" 
                    alt="TableManager 로고" 
                    width={40} 
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900">TableManager</span>
                  <p className="text-xs text-gray-500">0개 예약</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600 font-medium">대기중</span>
                <p className="text-xs text-gray-500">미연동</p>
              </div>
            </div>

            {/* CatchTable */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden">
                  <Image 
                    src="/catchtable-logo.svg" 
                    alt="CatchTable 로고" 
                    width={40} 
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-medium text-gray-900">CatchTable</span>
                  <p className="text-xs text-gray-500">12개 예약</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-orange-600 font-medium">연결됨</span>
                <p className="text-xs text-gray-500">14:20 동기화</p>
              </div>
            </div>
          </div>

          {/* 연동 버튼들 */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
              <div className="w-5 h-5 rounded overflow-hidden">
                <Image 
                  src="/naver-logo.svg" 
                  alt="네이버" 
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium">네이버 연동 테스트</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
              <div className="w-5 h-5 rounded overflow-hidden">
                <Image 
                  src="/kakao-logo.svg" 
                  alt="카카오" 
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium">카카오 연동 테스트</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <div className="w-5 h-5 rounded overflow-hidden">
                <Image 
                  src="/tablemanager-logo.svg" 
                  alt="TableManager" 
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium">TableManager 연동</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
              <div className="w-5 h-5 rounded overflow-hidden">
                <Image 
                  src="/catchtable-logo.svg" 
                  alt="CatchTable" 
                  width={20} 
                  height={20}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-medium">CatchTable 연동</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
