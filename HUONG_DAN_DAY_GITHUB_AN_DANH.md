# HƯỚNG DẪN ĐẨY MÃ NGUỒN LÊN GITHUB AN TOÀN, ẨN DANH & KHÔNG TRUY VẾT

Tài liệu này hướng dẫn chi tiết cách đẩy (push) toàn bộ mã nguồn của đồ án **Voice AI & Multi-Agent Call Automation Hub** lên GitHub một cách sạch sẽ, bảo mật và **hoàn toàn ẩn danh**, đảm bảo:
- **Không lộ Email cá nhân** hay tài khoản riêng tư.
- **Không lộ đường dẫn thư mục máy tính** (không có `C:\Users\...`).
- **Không lộ API Key** hay dữ liệu nhạy cảm (`.env`, `n8n_data` được bảo vệ bởi `.gitignore`).
- Tác giả commit hiển thị chuẩn học thuật: **`VKU AI Automation Team`**.

---

## BƯỚC 1: TẠO REPOSITORY TRÊN GITHUB

1. Đăng nhập vào một tài khoản GitHub sạch (hoặc tài khoản đại diện cho nhóm / tổ chức học tập).
2. Tạo một Repository mới:
   - **Repository name:** `vku-voice-ai-midterm` (hoặc tên tùy chọn).
   - **Visibility:** Chọn `Public` hoặc `Private` (tùy theo yêu cầu của Giảng viên).
   - **Lưu ý quan trọng:** **KHÔNG** tích chọn *"Add a README file"*, *"Add .gitignore"*, hay *"Choose a license"*. Hãy để repository **hoàn toàn trống (empty)**.
3. Sao chép đường dẫn Repository dạng HTTPS. Ví dụ:
   `https://github.com/vku-ai-team/vku-voice-ai-midterm.git`

---

## BƯỚC 2: MỞ TERMINAL VÀ CẤU HÌNH DANH TÍNH ẨN DANH

Mở **Terminal trong PyCharm** (hoặc mở PowerShell tại thư mục dự án `Desktop\voice-ai-midterm`), chạy lần lượt các lệnh sau:

### 1. Di chuyển vào thư mục dự án
```powershell
cd "C:\Users\ADMIN\Desktop\voice-ai-midterm"
```

### 2. Khởi tạo Git Repo
```powershell
git init
```

### 3. Cấu hình danh tính Tác giả Commit cục bộ (Local Identity)
> [!IMPORTANT]
> Câu lệnh này chỉ áp dụng cho riêng dự án này (không dùng cờ `--global`), ghi đè hoàn toàn email cá nhân của bạn, biến người commit thành danh nghĩa học thuật của trường VKU:
```powershell
git config user.name "VKU AI Automation Team"
git config user.email "group4-ai-midterm@vku.udn.vn"
git config commit.gpgsign false
```

---

## BƯỚC 3: THÊM FILE VÀ TẠO COMMIT SẠCH

### 1. Đưa toàn bộ file mã nguồn vào khu vực chuẩn bị (Staging)
```powershell
git add .
```

### 2. Kiểm tra xem file nhạy cảm đã bị chặn chưa
```powershell
git status
```
*(Bạn sẽ thấy các thư mục rác như `.venv/`, `.idea/`, `n8n_data/`, `.env` đã được `.gitignore` chặn đứng 100%, không bị thêm vào).*

### 3. Tạo commit đầu tiên với thông điệp chuẩn mực
```powershell
git commit -m "feat(vku-midterm): Complete Voice AI & Multi-Agent Call Automation Hub with 4-member architecture"
```

---

## BƯỚC 4: LIÊN KẾT VÀ ĐẨY CODE LÊN GITHUB

### 1. Đổi tên nhánh mặc định sang `main`
```powershell
git branch -M main
```

### 2. Liên kết với Repository GitHub (Thay link repo của bạn vào)
```powershell
git remote add origin https://github.com/<tai-khoan-cua-ban>/vku-voice-ai-midterm.git
```

### 3. Đẩy code lên GitHub
```powershell
git push -u origin main --force
```

---

## KIỂM TRA LẠI KẾT QUẢ TRÊN GITHUB

Sau khi đẩy xong, mở link GitHub trên trình duyệt:
- Bấm vào mục **Commits**: Tên người commit hiển thị là **`VKU AI Automation Team`**.
- Không có bất kỳ thông tin nào về tên máy tính cá nhân hay email cá nhân.
- Toàn bộ 4 luồng n8n JSON, code backend Python, tài liệu Word báo cáo và thuyết trình hiển thị chỉn chu, chuyên nghiệp 100%.
