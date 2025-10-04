import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@heroicons/react'],
  },
  // 로딩 인디케이터 비활성화
  devIndicators: {
    position: 'bottom-right',
  },
  // 로딩 상태 비활성화
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // 외부 이미지 도메인 허용
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's.pstatic.net',
        port: '',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
        port: '',
        pathname: '/kakaocorp/**',
      },
      {
        protocol: 'https',
        hostname: 'catchtable.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'tablemanager.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'bookingking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'medicalbooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'fitnessbooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'educationbooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'autobooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'petbooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
      {
        protocol: 'https',
        hostname: 'weddingbooking.co.kr',
        port: '',
        pathname: '/favicon.ico',
      },
    ],
  },
};

export default nextConfig;
