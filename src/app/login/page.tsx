"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PhoneIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement login logic
    console.log("Login attempt:", formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-[#58CC02] rounded-xl shadow-sm">
            </div>
            <span className="text-2xl font-bold text-gray-900 font-inter">AI CallBot</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-inter">로그인</h1>
          <p className="text-gray-600">계정에 로그인하여 AI 통화 서비스를 이용하세요</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent pr-12"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#58CC02] bg-white border-gray-300 rounded focus:ring-[#58CC02]"
                />
                <span className="ml-2 text-sm text-gray-600">로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-[#58CC02] hover:text-[#4BB302]">
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#58CC02] to-[#4BB302] text-white py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-[#58CC02]/25 transition-all duration-300"
            >
              로그인
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-[#58CC02] hover:text-[#4BB302] font-medium">
                회원가입
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Access */}
        <div className="mt-6 text-center">
          <Link 
            href="/dashboard"
            className="text-gray-500 hover:text-[#58CC02] text-sm underline transition-colors"
          >
            데모로 체험해보기
          </Link>
        </div>
      </div>
    </div>
  );
}
