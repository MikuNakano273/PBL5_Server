# PBL5 Server v3 - To-Do chốt theo Spec Minimal

## Quy ước khi triển khai
- `docs/PBL5_Server_Spec_v3_Minimal.md` là nguồn chốt khi có xung đột với `docs/IMPLEMENTATION_PLAN.md`.
- `docs/IMPLEMENTATION_PLAN.md` chỉ giữ lại các ý còn phù hợp với spec v3 minimal; các phần cũ về NestJS, Socket.IO, `alert_receivers`, `notification_tokens`, `audit_logs`, `daily_alert_stats` không còn là chuẩn triển khai.
- Target backend chốt: `Python 3.11 + FastAPI` cho API, `Python worker + YOLO` cho xử lý ảnh, `MongoDB + Redis + MinIO` cho hạ tầng.
- Queue ưu tiên: `Redis + RQ`; `Celery` chỉ là phương án thay thế nếu có lý do rõ ràng.
- Actor model chốt: `role = admin | user`; `user_type = blind | family`.
- Workflow bắt buộc: một máy có nhiều account, switch account không cần nhập lại mật khẩu, notification inbox dùng chung theo `installation`.
- Mọi task dưới đây dùng mã cố định để map 1-1 sang `docs/checklist.md`.

## Các khác biệt quan trọng đã chốt sau khi so sánh 2 tài liệu
- Giữ hướng `spec v3 minimal`, không tiếp tục mở rộng theo plan cũ kiểu `NestJS + BullMQ + Socket.IO`.
- Thay mô hình push theo user bằng mô hình `mobile_installations` + `installation_accounts` + `notification_events` + `installation_notifications`.
- Bỏ các collection ngoài phạm vi MVP: `daily_alert_stats`, `audit_logs`, `alert_receivers`, `notification_tokens`, `follow_link_requests`.
- Tách rõ `router -> service -> repository`; không để business logic đi thẳng trong router.
- Tập trung 5 phase đúng mục 17 của spec: nền tảng, lõi mobile, luồng thiết bị, worker YOLO, admin và hoàn thiện.

## PHASE 1 - Nền tảng
- [x] `P1-01` Dựng skeleton `api/` theo FastAPI, chuẩn hóa cấu trúc thư mục theo mục 6 của spec, có `main.py`, router registry, config bootstrap.
- [x] `P1-02` Thiết lập env/config và kết nối `MongoDB`, `Redis`, `MinIO`; cập nhật `.env.example` theo đúng stack Python thay cho giả định NestJS cũ.
- [x] `P1-03` Dựng common layer: base repository, enums, exception handling, auth utilities, Pydantic request/response schemas cơ bản.
- [x] `P1-04` Chốt database schema và index cho toàn bộ collection còn hiệu lực trong spec; thêm 4 collection mới của installation workflow và loại khỏi phạm vi mặc định các collection cũ không còn dùng.
- [x] `P1-05` Dựng `AuthService` với login, refresh, logout, change password, access token, refresh token; token phải gắn với `user + installation`.
- [x] `P1-06` Dựng `InstallationService` và repository cho `mobile_installations`, `installation_accounts`, `notification_events`, `installation_notifications`.
- [x] `P1-07` Hoàn tất API auth/switch account: `POST /api/mobile/v1/auth/login`, `refresh`, `logout`, `GET /installations/me/accounts`, `POST /installations/me/switch-account`.

## PHASE 2 - Lõi nghiệp vụ mobile
- [x] `P2-01` Dựng `me/profile` API: `GET /api/mobile/v1/me`, `PATCH /api/mobile/v1/me`, `POST /api/mobile/v1/me/change-password`.
- [x] `P2-02` Dựng `care_links` API và rule phân quyền để family chỉ thấy blind user có liên kết hợp lệ.
- [x] `P2-03` Dựng `DashboardService` và `GET /api/mobile/v1/dashboard/{blind_user_id}` theo dữ liệu tổng hợp từ `user_live_status`, alerts, devices.
- [x] `P2-04` Dựng toàn bộ read API cho blind user data: devices, locations, alerts today, alert history, recent alerts, alert detail.
- [x] `P2-05` Dựng notification workflow trong app: tạo/list/mark read cho `notification_events` và `installation_notifications`.
- [x] `P2-06` Hoàn tất thao tác theo installation ở mobile: lưu `push_token` theo máy, list accounts của installation, switch active account đúng rule `is_active`.

