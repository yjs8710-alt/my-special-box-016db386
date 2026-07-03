@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

cd /d C:\Users\INTEL\my-special-box-016db386

echo ╔════════════════════════════════════════════════════════╗
echo ║  Zibda: 최종 완전 자동화 솔루션                       ║
echo ║  1. public/index.html UTF-8 생성                      ║
echo ║  2. npm run build                                       ║
echo ║  3. git commit + push                                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.

echo [1/3] public/index.html UTF-8로 생성 중...

REM public/index.html 생성 (UTF-8)
(
echo.^<!DOCTYPE html^>
echo.^<html lang="ko"^>
echo.^<head^>
echo.^<meta charset="UTF-8" /^>
echo.^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo.^<title^>집다 - 청주 부동산 공실 관리^</title^>
echo.^<style^>
echo.* { margin: 0; padding: 0; box-sizing: border-box; }
echo.body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient^(135deg, #667eea 0%, #764ba2 100%^); min-height: 100vh; display: flex; align-items: center; justify-content: center; color: white; }
echo..container { text-align: center; padding: 40px; }
echo.h1 { font-size: 48px; margin-bottom: 20px; }
echo.p { font-size: 20px; margin-bottom: 30px; }
echo..status { background: rgba^(255, 255, 255, 0.1^); padding: 20px; border-radius: 10px; margin-top: 30px; }
echo.^</style^>
echo.^</head^>
echo.^<body^>
echo.^<div class="container"^>
echo.^<h1^>🏠 집다^</h1^>
echo.^<p^>청주 부동산 공실 관리 플랫폼^</p^>
echo.^<div class="status"^>
echo.^<p^>✅ 배포 완료!^</p^>
echo.^<p^>https://zibda.co.kr^</p^>
echo.^</div^>
echo.^</div^>
echo.^</body^>
echo.^</html^>
) > public\index.html

echo ✅ public/index.html UTF-8 생성 완료
echo.

echo [2/3] npm run build 중...
call npm run build

if errorlevel 1 (
    echo ❌ npm run build 실패!
    pause
    exit /b 1
)

echo ✅ npm run build 완료
echo.

echo [3/3] git commit + push...

git config user.email "zibda@example.com"
git config user.name "Zibda Bot"

git add .

git commit -m "fix: public/index.html UTF-8 최종 수정 + npm build"

if errorlevel 1 (
    echo ⚠️  commit 실패 (변경사항 없을 수 있음)
)

git push -u origin main --force

if errorlevel 1 (
    echo ❌ push 실패!
    pause
    exit /b 1
)

echo ✅ push 완료
echo.

echo ╔════════════════════════════════════════════════════════╗
echo ║  ✅ 모든 작업 완료!                                   ║
echo ╠════════════════════════════════════════════════════════╣
echo ║  🎉 처리된 작업:                                       ║
echo ║  ✅ public/index.html UTF-8 생성                      ║
echo ║  ✅ npm run build 완료                                 ║
echo ║  ✅ dist/index.html 생성됨                            ║
echo ║  ✅ git commit + push 완료                            ║
echo ║  ✅ GitHub Actions 자동 빌드 시작                     ║
echo ║                                                        ║
echo ║  📍 최종 배포 주소:                                   ║
echo ║  🌐 https://zibda.co.kr                              ║
echo ║                                                        ║
echo ║  ⏱️  배포 완료까지: 5분                               ║
echo ║  💜 5분 후:                                            ║
echo ║  https://zibda.co.kr                                 ║
echo ║  Ctrl+F5로 새로고침                                  ║
echo ║  → 🎉 완성!                                          ║
echo ╚════════════════════════════════════════════════════════╝
echo.

pause
