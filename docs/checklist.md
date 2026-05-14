# PBL5 Server v3 - Checklist bám `to_do.md`

## Cách dùng
- Mỗi dòng checklist dưới đây map 1-1 với đúng một mã công việc trong `docs/to_do.md`.
- Chỉ tick khi đầu ra của task đã chạy được hoặc đã verify đủ theo mô tả ngắn trên cùng dòng.
- Khi cần báo tiến độ, dùng mã task (`P1-01`, `P4-06`, ...) để tránh mơ hồ.

## Phase 1
- [x] `P1-01` FastAPI app skeleton chạy được, có `main.py`, router registry và cấu trúc thư mục theo spec.
- [x] `P1-02` Env/config hoạt động cho MongoDB, Redis, MinIO và `.env.example` phản ánh đúng stack Python hiện tại.
- [x] `P1-03` Common layer có base repository, enums, exceptions, auth helpers và Pydantic schema nền.
- [x] `P1-04` Các collection/index đúng spec đã được chốt; 4 collection installation workflow có mặt; scope legacy collections đã bị loại bỏ.
- [x] `P1-05` AuthService xử lý đủ login, refresh, logout, change password và token gắn với `user + installation`.
- [x] `P1-06` InstallationService và repository cho installation/notification collections đã sẵn sàng.
- [x] `P1-07` Bộ API auth + switch account hoạt động đúng với login nhiều account trên một máy.

## Phase 2
- [x] `P2-01` Bộ API `me/profile` đọc, sửa profile và đổi mật khẩu hoạt động.
- [x] `P2-02` API `care_links` hoạt động và chặn truy cập sai quan hệ family/blind.
- [x] `P2-03` Dashboard endpoint trả được dữ liệu tổng hợp theo `user_live_status`, alerts và device state.
- [x] `P2-04` Các API đọc dữ liệu blind user đầy đủ: devices, locations, alerts today/history/recent, alert detail.
- [x] `P2-05` Notification inbox theo installation list/mark-read được và dùng đúng `notification_events` + `installation_notifications`.
- [x] `P2-06` Push token được lưu theo installation; list accounts và switch active account đúng rule `is_active`.

## Phase 3
- [x] `P3-01` Cane auth dùng device credential/HMAC riêng, không phụ thuộc JWT mobile.
- [x] `P3-02` GPS ingest lưu log và cập nhật `last_location` trong `user_live_status`.
- [x] `P3-03` Distance ingest có sampling, cập nhật safety status và không ghi flood vô ích.
- [x] `P3-04` Heartbeat cập nhật `last_seen_at` và dữ liệu đủ để offline detection hoạt động.
- [x] `P3-05` Flow image request/create-upload chạy đủ state từ `created` tới `done/failed`.
- [x] `P3-06` MinIO đã nối xong, ảnh lưu đúng path và device config endpoint trả được cấu hình thiết bị.

## Phase 4
- [x] `P4-01` Queue `vision-jobs` dùng Redis + RQ đã hoạt động với payload chuẩn.
- [x] `P4-02` Worker YOLO đọc job, tải ảnh, infer, retry/backoff đúng thiết kế.
- [x] `P4-03` Internal API callback/retry có auth riêng và worker gọi lại được.
- [x] `P4-04` VisionResultService lưu kết quả, cập nhật request status, tính risk/summary đúng.
- [x] `P4-05` AlertService tạo alert từ vision/distance/offline, có dedup và cập nhật live status.
- [x] `P4-06` Notification fanout tới đúng installation liên quan và push send chạy theo token của máy.

## Phase 5
- [x] `P5-01` Admin auth hoạt động và tách biệt với luồng user thường.
- [x] `P5-02` Admin API cho users, devices, image requests, alerts đã đủ theo spec.
- [x] `P5-03` Retention/cleanup jobs xử lý đúng chính sách giữ dữ liệu và dọn dữ liệu cũ.
- [x] `P5-04` Rate limit, validation, internal auth, logging và healthcheck đã bật.
- [x] `P5-05` Unit, integration, E2E tests có đủ các case trọng tâm của spec v3 minimal.
- [x] `P5-06` README/RUN, `.env.example`, API docs và mô tả workflow installation đã cập nhật.
- [x] `P5-07` Legacy assumptions từ plan cũ đã được dọn hoặc đánh dấu loại bỏ; deployment stack Python được verify lại.