## PHASE 3 - Luồng thiết bị
- [x] `P3-01` Dựng cơ chế `cane auth` riêng cho thiết bị bằng `device_code` + `device_secret_hash` hoặc HMAC; không dùng auth của mobile.
- [x] `P3-02` Dựng GPS ingest: `POST /api/cane/v1/gps`, lưu `gps_logs`, cập nhật `user_live_status.last_location`.
- [x] `P3-03` Dựng distance ingest: `POST /api/cane/v1/telemetry/distance`, áp dụng sampling, cập nhật safety status và live status.
- [x] `P3-04` Dựng heartbeat endpoint và cập nhật `devices.last_seen_at`, `user_live_status.last_seen_at`, phục vụ offline detection.
- [x] `P3-05` Dựng image request flow: `POST /api/cane/v1/requests`, `POST /api/cane/v1/requests/{request_id}/image`, quản lý state `created -> uploaded -> queued -> processing -> done/failed`.
- [x] `P3-06` Nối `MinIO` và API device config: lưu object path ảnh, trả `GET /api/cane/v1/devices/me/config`, chuẩn hóa lookup thiết bị theo owner blind user.

## PHASE 4 - Worker YOLO
- [x] `P4-01` Dựng queue `Redis + RQ` cho `vision-jobs`, payload job tối thiểu phải đủ `request_id`, `device_id`, `blind_user_id`, object key, timestamp.
- [x] `P4-02` Dựng Python worker YOLO: lấy job, tải ảnh từ MinIO, chạy model, build payload kết quả, xử lý retry/backoff theo spec.
- [x] `P4-03` Dựng internal API có auth riêng: `POST /api/internal/v1/vision/results` và `POST /api/internal/v1/vision/retry/{request_id}`.
- [x] `P4-04` Dựng `VisionResultService`: lưu `vision_results`, cập nhật trạng thái `image_requests`, suy ra `risk_level`, sinh `summary_text`.
- [x] `P4-05` Dựng `AlertService`: tạo alert từ vision result, distance danger, offline device; có rule dedup và cập nhật `user_live_status`.
- [x] `P4-06` Dựng `NotificationService`: fanout event tới tất cả installation liên quan, tạo inbox chung theo máy, gửi push nếu installation có token.

## PHASE 5 - Admin và hoàn thiện
- [x] `P5-01` Dựng admin auth: `POST /api/admin/v1/auth/login`, JWT riêng cho admin routes.
- [x] `P5-02` Dựng admin API: users, user detail/update, devices, assign device, image requests, alerts.
- [x] `P5-03` Dựng retention/cleanup jobs cho `gps_logs`, `distance_telemetry`, `installation_notifications`, và ảnh raw trên MinIO nếu chính sách yêu cầu.
- [x] `P5-04` Hoàn tất hardening: rate limit cho login/refresh/cane/internal, validation toàn bộ DTO Pydantic, internal auth, logging, healthcheck.
- [x] `P5-05` Viết test theo spec: unit test cho service lõi, integration test cho switch account và notification inbox, E2E cho luồng thiết bị -> worker -> alert.
- [x] `P5-06` Cập nhật tài liệu: `.env.example`, README/RUN, API docs, mô tả workflow switch account và notification theo installation.
- [x] `P5-07` Dọn code/tài nguyên legacy còn sót: loại các giả định cũ từ implementation plan không còn phù hợp và xác nhận lại Docker/deployment theo stack Python hiện tại.

## Thứ tự thực hiện bắt buộc
1. Hoàn tất toàn bộ `PHASE 1` trước khi mở rộng API mobile.
2. Hoàn tất `PHASE 2` trước khi tối ưu luồng thiết bị và worker.
3. Hoàn tất `PHASE 3` trước khi nối worker YOLO.
4. Hoàn tất `PHASE 4` trước khi làm admin, cleanup, test diện rộng.
5. Chỉ đóng task `PHASE 5` khi test và docs đã cập nhật tương ứng.


