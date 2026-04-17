# PBL5 - Kế hoạch triển khai server cực chi tiết cho AI agent

## 1. Mục tiêu

Xây backend cho hệ thống gậy thông minh cho người mù với các nhóm chức năng:
- Thiết bị gậy gửi GPS, khoảng cách vật cản, heartbeat, metadata ảnh, ảnh chụp.
- Server quản lý thiết bị, lưu dữ liệu, queue xử lý AI, tạo cảnh báo, đẩy realtime.
- Worker Python dùng YOLOv8 xử lý ảnh riêng biệt.
- App mobile cho guardian và blind user đọc dashboard, xem lịch sử cảnh báo, vị trí, trạng thái an toàn.
- Hệ thống phải dùng MongoDB, Redis, object storage và queue bất đồng bộ.

## 2. Stack chốt

### API server
- Framework: NestJS
- Language: TypeScript
- HTTP: REST API
- WebSocket: Socket.IO Gateway
- Database: MongoDB + Mongoose
- Queue: BullMQ + Redis
- Object storage: MinIO
- Push notification: Firebase Admin SDK
- Validation: class-validator + ValidationPipe
- Security: Helmet, JWT, device signature/HMAC, rate limiting
- Logging: Nest Logger trước, có thể nâng lên Winston/Pino sau

### AI worker
- Language: Python 3.11
- Vision: Ultralytics YOLOv8
- Storage client: MinIO Python SDK
- Database client: PyMongo
- Queue transport: Redis

## 3. Kiến trúc tổng quát

### 3.1 Thành phần
1. **Cane API**: nhận request từ ESP32/gậy.
2. **Mobile API**: app mobile đọc dashboard, alerts, history, auth.
3. **Internal API**: route nội bộ giữa worker và backend nếu cần callback.
4. **Admin API**: quản trị user/device/requests.
5. **MongoDB**: dữ liệu nghiệp vụ và lịch sử.
6. **Redis**: queue + cache latest state + throttle key + dedup alert key.
7. **MinIO**: lưu ảnh gốc/ảnh annotate.
8. **Python Worker**: infer YOLO.

### 3.2 Luồng ảnh
1. Thiết bị gọi `POST /api/cane/v1/requests`.
2. Server sinh `image_request`.
3. Thiết bị upload object hoặc server cấp pre-signed URL.
4. Server đánh dấu request `queued`.
5. Job được đẩy vào queue.
6. Worker tải ảnh từ MinIO.
7. Worker chạy YOLO.
8. Worker ghi `vision_results`.
9. Nếu nguy hiểm, hệ thống sinh `alerts`.
10. Realtime gateway phát event và push notification.

### 3.3 Luồng telemetry
1. Thiết bị gửi `distance_telemetry`.
2. Server lưu bản ghi nếu qua rule sampling.
3. Server cập nhật `user_live_status`.
4. Nếu nhỏ hơn ngưỡng và không bị dedup, tạo cảnh báo.
5. Phát realtime.

### 3.4 Luồng GPS
1. Thiết bị gửi GPS định kỳ.
2. Server lưu `gps_logs` với GeoJSON.
3. Server cập nhật `user_live_status.last_location`.
4. App đọc dashboard nhanh từ `user_live_status`.

## 4. Cấu trúc thư mục nên giữ

```text
PBL5_Server/
├── AI/
│   └── YOLOv8/
├── Server/
│   └── api/
│       ├── app/
│       │   └── v1/
│       └── cane/
│           └── v1/
└── README.md
```

### 4.1 Cấu trúc code triển khai chi tiết

```text
server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── env.validation.ts
│   │   ├── mongo.config.ts
│   │   ├── redis.config.ts
│   │   ├── minio.config.ts
│   │   └── security.config.ts
│   ├── common/
│   │   ├── constants/
│   │   ├── enums/
│   │   ├── decorators/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── filters/
│   │   ├── middleware/
│   │   ├── pipes/
│   │   └── utils/
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── schemas/
│   │   ├── indexes/
│   │   └── seeds/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── care-links/
│   │   ├── devices/
│   │   ├── gps/
│   │   ├── telemetry/
│   │   ├── image-requests/
│   │   ├── vision-results/
│   │   ├── alerts/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── realtime/
│   │   ├── admin/
│   │   └── health/
│   ├── queue/
│   │   ├── queue.module.ts
│   │   ├── queue.constants.ts
│   │   └── producers/
│   └── jobs/
│       ├── offline-device.job.ts
│       ├── cleanup-telemetry.job.ts
│       └── recompute-daily-stats.job.ts
├── test/
├── package.json
└── Dockerfile
```

## 5. Collections MongoDB phải có

### 5.1 users
Mục đích: tài khoản app/admin.
Field tối thiểu: `email`, `password_hash`, `full_name`, `phone`, `role`, `status`, `last_login_at`.
Index: `email unique`, `role`, `status`.

