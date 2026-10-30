@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
cd /d "C:\Users\ADMIN\Desktop\voice-ai-midterm"
title KHOI DONG N8N VA LOAD 4 LUONG THANH VIEN
color 0B

echo ========================================================================
echo    DANG KHOI DONG N8N ENGINE VA NAP 4 WORKFLOW THANH VIEN (VKU MIDTERM)
echo ========================================================================
echo.

:: 1. Kiem tra Docker Desktop
echo [1/3] Kiem tra Docker Desktop...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker Desktop chua chay. Dang mo Docker Desktop...
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    )
    echo [+] Vui long bam YES neu Windows hien thong bao cap quyen UAC.
    echo [+] Dang cho Docker Engine san sang (khoang 30-45 giay)...
    
    :wait_docker
    for /l %%i in (1,1,60) do (
        docker info >nul 2>&1
        if !errorlevel! equ 0 (
            echo.
            echo [+] Docker Desktop da khoi dong thanh cong!
            goto :docker_ready
        )
        <nul set /p=.
        timeout /t 2 /nobreak >nul
    )
    echo.
    echo [X] Docker chua san sang. Vui long mo Docker Desktop tu Desktop va chay lai file nay.
    pause
    exit /b 1
)

:docker_ready
echo [+] Docker Engine dang hoat dong tot.
echo.

:: 2. Khoi dong container n8n
echo [2/3] Dang bat container n8n_voice_engine tren cong 5678...
docker compose up -d n8n
if %errorlevel% neq 0 (
    echo [!] Thu khoi dong lai container...
    docker restart n8n_voice_engine
)
echo [+] Container n8n da san sang!
echo.

:: 3. Dong bo du lieu workflows
echo [3/3] Dang nap va kich hoat 4 Workflow thanh vien...
if exist sync_workflows.py (
    python sync_workflows.py >nul 2>&1
)

echo.
echo ========================================================================
echo [+] HOAN TAT! DANG MO TRINH DUYET VAO N8N...
echo ========================================================================
echo.
echo Danh sach Workflow trong n8n:
echo   1. Luong 1: Nguyen Phu Anh - Inbound Gateway ^& Security Guardrail
echo   2. Luong 2: Nguyen Dinh Anh - Smart Voice UX ^& Multi-Agent Router
echo   3. Luong 3: Le Duc Hue - Risk Evaluator ^& Human Approval Queue
echo   4. Luong 4: Vy - RAG Knowledge Base ^& CRM Lead Sync
echo   5. Luong Master: Toan Bo He Thong Voice AI (VKU Midterm)
echo.

start http://localhost:5678/
timeout /t 5 >nul
exit /b 0
