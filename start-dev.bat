@echo off
setlocal
cd /d "%~dp0"
title LNGC Production Twin - Development Server

echo [LNGC Production Twin] Preparing the development server...

where node >nul 2>&1
if errorlevel 1 (
  echo.
  echo ERROR: Node.js was not found. Install Node.js 22.13 or later, then try again.
  pause
  exit /b 1
)

where pnpm >nul 2>&1
if errorlevel 1 (
  where corepack >nul 2>&1
  if errorlevel 1 (
    echo.
    echo ERROR: pnpm or Corepack was not found.
    echo Run "npm install -g pnpm@11.25.0" once, then try again.
    pause
    exit /b 1
  )
  set "LNGC_PNPM=corepack pnpm"
) else (
  set "LNGC_PNPM=pnpm"
)

if not exist "node_modules\next\package.json" (
  echo Installing project dependencies...
  call %LNGC_PNPM% install --frozen-lockfile
  if errorlevel 1 goto :failed
)

echo.
echo Server URL: http://localhost:3000
echo Keep this window open while using the application.
echo Press Ctrl+C to stop the development server.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "$u='http://localhost:3000'; for($i=0; $i -lt 120; $i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 2; if($r.StatusCode -ge 200){ Start-Process $u; break } } catch {}; Start-Sleep -Seconds 1 }"
call %LNGC_PNPM% dev --port 3000
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo The development server could not be started. Review the message above.
pause
exit /b 1
