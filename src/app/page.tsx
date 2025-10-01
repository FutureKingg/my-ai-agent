"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon, PhoneIcon, CogIcon, ChartBarIcon } from "@heroicons/react/24/outline";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#58CC02] rounded-lg shadow-sm">
            </div>
            <span className="text-xl font-bold text-gray-900 font-inter">AI CallBot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              대시보드
            </Link>
            <Link 
              href="/admin" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              관리자
            </Link>
            <Link 
              href="/login" 
              className="bg-[#58CC02] text-white px-4 py-2 rounded-full hover:bg-[#4BB302] transition-all font-medium"
            >
              로그인
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative px-6 py-24">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-8 leading-tight font-inter">
              AI가 대신
              <span className="block bg-gradient-to-r from-[#58CC02] to-[#4BB302] bg-clip-text text-transparent">
                전화받고 걸어드립니다
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              최첨단 AI 기술로 24시간 고객 응대, 예약 관리, 마케팅 상담까지 모든 전화 업무를 자동화하세요.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <div className="relative">
            <Link 
              href="/dashboard?agentConfig=newConsultant"
              className="group relative bg-gradient-to-r from-[#58CC02] to-[#4BB302] text-white px-10 py-4 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-[#58CC02]/25 transition-all duration-300 flex items-center space-x-3 hover:from-[#4BB302] hover:to-[#58CC02]"
            >
                <span className="relative z-10">무료로 시작하기</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group relative bg-gradient-to-br from-teal-50 to-white rounded-3xl p-8 border border-teal-100/90 hover:border-teal-200 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-teal-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <PhoneIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">24시간 자동 응대</h3>
                <p className="text-gray-600 leading-relaxed">
                  AI가 고객의 전화를 받아 자연스러운 대화로 문의를 처리하고 
                  필요한 정보를 제공합니다.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-indigo-100/90 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CogIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">맞춤형 AI 상담사</h3>
                <p className="text-gray-600 leading-relaxed">
                  업종과 목적에 맞는 AI 상담사를 설정하고, 
                  음성과 대화 스타일까지 자유롭게 커스터마이징하세요.
                </p>
              </div>
            </div>

            <div className="group relative bg-gradient-to-br from-orange-50 to-white rounded-3xl p-8 border border-orange-100/90 hover:border-orange-200 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ChartBarIcon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 font-inter">실시간 분석</h3>
                <p className="text-gray-600 leading-relaxed">
                  모든 통화를 기록하고 분석하여 고객 만족도와 
                  비즈니스 인사이트를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500">
            © 2024 AI CallBot. 모든 권리 보유.
          </p>
        </div>
      </footer>
    </div>
  );
}