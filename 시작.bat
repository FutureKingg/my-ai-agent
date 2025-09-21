@echo off
chcp 65001
echo.
echo [ ===== AI 상담사 프로젝트 시작 ===== ]
echo.

rem --- 1. Cursor 실행 파일 경로 설정 ---
set CURSOR_PATH="C:\Users\chany\AppData\Local\Programs\cursor\Cursor.exe"

rem --- 2. Cursor에서 현재 폴더(.) 열기 ---
echo Cursor 편집기를 엽니다...
start "Cursor" %CURSOR_PATH% .

rem --- 3. 개발 서버 시작하기 ---
echo 개발 서버를 켭니다...
start "Dev Server" npm run dev

echo.
echo 5초 후에 웹 브라우저를 엽니다...
timeout /t 5
start http://localhost:3000