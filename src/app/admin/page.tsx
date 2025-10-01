"use client";

import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  PhoneIcon, 
  ChartBarIcon, 
  CogIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import BookingIntegration from './components/BookingIntegration';
import BookingSystemIntegration from './components/BookingSystemIntegration';

interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'premium' | 'enterprise';
  callsToday: number;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCalls: number;
  callsToday: number;
  revenue: number;
  avgCallDuration: number;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCalls: 0,
    callsToday: 0,
    revenue: 0,
    avgCallDuration: 0
  });
  const [selectedTab, setSelectedTab] = useState<'overview' | 'users' | 'analytics' | 'integration' | 'booking' | 'settings'>('overview');

  // 더미 데이터 생성
  useEffect(() => {
    const dummyUsers: User[] = [
      {
        id: '1',
        name: '김철수',
        email: 'kim@example.com',
        plan: 'premium',
        callsToday: 15,
        lastActive: '2024-01-15 14:30',
        status: 'active'
      },
      {
        id: '2',
        name: '이영희',
        email: 'lee@example.com',
        plan: 'free',
        callsToday: 3,
        lastActive: '2024-01-15 12:15',
        status: 'active'
      },
      {
        id: '3',
        name: '박민수',
        email: 'park@example.com',
        plan: 'enterprise',
        callsToday: 45,
        lastActive: '2024-01-15 16:20',
        status: 'active'
      }
    ];

    const dummyStats: Stats = {
      totalUsers: 1247,
      activeUsers: 892,
      totalCalls: 15678,
      callsToday: 234,
      revenue: 125000,
      avgCallDuration: 3.2
    };

    setUsers(dummyUsers);
    setStats(dummyStats);
  }, []);

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#58CC02] rounded-lg shadow-sm"></div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-inter">관리자 대시보드</h1>
                <p className="text-sm text-gray-500">AI CallBot 관리 시스템</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">관리자</span>
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: '개요', icon: ChartBarIcon },
              { id: 'users', label: '사용자 관리', icon: UsersIcon },
              { id: 'analytics', label: '분석', icon: ChartBarIcon },
              { id: 'integration', label: 'API 연동', icon: LinkIcon },
              { id: 'booking', label: '예약 시스템', icon: CalendarIcon },
              { id: 'settings', label: '설정', icon: CogIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-[#58CC02] text-[#58CC02]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">총 사용자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <UserGroupIcon className="w-8 h-8 text-[#58CC02]" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">활성 사용자</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">오늘 통화</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.callsToday.toLocaleString()}</p>
                  </div>
                  <PhoneIcon className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">월 수익</p>
                    <p className="text-2xl font-bold text-gray-900">₩{stats.revenue.toLocaleString()}</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.plan)}`}>
                          {user.plan}
                        </span>
                        <span className="text-sm text-gray-500">{user.callsToday} 통화</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">사용자 관리</h3>
                <button className="bg-[#58CC02] text-white px-4 py-2 rounded-lg hover:bg-[#4BB302] transition-colors">
                  새 사용자 추가
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">플랜</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">오늘 통화</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 활동</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(user.plan)}`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.callsToday}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastActive}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-[#58CC02] hover:text-[#4BB302] mr-3">편집</button>
                        <button className="text-red-600 hover:text-red-900">삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">통화 분석</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-[#58CC02]">{stats.avgCallDuration}분</p>
                  <p className="text-sm text-gray-500">평균 통화 시간</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-500">{stats.totalCalls.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">총 통화 수</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-500">98.5%</p>
                  <p className="text-sm text-gray-500">서비스 가동률</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'integration' && (
          <BookingIntegration />
        )}

        {selectedTab === 'booking' && (
          <BookingSystemIntegration />
        )}

        {selectedTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">자동 백업</p>
                    <p className="text-sm text-gray-500">매일 자동으로 데이터를 백업합니다</p>
                  </div>
                  <button className="bg-[#58CC02] text-white px-4 py-2 rounded-lg">활성화</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">알림 설정</p>
                    <p className="text-sm text-gray-500">시스템 알림을 이메일로 받습니다</p>
                  </div>
                  <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">비활성화</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