### 5.2 care_links
Mục đích: quan hệ guardian - blind user nhiều-nhiều.
Field: `blind_user_id`, `guardian_user_id`, `relation`, `status`, `can_view_live_location`, `can_receive_alert`.
Index: unique `{blind_user_id, guardian_user_id}`.

### 5.3 devices
Mục đích: thông tin gậy.
Field: `serial_number`, `device_code`, `owner_blind_user_id`, `firmware_version`, `status`, `last_seen_at`, `last_battery`, `device_secret_hash`.

### 5.4 image_requests
Field: `request_code`, `device_id`, `blind_user_id`, `captured_at`, `distance_cm`, `gps_snapshot`, `image_path`, `status`, `ai_status`, `error_message`.
Index: `request_code unique`, `{ai_status, created_at}`.

### 5.5 vision_results
Field: `image_request_id`, `model_name`, `model_version`, `objects`, `nearest_obstacle_cm`, `risk_level`, `summary_text`, `processed_at`.

### 5.6 gps_logs
Field: `device_id`, `blind_user_id`, `lat`, `lng`, `location`, `accuracy`, `speed`, `heading`, `recorded_at`.
Index: `{blind_user_id, recorded_at: -1}`, `location 2dsphere`.
Retention: 30-90 ngày.

### 5.7 distance_telemetry
Field: `device_id`, `blind_user_id`, `distance_cm`, `detected`, `sensor_type`, `recorded_at`.
Retention: 7-30 ngày.
Sampling: chỉ lưu mỗi 1.5 giây hoặc khi chênh > 10 cm.

### 5.8 alerts
Field: `blind_user_id`, `device_id`, `image_request_id`, `alert_type`, `risk_level`, `status`, `title`, `message`, `lat`, `lng`, `distance_cm`, `triggered_at`, `resolved_at`.
Index: `{blind_user_id, triggered_at: -1}`.

### 5.9 alert_receivers
Field: `alert_id`, `user_id`, `is_push_sent`, `push_sent_at`, `viewed_at`, `acknowledged_at`.

### 5.10 notification_tokens
Field: `user_id`, `platform`, `token`, `is_active`, `last_used_at`.
Index: `token unique`.

### 5.11 refresh_tokens
Field: `user_id`, `token_hash`, `expires_at`, `revoked_at`, `device_info`.
TTL: `expires_at`.

### 5.12 audit_logs
Field: `actor_type`, `actor_id`, `action`, `resource_type`, `resource_id`, `metadata`, `created_at`.

### 5.13 user_live_status
Field: `blind_user_id`, `device_id`, `current_safety_status`, `nearest_distance_cm`, `last_location`, `last_alert_at`, `last_seen_at`, `updated_at`.
Đây là collection quan trọng nhất cho dashboard realtime.

## 6. API modules phải làm

### 6.1 Cane API
- `POST /api/cane/v1/requests`
- `POST /api/cane/v1/requests/:requestId/image`
- `POST /api/cane/v1/gps`
- `POST /api/cane/v1/telemetry/distance`
- `POST /api/cane/v1/heartbeat`
- `GET /api/cane/v1/devices/:deviceId/config`

### 6.2 Mobile API
- `POST /api/mobile/v1/auth/login`
- `POST /api/mobile/v1/auth/refresh`
- `GET /api/mobile/v1/me`
- `GET /api/mobile/v1/care-links`
- `GET /api/mobile/v1/dashboard/:blindUserId`
- `GET /api/mobile/v1/alerts/:blindUserId`
- `GET /api/mobile/v1/alerts/:blindUserId/recent`
- `GET /api/mobile/v1/alerts/:blindUserId/stats/today`
- `GET /api/mobile/v1/locations/:blindUserId/history`
- `POST /api/mobile/v1/notifications/tokens`

### 6.3 Internal API
- `POST /api/internal/v1/vision/results`
- `POST /api/internal/v1/jobs/retry`
- `POST /api/internal/v1/device/offline-check`

### 6.4 Admin API
- `GET /api/admin/v1/users`
- `GET /api/admin/v1/devices`
- `GET /api/admin/v1/vision/requests`
- `GET /api/admin/v1/alerts`

## 7. Security bắt buộc

### 7.1 Mobile security
- JWT access token ngắn hạn.
- Refresh token hash trong DB.
- Role guard cho admin routes.
- Check care_links trước khi guardian truy cập dữ liệu blind user.

### 7.2 Device security
- Không tin `device_id` do client gửi nếu không có xác thực.
- Tốt nhất mỗi request từ gậy có header:
  - `x-device-code`
  - `x-signature`
  - `x-timestamp`
