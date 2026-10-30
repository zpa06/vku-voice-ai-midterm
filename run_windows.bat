@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"
title VKU Voice AI and Multi-Agent Call Automation Hub
color 0B

echo ========================================================================
echo    HE THONG VOICE AI VA MULTI-AGENT CALL AUTOMATION - VKU MIDTERM
echo    Voice AI, RAG Knowledge Base, Human-in-the-Loop va SQLite CRM
echo ========================================================================
echo.

:: 1. Don dep file tam va giai phong port 8080
echo [BUOC 1/5] Don dep file tam va kiem tra cong 8080...
if exist .antigravity rd /s /q .antigravity 2>nul
if exist .idx rd /s /q .idx 2>nul
if exist .vscode rd /s /q .vscode 2>nul
if exist web-client\__pycache__ rd /s /q web-client\__pycache__ 2>nul
del /q /f *.pyc 2>nul

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8080" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo [+] Thu muc va cong 8080 da san sang.
echo.

:: 2. Kiem tra Python
echo [BUOC 2/5] Kiem tra moi truong Python tren may...
set PYTHON_CMD=
where python >nul 2>nul
if %errorlevel% equ 0 set PYTHON_CMD=python
if not defined PYTHON_CMD (
    where py >nul 2>nul
    if %errorlevel% equ 0 set PYTHON_CMD=py
)

if not defined PYTHON_CMD (
    echo [X] LOI: Khong tim thay Python tren may tinh!
    echo Vui long cai dat Python: https://www.python.org/
    pause
    exit /b 1
)

for /f "delims=" %%v in ('!PYTHON_CMD! --version 2^>^&1') do echo [+] Phat hien: %%v
echo.

:: 3. Kiem tra Docker va n8n
echo [BUOC 3/5] Kiem tra Docker Desktop va n8n Engine...
set DOCKER_ACTIVE=0
where docker >nul 2>nul
if %errorlevel% equ 0 (
    docker info >nul 2>nul
    if !errorlevel! equ 0 (
        set DOCKER_ACTIVE=1
    ) else (
        if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
            echo [!] Docker Desktop hien dang tat. Dang tu dong khoi dong Docker Desktop...
            echo [!] Neu man hinh hien thong bao cap quyen UAC, vui long chon YES.
            start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
            echo [+] Dang doi Docker Engine khoi dong hoan tat (vui long cho khoang 30-40 giay)...
            for /l %%i in (1,1,40) do (
                docker info >nul 2>&1
                if !errorlevel! equ 0 (
                    set DOCKER_ACTIVE=1
                    goto :docker_started
                )
                <nul set /p=.
                timeout /t 1 >nul
            )
            echo.
        )
    )
)
:docker_started
echo.

if "!DOCKER_ACTIVE!"=="1" (
    echo [+] Docker Desktop da san sang! Dang dong bo 4 luong vao SQLite n8n...
    python sync_workflows.py >nul 2>&1
    echo [+] Dang bat container n8n_voice_engine...
    docker compose up -d n8n >nul 2>&1
    echo [+] Da nap va kich hoat thanh cong ca 4 Luong thanh vien va Luong Master tren n8n!
) else (
    echo [i] Docker Desktop chua khoi dong kip hoac chua duoc bat.
    echo [i] Huong dan: Vui long ra Desktop nhap dup chuot vao bieu tuong Docker Desktop de bat len!
    echo [i] He thong tu dong kich hoat che do Local Multi-Agent NLP Fallback:
    echo [i] Toan bo Voice AI Softphone, HITL va SQLite CRM hoat dong 100%% binh thuong tren cong 8080!
)
echo.

:: 4. Mo trinh duyet Web
echo [BUOC 4/5] Tu dong mo trinh duyet Web...
start http://localhost:8080
if "!DOCKER_ACTIVE!"=="1" (
    start http://localhost:5678
)
echo.

:: 5. Khoi chay Server
echo [BUOC 5/5] Khoi dong Python Server tai Cong 8080...
echo ========================================================================
echo    Web Client Softphone:     http://localhost:8080
if "!DOCKER_ACTIVE!"=="1" (
    echo    n8n Workflow Studio:      http://localhost:5678
) else (
    echo    Che do hoat dong:         Local Multi-Agent NLP Engine [Doc lap]
)
echo    Co so du lieu SQLite:     web-client\crm_database.sqlite
echo    Xuat Bao Cao Excel CSV:   http://localhost:8080/api/export-csv
echo ========================================================================
echo Huong dan su dung nhanh:
echo   1. Trinh duyet tu dong mo http://localhost:8080
echo   2. Bam cac nut kich ban 1, 2, 3, 4 hoac noi vao Micro de test
echo   3. Loa se phat giong noi AI tra loi va luu vao SQLite CRM
echo.
echo Nhan Ctrl+C de dung may chu.
echo.

!PYTHON_CMD! web-client\server.py
pause
