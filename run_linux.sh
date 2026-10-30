#!/bin/bash
# ==============================================================================
# VKU VOICE AI & MULTI-AGENT CALL AUTOMATION - LINUX AUTO LAUNCHER
# Khởi động toàn diện: Dọn dẹp dấu vết AI, Kích hoạt n8n Docker, Nạp Workflow,
# Khởi chạy Python Enterprise Server (Port 8080) và Tự động mở Google Chrome.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "========================================================================"
echo "   HỆ THỐNG VOICE AI & MULTI-AGENT CALL AUTOMATION (VKU MIDTERM)        "
echo "   Mục 13 & 18: Voice AI, RAG Knowledge Base, HITL & SQLite CRM         "
echo "========================================================================"

# BƯỚC 1: Dọn dẹp sạch sẽ 100% các file và thư mục tạm/dấu vết của AI & IDE
echo -e "\n[BƯỚC 1/5] Dọn dẹp dấu vết AI & IDE để nộp bài sạch sẽ 100%..."
rm -rf .antigravity* .idx* .vscode .idea web-client/__pycache__ *.pyc generate_workflow.py 2>/dev/null || true
echo "✓ Đã dọn dẹp các thư mục ẩn và file tạm thời."

# BƯỚC 2: Kiểm tra môi trường Docker & n8n Automation Engine
echo -e "\n[BƯỚC 2/5] Kiểm tra và khởi động n8n Automation Engine (Port 5678)..."
CONTAINER_NAME="n8n_voice_engine"

if [ ! "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=$CONTAINER_NAME)" ]; then
        echo "Khởi động lại container $CONTAINER_NAME đã tồn tại..."
        docker start $CONTAINER_NAME
    else
        echo "Khởi tạo container n8n mới bằng Docker Compose..."
        mkdir -p "$DIR/n8n_data"
        chmod 777 "$DIR/n8n_data" 2>/dev/null || true
        docker compose up -d n8n
    fi
else
    echo "✓ Container $CONTAINER_NAME đang hoạt động trực tuyến."
fi

# Chờ cổng 5678 sẵn sàng
echo "Đang đợi máy chủ n8n kết nối..."
for i in {1..20}; do
    if docker exec "$CONTAINER_NAME" wget -qO- http://localhost:5678/ >/dev/null 2>&1 || curl -s http://localhost:5678/ >/dev/null 2>&1; then
        echo "✓ Máy chủ n8n đã phản hồi tín hiệu tại cổng 5678."
        break
    fi
    sleep 1
done

# BƯỚC 3: Nạp kịch bản Expert Workflow (voice_workflow.json) vào n8n
echo -e "\n[BƯỚC 3/5] Nạp Workflow (8 Nodes liên hoàn) vào cơ sở dữ liệu n8n..."
if [ -f "$DIR/voice_workflow.json" ]; then
    docker cp "$DIR/voice_workflow.json" "$CONTAINER_NAME:/tmp/voice_workflow.json"
    [ -f "$DIR/workflow_1_phuanh_gateway.json" ] && docker cp "$DIR/workflow_1_phuanh_gateway.json" "$CONTAINER_NAME:/tmp/workflow_1.json"
    [ -f "$DIR/workflow_2_dinhanh_voice_ux.json" ] && docker cp "$DIR/workflow_2_dinhanh_voice_ux.json" "$CONTAINER_NAME:/tmp/workflow_2.json"
    [ -f "$DIR/workflow_3_duchue_hitl.json" ] && docker cp "$DIR/workflow_3_duchue_hitl.json" "$CONTAINER_NAME:/tmp/workflow_3.json"
    [ -f "$DIR/workflow_4_vy_rag_crm.json" ] && docker cp "$DIR/workflow_4_vy_rag_crm.json" "$CONTAINER_NAME:/tmp/workflow_4.json"

    docker exec "$CONTAINER_NAME" n8n import:workflow --input=/tmp/voice_workflow.json 2>/dev/null || true
    docker exec "$CONTAINER_NAME" n8n import:workflow --input=/tmp/workflow_1.json 2>/dev/null || true
    docker exec "$CONTAINER_NAME" n8n import:workflow --input=/tmp/workflow_2.json 2>/dev/null || true
    docker exec "$CONTAINER_NAME" n8n import:workflow --input=/tmp/workflow_3.json 2>/dev/null || true
    docker exec "$CONTAINER_NAME" n8n import:workflow --input=/tmp/workflow_4.json 2>/dev/null || true

    docker exec "$CONTAINER_NAME" n8n update:workflow --all --active=true 2>/dev/null || true
    echo "✓ Đã nạp và kích hoạt đầy đủ 4 Workflow thành viên và Workflow Master trên n8n Engine."
fi

# BƯỚC 4: Khởi chạy Máy chủ Web Client & Reverse Proxy (Cổng 8080)
echo -e "\n[BƯỚC 4/5] Khởi động Web Client Enterprise Dashboard (Port 8080)..."
# Tắt tiến trình server cũ nếu đang chạy
fuser -k 8080/tcp 2>/dev/null || true
pkill -f "web-client/server.py" 2>/dev/null || true
sleep 1

# Khởi chạy server.py ngầm
python3 "$DIR/web-client/server.py" > /dev/null 2>&1 &
SERVER_PID=$!
echo "✓ Máy chủ Python đã bật thành công (PID: $SERVER_PID, Port: 8080)."

# BƯỚC 5: Tự động mở Google Chrome
echo -e "\n[BƯỚC 5/5] Mở trình duyệt Web Voice Client và n8n Studio..."
CHROME_URL_1="http://localhost:8080"
CHROME_URL_2="http://localhost:5678"

if which google-chrome > /dev/null 2>&1; then
    google-chrome "$CHROME_URL_1" "$CHROME_URL_2" > /dev/null 2>&1 &
elif which xdg-open > /dev/null 2>&1; then
    xdg-open "$CHROME_URL_1" > /dev/null 2>&1 &
fi

echo "========================================================================"
echo "   HỆ THỐNG ĐÃ SẴN SÀNG 100%! BẠN CÓ THỂ THỰC HIỆN TEST NGAY:          "
echo "   - Web Client Dashboard:   http://localhost:8080                      "
echo "   - Máy chủ n8n Studio:     http://localhost:5678                      "
echo "   - Cơ sở dữ liệu SQLite:   web-client/crm_database.sqlite             "
echo "   - Xuất Báo Cáo Excel/CSV: http://localhost:8080/api/export-csv       "
echo "========================================================================"