- Signature: HMAC SHA256 của `method + path + body + timestamp` bằng `device_secret`.
- Reject request nếu lệch thời gian quá 30 giây hoặc signature sai.

### 7.3 Internal security
- Worker callback phải gửi `Authorization: Bearer INTERNAL_WORKER_TOKEN`.
- Chỉ expose internal API trong private network nếu có thể.

### 7.4 Hardening
- Helmet.
- Throttler cho login và cane ingest.
- File size limit cho upload ảnh.
- Strict DTO validation.
- Log audit với hành động nhạy cảm.

## 8. Xử lý đa nhiệm và tải cao

### 8.1 Nguyên tắc
- API server **không** chạy YOLO inline.
- Mọi ảnh phải qua queue.
- Queue cho phép retry, timeout, backoff.
- Worker có thể scale nhiều instance.

### 8.2 Queue design
- Queue name: `vision-jobs`
- Job payload: `request_id`, `object_key`, `device_id`, `blind_user_id`, `captured_at`
- Attempts: 5
- Backoff: exponential 3s, 9s, 27s...
- Timeout: 120s
- Dead-letter strategy: mark request failed, log reason, optional manual retry

### 8.3 Idempotency
- Khi attach ảnh, nếu request đã `done` hoặc `processing`, không queue lại trùng.
- Worker trước khi ghi kết quả phải check `vision_results` đã có chưa.
- Alert dedup key: `alert:{blind_user_id}:{alert_type}:{bucket_30s}` trong Redis.

### 8.4 Sampling và chống flood
- Telemetry có thể gửi rất dày; server cần:
  - lưu bản ghi khi `now - last_saved >= DISTANCE_SAMPLING_MIN_MS`, hoặc
  - `abs(new_distance - last_distance) >= 10`.
- GPS tương tự: lưu khi di chuyển đủ xa hoặc sau một khoảng thời gian tối thiểu.

## 9. Business rules quan trọng

### 9.1 Safety status
Gợi ý rule v1:
- `danger`: có alert `high` chưa resolve trong 5 phút gần nhất hoặc `nearest_distance_cm < ALERT_DISTANCE_DANGER_CM`
- `warning`: khoảng cách nhỏ hơn warning threshold hoặc có alert medium mới
- `safe`: không có cảnh báo hiệu lực và khoảng cách an toàn
- `offline`: thiết bị không gửi heartbeat trong `DEVICE_OFFLINE_THRESHOLD_SECONDS`

### 9.2 Tạo alert
- Từ worker YOLO nếu `risk_level = high`.
- Từ telemetry nếu khoảng cách nguy hiểm liên tiếp N lần.
- Từ device offline job.
- Từ low battery nếu pin dưới ngưỡng.

### 9.3 Dashboard
Phải trả tối thiểu:
- `is_safe`
- `current_safety_status`
- `nearest_distance_cm`
- `today_alert_count`
- `recent_alerts`
- `last_location`
- `device_last_seen_at`

## 10. Redis keys nên dùng

- `user:{blind_user_id}:latest_distance`
- `user:{blind_user_id}:latest_location`
- `user:{blind_user_id}:current_status`
- `device:{device_id}:last_seen`
- `device:{device_id}:last_saved_distance_at`
- `alert_dedup:{blind_user_id}:{alert_type}`

## 11. Hàm / service nên có

### 11.1 AuthService
- `login(email, password)`
- `refresh(refreshToken)`
- `hashPassword(password)`
- `verifyPassword(hash, plain)`

### 11.2 DeviceAuthService
- `validateDeviceHeaders(headers, rawBody)`
- `computeSignature(payload, secret)`
- `assertReplaySafe(timestamp)`

### 11.3 ImageRequestsService
- `createRequest(dto)`
- `attachImage(requestId, objectKey)`
- `markQueued(requestId)`
- `markProcessing(requestId)`
- `markDone(requestId)`
- `markFailed(requestId, reason)`

### 11.4 VisionResultService
- `saveVisionResult(payload)`
- `computeRiskLevel(result)`
- `summarizeResult(result)`

### 11.5 AlertService
- `createAlertIfNeeded(input)`
- `isDuplicateAlert(input)`
- `createAlertReceivers(alertId, guardianIds)`
- `acknowledgeAlert(alertId, userId)`

### 11.6 LiveStatusService
- `updateDistanceStatus(blindUserId, distance)`
- `updateLocationStatus(blindUserId, location)`
- `recomputeSafetyStatus(blindUserId)`
- `getDashboard(blindUserId)`

### 11.7 StorageService
- `getPresignedUploadUrl(objectKey)`
- `putObject(stream)`
- `statObject(objectKey)`

### 11.8 RealtimeService
- `emitAlertCreated(blindUserId, payload)`
- `emitDistanceUpdated(blindUserId, payload)`
- `emitLocationUpdated(blindUserId, payload)`

