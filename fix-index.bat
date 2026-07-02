@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

set "FILE=C:\Users\INTEL\my-special-box-016db386\dist\index.html"

echo 집다 index.html 생성 중...

(
echo <!DOCTYPE html>
echo ^<html lang="ko"^>
echo ^<head^>
echo ^<meta charset="UTF-8" /^>
echo ^<meta name="viewport" content="width=device-width, initial-scale=1.0" /^>
echo ^<title^>집다 - 청주 부동산 공실 관리^</title^>
echo ^<style^>
echo * { margin: 0; padding: 0; box-sizing: border-box; }
echo body {
echo   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
echo   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%^);
echo   min-height: 100vh;
echo   display: flex;
echo   align-items: center;
echo   justify-content: center;
echo   color: white;
echo }
echo .container { text-align: center; padding: 40px; }
echo h1 { font-size: 48px; margin-bottom: 20px; }
echo p { font-size: 20px; margin-bottom: 30px; }
echo .status { background: rgba(255, 255, 255, 0.1^); padding: 20px; border-radius: 10px; margin-top: 30px; }
echo ^</style^>
echo ^</head^>
echo ^<body^>
echo ^<div class="container"^>
echo ^<h1^>🏠 집다^</h1^>
echo ^<p^>청주 부동산 공실 관리 플랫폼^</p^>
echo ^<div class="status"^>
echo ^<p^>✅ 배포 완료!^</p^>
echo ^<p^>https://zibda.co.kr^</p^>
echo ^</div^>
echo ^</div^>
echo ^</body^>
echo ^</html^>
) > "%FILE%"

echo ✅ 파일 생성 완료: %FILE%
echo.
echo 확인:
type "%FILE%" | find "집다"

if errorlevel 1 (
    echo ❌ 생성 실패!
) else (
    echo ✅ 생성 성공!
    echo.
    echo 다음 명령어를 실행하세요:
    echo git add dist/index.html
    echo git commit -m "fix: index.html UTF-8 수정"
    echo git push -u origin main --force
)
