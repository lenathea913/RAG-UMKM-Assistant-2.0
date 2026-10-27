@echo off
chcp 65001 >nul
setlocal EnableExtensions
title UMKM Assistant

rem ===========================================================================
rem  start.bat - jalankan UMKM Assistant (Ollama + Next.js) dengan satu klik.
rem
rem  Pakai:
rem    start.bat        mode development (hot reload) -> http://localhost:3000
rem    start.bat prod   mode produksi (build bila perlu, lalu npm start)
rem
rem  Syarat: Node.js terpasang dan aplikasi Ollama berjalan.
rem  Catatan: CLI "ollama" TIDAK wajib ada di PATH - semua cek memakai
rem  HTTP ke http://localhost:11434, jadi cukup aplikasi Ollama hidup.
rem ===========================================================================

cd /d "%~dp0"
set "FRONTEND=%~dp0frontend"
set "PORT=3000"
set "MODEL=granite3.3:8b"

rem --- model & provider dari frontend\.env.local (CR-proof: pakai findstr) ----
set "PROVIDER=ollama"
if exist "%FRONTEND%\.env.local" (
  findstr /b /c:"LLM_PROVIDER=gemini" "%FRONTEND%\.env.local" >nul && set "PROVIDER=gemini"
)
if /i "%PROVIDER%"=="gemini" (
  set "MODEL=gemini-flash-lite"
  if exist "%FRONTEND%\.env.local" (
    for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b "GEMINI_MODEL=" "%FRONTEND%\.env.local"`) do set "MODEL=%%B"
  )
) else if exist "%FRONTEND%\.env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (`findstr /b "OLLAMA_MODEL=" "%FRONTEND%\.env.local"`) do set "MODEL=%%B"
)

echo.
echo  ============================================================
echo   UMKM Assistant - Next.js + LLM (%PROVIDER%)
echo   Model : %MODEL%
echo   URL   : http://localhost:%PORT%
echo  ============================================================
echo.

rem --- 1. Node.js -----------------------------------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo  [X] Node.js tidak ditemukan. Install dulu: https://nodejs.org
  goto :gagal
)
echo  [OK] Node.js terpasang.

rem --- 2 & 3 hanya untuk provider lokal; Gemini lewat batas sini ------------
if /i "%PROVIDER%"=="gemini" goto :lewati_ollama

rem --- 2. Ollama (cek lewat port 11434, bukan lewat CLI) --------------------
netstat -ano | findstr "LISTENING" | findstr /c:":11434" >nul
if errorlevel 1 (
  where ollama >nul 2>nul
  if errorlevel 1 (
    echo  [X] Ollama belum berjalan dan "ollama" tidak ada di PATH.
    echo       Buka dulu aplikasi Ollama, tunggu ikonnya muncul, lalu jalankan
    echo       start.bat ini lagi.
    goto :gagal
  )
  echo  [!] Ollama belum berjalan - menjalankan "ollama serve"...
  start "" /min ollama serve
  ping -n 7 127.0.0.1 >nul
  netstat -ano | findstr "LISTENING" | findstr /c:":11434" >nul
  if errorlevel 1 (
    echo  [X] Ollama gagal dijalankan. Coba buka aplikasinya manual.
    goto :gagal
  )
)
echo  [OK] Ollama berjalan (port 11434).

rem --- 3. model tersedia? (via HTTP /api/tags) -------------------------------
set "MODEL_OK="
where curl >nul 2>nul
if errorlevel 1 (
  echo  [..] curl tidak ditemukan - cek model dilewati.
) else (
  curl -s --max-time 5 http://localhost:11434/api/tags | findstr /c:"%MODEL%" >nul
  if not errorlevel 1 set "MODEL_OK=1"
)
if defined MODEL_OK goto :model_siap

where ollama >nul 2>nul
if errorlevel 1 (
  echo  [X] Model "%MODEL%" belum ada di Ollama ^(cek via /api/tags^).
  echo       Jalankan manual:  ollama pull %MODEL%
  goto :gagal
)
echo  [!] Model "%MODEL%" belum ada - mengunduh, bisa beberapa menit...
ollama pull "%MODEL%"
if errorlevel 1 (
  echo  [X] Gagal mengunduh model. Coba manual: ollama pull %MODEL%
  goto :gagal
)

:model_siap
echo  [OK] Model siap.

:lewati_ollama

rem --- 4. dependensi npm ----------------------------------------------------
if not exist "%FRONTEND%\node_modules" (
  echo  [!] node_modules belum ada - menjalankan npm install...
  pushd "%FRONTEND%"
  call npm install || ( popd & echo  [X] npm install gagal. & goto :gagal )
  popd
)
echo  [OK] Dependensi siap.

rem --- 5. aplikasi sudah jalan? ---------------------------------------------
netstat -ano | findstr "LISTENING" | findstr /c:":%PORT%" >nul
if not errorlevel 1 (
  echo  [OK] Sudah berjalan di http://localhost:%PORT% - membuka browser.
  start "" http://localhost:%PORT%
  goto :selesai
)

rem --- 6. panaskan model + jadwalkan browser --------------------------------
rem     Model 8b butuh waktu dimuat dari disk; dipanaskan lewat API Ollama
rem     (bukan CLI) supaya pertanyaan pertama tidak menunggu load +-2 menit.
rem     Provider gemini tidak perlu pemanasan — lewati, browser tetap dibuka.
if /i "%PROVIDER%"=="gemini" goto :tanpa_pemanasan
set "WARMUP_REQ=%TEMP%\umkm-assistant-warmup.json"
> "%WARMUP_REQ%" echo {"model":"%MODEL%","prompt":"siap","stream":false}
start "UMKM Assistant - pemanasan model" /min curl -s -X POST --data-binary "@%WARMUP_REQ%" http://localhost:11434/api/generate
:tanpa_pemanasan
start "" /min cmd /c "ping -n 11 127.0.0.1 >nul & start http://localhost:%PORT%"

rem --- 7. jalankan aplikasi -------------------------------------------------
if /i "%~1"=="prod" (
  echo  [..] Mode produksi: npm run build lalu npm start
  pushd "%FRONTEND%"
  if not exist ".next\BUILD_ID" (
    call npm run build
    if errorlevel 1 ( popd & goto :gagal )
  )
  call npm start
  popd
) else (
  echo  [..] Mode development: npm run dev
  echo       Berhenti: tekan Ctrl+C di jendela ini.
  pushd "%FRONTEND%"
  call npm run dev
  popd
)

echo.
echo  [OK] Server sudah berhenti.
pause
exit /b 0

:gagal
echo.
echo  [X] Ada masalah - lihat pesan di atas.
pause
exit /b 1

:selesai
echo.
pause
exit /b 0