## 12. Thư viện nên dùng trong server

- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/config`
- `@nestjs/swagger`
- `@nestjs/jwt`
- `@nestjs/passport`
- `@nestjs/mongoose`
- `@nestjs/bullmq`
- `@nestjs/websockets`
- `@nestjs/throttler`
- `mongoose`
- `bullmq`
- `ioredis`
- `minio`
- `argon2`
- `helmet`
- `firebase-admin`
- `uuid`
- `class-validator`
- `class-transformer`

## 13. Thư viện nên dùng trong worker Python

- `ultralytics`
- `opencv-python-headless`
- `numpy`
- `pymongo`
- `redis`
- `minio`
- `requests`
- `python-dotenv`

## 14. Việc AI agent phải làm theo thứ tự

### Phase 0 - Setup nền
1. Dựng NestJS project.
2. Kết nối ConfigModule.
3. Kết nối MongoDB.
4. Kết nối Redis + BullMQ.
5. Tạo Dockerfile và docker-compose.
6. Tạo bucket MinIO khi khởi động.

### Phase 1 - Schema và index
1. Tạo toàn bộ mongoose schemas.
2. Tạo index script.
3. Tạo TTL cho refresh_tokens và collection retention nếu áp dụng.
4. Tạo seed admin + seed demo data.

### Phase 2 - Auth và phân quyền
1. Login.
2. Refresh token.
3. Role guard.
4. Guardian access guard.

### Phase 3 - Device ingest
1. Gps ingest endpoint.
2. Distance ingest endpoint.
3. Heartbeat endpoint.
4. Device signature validation.
5. Update live status sau mỗi ingest.

### Phase 4 - Image pipeline
1. Create image request.
2. Upload object flow hoặc presigned URL.
3. Queue job.
4. Worker consume job.
5. Save vision result.
6. Create alert nếu cần.
7. Notify guardians.

### Phase 5 - Dashboard và mobile API
1. Dashboard endpoint.
2. Alert history endpoint.
3. Today stats endpoint.
4. Recent alerts endpoint.
5. Location history endpoint.

### Phase 6 - Realtime và push
1. Socket namespace.
2. Room theo blind user.
3. Emit event sau ingest/alert.
4. Firebase push integration.

### Phase 7 - Background jobs
1. Offline device checker mỗi 30 giây.
2. Cleanup logs cũ.
3. Recompute daily stats.

### Phase 8 - Test
1. Unit tests.
2. Integration tests.
3. E2E tests.
4. Load tests ingest telemetry.

## 15. Test cases bắt buộc

### 15.1 Unit test
- login đúng/sai
- create request
- attach image idempotent
- create alert dedup
- dashboard safety compute
- GPS save GeoJSON

### 15.2 Integration test
- cane request -> image queue -> worker -> alert
- guardian xem dashboard thành công
- guardian không có quyền -> 403
- duplicate telemetry không tạo quá nhiều alerts

### 15.3 Non-functional
- 100 req/s telemetry trong 5 phút
- 20 ảnh upload đồng thời
- worker fail retry đúng số lần
- Redis down thì API còn ghi Mongo tối thiểu và trả degrade mode phù hợp

## 16. Những lỗi phải tránh

- Chạy YOLO trong thread request HTTP.
- Lưu binary ảnh vào MongoDB.
- Không có index cho `blind_user_id + time`.
- Không có dedup cho alerts.
- Populate Mongo quá sâu.
- Không validate ObjectId.
- Cho guardian đọc dữ liệu người khác.

## 17. Chuẩn code agent nên tuân thủ

- Mỗi module có controller, service, repository hoặc model access rõ ràng.
- Không nhét business logic nặng vào controller.
- Dùng DTO cho mọi request body/query.
- Dùng interface/type cho payload queue.
- Mọi config đọc từ `.env`.
- Có Swagger cho API public.
- Có logger cho các luồng quan trọng.

## 18. Deliverables cuối cùng agent phải sinh ra

1. Source code server chạy được.
2. Source code worker chạy được.
3. `docker-compose.yml` hoàn chỉnh.
4. `.env.example` đầy đủ.
5. `README.md` hướng dẫn chạy.
6. Postman collection hoặc Swagger.
7. Seed script.
8. Test tối thiểu cho auth, ingest, alert, dashboard.

## 19. Chốt framework

Đề xuất cuối cùng:
- **Server**: NestJS + MongoDB + Mongoose + BullMQ + Redis + MinIO
- **Worker**: Python + Ultralytics YOLOv8

Lý do:
- NestJS tổ chức module tốt, dễ cho AI agent code tiếp.
- MongoDB hợp dữ liệu telemetry/alerts/vision linh hoạt.
- BullMQ đủ tốt cho queue ảnh và retry.
- Python phù hợp pipeline YOLO.
