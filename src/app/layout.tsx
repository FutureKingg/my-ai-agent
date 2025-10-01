import type { Metadata } from "next";
import "./globals.css";
import "./lib/envSetup";

export const metadata: Metadata = {
  title: "AI COUNSELOR",
  description: "AI 상담사와 실시간으로 대화하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Next.js 로딩 완전 제거 */
            #__next-loading {
              display: none !important;
            }
            [data-nextjs-scroll-focus-boundary] {
              display: none !important;
            }
            /* 모든 로딩 인디케이터 숨김 */
            [data-nextjs-dialog-overlay] {
              display: none !important;
            }
            [data-nextjs-dialog] {
              display: none !important;
            }
            /* 로딩 스피너 숨김 */
            .loading-spinner {
              display: none !important;
            }
            /* Next.js 기본 로딩 숨김 */
            .next-loading {
              display: none !important;
            }
          `
        }} />
      </head>
      <body className={`antialiased`}>
        {children}
      </body>
    </html>
  );
}
