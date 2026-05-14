
# PBL5 Server Spec v3 - Bản tinh gọn theo workflow switch account

## 1. Mục tiêu của bản v3

Bản v3 này chỉ sửa những phần thật sự cần thay đổi từ thiết kế cũ để phù hợp workflow mới của mobile app:

- Một máy có thể lưu nhiều account đã đăng nhập.
- Người dùng có thể switch account mà không cần nhập lại email/password.
- Inbox thông báo và push notification là dùng chung theo máy, không tách riêng theo từng account.
- Hệ thống vẫn giữ nguyên luồng lõi:
  - gậy gửi GPS, khoảng cách, heartbeat, metadata ảnh, ảnh chụp
  - server xếp ảnh vào queue
  - Python worker chạy YOLOv8
  - MongoDB lưu dữ liệu nghiệp vụ
  - tạo cảnh báo
  - app đọc dashboard, cảnh báo, lịch sử vị trí

Mục tiêu của tài liệu là để AI agent có thể code được toàn bộ backend theo đúng hướng này, nhưng không mở rộng thừa.

---

## 2. Actor model mới

### 2.1. Tác nhân chính
- **User**
- **Admin**

### 2.2. Phân loại nghiệp vụ của User
Trong nhóm `user` có 2 loại:
- `blind`: người mù, là người sở hữu hoặc sử dụng gậy
- `family`: người nhà / người theo dõi

### 2.3. Kết luận phân quyền
Chỉ giữ 2 role hệ thống:
- `admin`
- `user`

Trong `user` thêm trường:
- `user_type = blind | family`

Không cần tạo actor hệ thống quá nhiều. Cách này giúp auth, API guard và database đơn giản hơn.

---

## 3. Những thay đổi tối thiểu ở database

## 3.1. Giữ nguyên các collection lõi
Các collection cũ vẫn cần giữ:
- `users`
- `devices`
- `care_links`
- `image_requests`
- `vision_results`
- `gps_logs`
- `distance_telemetry`
- `alerts`
- `user_live_status`
- `refresh_tokens`

## 3.2. Bỏ những collection chưa cần cho bản tinh gọn
Trong bản v3, bỏ khỏi thiết kế triển khai mặc định:
- `daily_alert_stats`
- `audit_logs`
- `alert_receivers`
- `notification_tokens`
- `follow_link_requests`

Lý do:
- `daily_alert_stats`: có thể tính trực tiếp từ `alerts` ở MVP
- `audit_logs`: chưa bắt buộc nếu chưa làm giám sát sâu
- `alert_receivers`: không còn phù hợp khi chuyển sang notification chung theo máy
- `notification_tokens`: gộp vào `mobile_installations`
- `follow_link_requests`: chưa cần nếu luồng liên kết đang làm trực tiếp

## 3.3. Chỉ thêm các collection mới thật sự cần
### `mobile_installations`
Đại diện cho một máy cài app.

```json
{
  "_id": "inst_001",
  "device_fingerprint": "android-a55-abc",
  "device_name": "Samsung A55",
  "platform": "android",
  "push_provider": "fcm",
  "push_token": "fcm_xxx",
  "status": "active",
  "last_seen_at": "2026-04-17T09:00:00Z",
  "created_at": "2026-04-17T09:00:00Z",
  "updated_at": "2026-04-17T09:00:00Z"
}
```

Index:
- unique: `device_fingerprint`
- index: `status`
- index: `last_seen_at`

### `installation_accounts`
Liên kết giữa `mobile_installations` và `users`.

```json
{
  "_id": "ia_001",
  "installation_id": "inst_001",
  "user_id": "u_001",
  "is_active": true,
  "last_switched_at": "2026-04-17T09:15:00Z",
  "created_at": "2026-04-17T09:00:00Z",
  "updated_at": "2026-04-17T09:15:00Z"
}
```

Quy tắc:
- một installation có thể có nhiều account
- tại một thời điểm chỉ một account `is_active = true`

Index:
- unique compound: `{ installation_id, user_id }`
- index: `{ installation_id, is_active }`

### `notification_events`
Sự kiện thông báo phát sinh từ hệ thống.

```json
{
  "_id": "ne_001",
  "event_type": "alert",
  "alert_id": "a_001",
  "blind_user_id": "u_blind_1",
  "device_id": "d_001",
  "title": "Cảnh báo khẩn",
  "message": "Phát hiện vật cản ở khoảng cách 48 cm",
  "risk_level": "high",
  "created_at": "2026-04-17T09:20:00Z"
}
```

Dùng để chuẩn hóa mọi thông báo xuất hiện trong app/push.

Index:
- index: `created_at`
- index: `{ blind_user_id, created_at }`
- index: `{ event_type, created_at }`

### `installation_notifications`
Inbox thông báo dùng chung theo máy.

```json
{
  "_id": "in_001",
  "installation_id": "inst_001",
  "notification_event_id": "ne_001",
  "read_at": null,
  "created_at": "2026-04-17T09:20:00Z"
}
```

Index:
- index: `{ installation_id, created_at: -1 }`
- index: `{ installation_id, read_at: 1 }`
- unique compound: `{ installation_id, notification_event_id }`

---

## 4. Cấu trúc database chốt cho bản v3

## 4.1. users
```json
{
  "_id": "u_001",
  "email": "family@example.com",
  "password_hash": "...",
  "full_name": "Nguyen Van A",
  "phone": "0905xxxxxx",
  "role": "user",
  "user_type": "family",
  "status": "active",
  "created_at": "2026-04-17T09:00:00Z",
  "updated_at": "2026-04-17T09:00:00Z"
}
```

Ghi chú:
- `role = admin | user`
- `user_type = blind | family`, chỉ dùng khi `role = user`

Index:
- unique: `email`
- index: `{ role, user_type, status }`

## 4.2. care_links
Liên kết người nhà với người mù.

```json
{
  "_id": "cl_001",
  "blind_user_id": "u_blind_1",
  "family_user_id": "u_family_1",
  "relation": "family",
  "status": "active",
  "created_at": "2026-04-17T09:00:00Z",
  "updated_at": "2026-04-17T09:00:00Z"
}
```

Index:
- unique compound: `{ blind_user_id, family_user_id }`
- index: `{ blind_user_id, status }`
- index: `{ family_user_id, status }`

## 4.3. devices
```json
{
  "_id": "d_001",
  "device_code": "STICK-001",
  "serial_number": "SN-001",
  "owner_blind_user_id": "u_blind_1",
  "name": "Gậy thông minh số 1",
  "firmware_version": "1.0.0",
  "status": "online",
  "last_seen_at": "2026-04-17T09:10:00Z",
  "last_battery": 81,
  "created_at": "2026-04-17T09:00:00Z",
  "updated_at": "2026-04-17T09:10:00Z"
}
```

Index:
- unique: `device_code`
- unique: `serial_number`
- index: `{ owner_blind_user_id, status }`

## 4.4. gps_logs
Log vị trí theo thời gian.

Index:
- `{ blind_user_id, recorded_at: -1 }`
- `{ device_id, recorded_at: -1 }`

TTL/retention:
- giữ 30 đến 90 ngày

## 4.5. distance_telemetry
Log khoảng cách vật cản.

Index:
- `{ blind_user_id, recorded_at: -1 }`
- `{ device_id, recorded_at: -1 }`

TTL/retention:
- giữ 7 đến 30 ngày
- nên sampling nếu thiết bị gửi quá dày

## 4.6. image_requests
Metadata ảnh gửi từ gậy.

Các trường quan trọng:
- `request_code`
- `device_id`
- `blind_user_id`
- `captured_at`
- `distance_cm`
- `gps_snapshot`
- `image_path`
- `status`
- `ai_status`

Index:
- unique: `request_code`
- `{ ai_status, created_at }`
- `{ blind_user_id, created_at: -1 }`

## 4.7. vision_results
Kết quả YOLO cho từng request.

Các trường:
- `image_request_id`
- `model_name`
- `model_version`
- `objects`
- `nearest_obstacle_cm`
- `risk_level`
- `summary_text`
- `processed_at`

Index:
- unique: `image_request_id`
- `{ risk_level, processed_at: -1 }`

## 4.8. alerts
Collection trung tâm cho app.

Các trường:
- `blind_user_id`
- `device_id`
- `image_request_id`
- `alert_type`
- `title`
- `message`
- `risk_level`
- `status`
- `lat`
- `lng`
- `distance_cm`
- `triggered_at`

Index:
- `{ blind_user_id, triggered_at: -1 }`
- `{ device_id, triggered_at: -1 }`
- `{ risk_level, triggered_at: -1 }`

## 4.9. user_live_status
Document tổng hợp để load dashboard nhanh.

```json
{
  "_id": "uls_001",
  "blind_user_id": "u_blind_1",
  "device_id": "d_001",
  "current_safety_status": "warning",
  "nearest_distance_cm": 48,
  "last_location": {
    "type": "Point",
    "coordinates": [108.2022, 16.0544]
  },
  "last_alert_at": "2026-04-17T09:20:00Z",
  "last_seen_at": "2026-04-17T09:20:00Z",
  "updated_at": "2026-04-17T09:20:00Z"
}
```

Index:
- unique: `blind_user_id`

## 4.10. refresh_tokens
Chỉ lưu hash, không lưu plain token.

Index:
- `{ user_id }`
- `{ expires_at }` TTL
- `{ token_hash }`

---

## 5. Kiến trúc backend chốt

## 5.1. Công nghệ
- **Core API**: Python 3.11 + FastAPI
- **Database**: MongoDB 7 + Motor/PyMongo
- **Queue/Cache**: Redis 7
- **Worker AI**: Python FastAPI hoặc worker process dùng Ultralytics YOLOv8
- **Object storage**: MinIO
- **Push notification**: Firebase Cloud Messaging
- **Background jobs**: RQ hoặc Celery
- **Validation**: Pydantic v2
- **Password hash**: passlib + bcrypt hoặc argon2
- **JWT**: python-jose hoặc PyJWT
- **Rate limit**: slowapi
- **HTTP client**: httpx
- **Logging**: structlog hoặc loguru
- **Testing**: pytest, pytest-asyncio, httpx, faker

## 5.2. Vì sao dùng Python cho core API
Bạn đã chốt Python + REST API + MongoDB. Để agent làm nhanh và đồng bộ với worker YOLO, chọn Python cho cả API và worker giúp:
- cùng ngôn ngữ
- chia sẻ model, enum, validation
- ít phải chuyển dữ liệu giữa Node và Python
- codebase gọn hơn

## 5.3. Thành phần hệ thống
- `api`: FastAPI core backend
- `worker`: xử lý queue YOLO
- `mongo`: database
- `redis`: queue + cache
- `minio`: lưu ảnh
- `nginx`: reverse proxy nếu cần
- `admin UI`: có thể để sau, hiện tại admin dùng REST API

---

## 6. Cấu trúc thư mục đề xuất

```text
PBL5_Server/
  api/
    app/
      main.py
      core/
        config.py
        security.py
        logging.py
        database.py
        redis.py
        minio.py
      common/
        enums/
        exceptions/
        utils/
        schemas/
      models/
        user.py
        device.py
        care_link.py
        image_request.py
        vision_result.py
        gps_log.py
        distance_telemetry.py
        alert.py
        user_live_status.py
        mobile_installation.py
        installation_account.py
        notification_event.py
        installation_notification.py
        refresh_token.py
      repositories/
        user_repository.py
        device_repository.py
        care_link_repository.py
        image_request_repository.py
        vision_result_repository.py
        gps_repository.py
        telemetry_repository.py
        alert_repository.py
        live_status_repository.py
        installation_repository.py
        notification_repository.py
        refresh_token_repository.py
      services/
        auth_service.py
        installation_service.py
        switch_account_service.py
        care_link_service.py
        dashboard_service.py
        alert_service.py
        telemetry_service.py
        gps_service.py
        image_request_service.py
        notification_service.py
        live_status_service.py
        device_service.py
        admin_service.py
      api/
        deps.py
        routers/
          cane.py
          auth.py
          me.py
          care_links.py
          dashboard.py
          blind_users.py
          notifications.py
          internal.py
          admin.py
      tasks/
        enqueue_vision.py
        offline_check.py
        retention_cleanup.py
    requirements.txt
    Dockerfile

  worker/
    app/
      main.py
      core/
        config.py
        logging.py
        database.py
        redis.py
        minio.py
      services/
        yolo_service.py
        result_callback_service.py
      workers/
        vision_worker.py
    requirements.txt
    Dockerfile

  docs/
    PBL5_Server_Spec_v3.md
    api_list.csv
    db.drawio

  docker-compose.yml
  .env.example
```

---

## 7. Router/API chốt cho workflow mới

Bản API đã được tinh gọn và sửa cho workflow switch account. Nhóm API chính:

### 7.1. Cane
- `POST /api/cane/v1/requests`
- `POST /api/cane/v1/requests/{request_id}/image`
- `POST /api/cane/v1/gps`
- `POST /api/cane/v1/telemetry/distance`
- `POST /api/cane/v1/heartbeat`
- `GET /api/cane/v1/devices/me/config`

### 7.2. Mobile auth + switch account
- `POST /api/mobile/v1/auth/login`
- `POST /api/mobile/v1/auth/refresh`
- `POST /api/mobile/v1/auth/logout`
- `GET /api/mobile/v1/installations/me/accounts`
- `POST /api/mobile/v1/installations/me/switch-account`

### 7.3. Me / profile
- `GET /api/mobile/v1/me`
- `PATCH /api/mobile/v1/me`
- `POST /api/mobile/v1/me/change-password`

### 7.4. Care links
- `GET /api/mobile/v1/care-links`
- `POST /api/mobile/v1/care-links`
- `DELETE /api/mobile/v1/care-links/{care_link_id}`

### 7.5. Blind user data
- `GET /api/mobile/v1/dashboard/{blind_user_id}`
- `GET /api/mobile/v1/blind-users/{blind_user_id}/devices`
- `GET /api/mobile/v1/blind-users/{blind_user_id}/locations`
- `GET /api/mobile/v1/blind-users/{blind_user_id}/alerts/today`
- `GET /api/mobile/v1/blind-users/{blind_user_id}/alerts`
- `GET /api/mobile/v1/blind-users/{blind_user_id}/alerts/recent`
- `GET /api/mobile/v1/alerts/{alert_id}`

### 7.6. Notification inbox chung theo máy
- `GET /api/mobile/v1/installations/me/notifications`
- `POST /api/mobile/v1/installations/me/notifications/{notification_id}/read`
- `POST /api/mobile/v1/installations/me/push-token`

### 7.7. Internal
- `POST /api/internal/v1/vision/results`
- `POST /api/internal/v1/vision/retry/{request_id}`

### 7.8. Admin
- `POST /api/admin/v1/auth/login`
- `GET /api/admin/v1/users`
- `GET /api/admin/v1/users/{user_id}`
- `PATCH /api/admin/v1/users/{user_id}`
- `GET /api/admin/v1/devices`
- `POST /api/admin/v1/devices/{device_id}/assign`
- `GET /api/admin/v1/image-requests`
- `GET /api/admin/v1/alerts`

---

## 8. Luồng nghiệp vụ chính

## 8.1. Luồng switch account
1. User đăng nhập account A trên máy.
2. Server tạo hoặc tìm `mobile_installations`.
3. Server thêm bản ghi vào `installation_accounts`.
4. User đăng nhập thêm account B trên cùng máy.
5. Khi switch:
   - app gọi `POST /installations/me/switch-account`
   - server set account cũ `is_active = false`
   - set account mới `is_active = true`
   - cấp access token/refresh token cho account mới
6. Không cần nhập lại mật khẩu nếu account đã tồn tại trong `installation_accounts`.

## 8.2. Luồng thông báo chung theo máy
1. Hệ thống tạo `alert`.
2. Từ alert sinh `notification_event`.
3. Server xác định những installation nào có account liên quan:
   - account blind đang sở hữu thiết bị
   - account family đang theo dõi blind user đó
4. Với mỗi installation hợp lệ, server tạo `installation_notification`.
5. Nếu installation có `push_token`, gửi FCM.
6. App đọc inbox chung bằng `GET /installations/me/notifications`.

## 8.3. Luồng ảnh YOLO
1. ESP32 gọi `POST /requests`.
2. ESP32 upload ảnh.
3. API lưu ảnh vào MinIO.
4. API enqueue job vào Redis queue.
5. Worker lấy job.
6. Worker tải ảnh, chạy YOLO.
7. Worker callback `POST /internal/v1/vision/results`.
8. API lưu `vision_results`.
9. Nếu rủi ro cao -> tạo `alert` -> tạo `notification_event` -> phát push/inbox.

---

## 9. Service layer cần có

## 9.1. AuthService
Chức năng:
- login
- refresh token
- logout
- change password
- issue access token

Các hàm nên có:
- `login_user(email, password, installation_payload)`
- `refresh_access_token(refresh_token)`
- `logout_account(user_id, installation_account_id)`
- `change_password(user_id, current_password, new_password)`
- `create_access_token(user_id, role, user_type)`
- `create_refresh_token(user_id, installation_id)`

## 9.2. InstallationService
- `get_or_create_installation(device_fingerprint, device_name, platform)`
- `attach_account_to_installation(installation_id, user_id)`
- `switch_active_account(installation_id, target_installation_account_id)`
- `list_installation_accounts(installation_id)`
- `save_push_token(installation_id, push_token, provider, platform)`

## 9.3. DashboardService
- `get_dashboard(blind_user_id, current_user_id)`
- `get_today_alerts(blind_user_id, tz)`
- `get_recent_alerts(blind_user_id, within_minutes)`
- `get_alert_history(blind_user_id, month, year, page, limit)`
- `get_location_history(blind_user_id, start_at, end_at, page, limit)`

## 9.4. AlertService
- `create_alert_from_distance(...)`
- `create_alert_from_vision_result(...)`
- `list_alerts_for_blind_user(...)`
- `get_alert_detail(alert_id, current_user_id)`

## 9.5. NotificationService
- `create_notification_event_from_alert(alert)`
- `fanout_notification_to_installations(event)`
- `list_installation_notifications(installation_id, page, limit)`
- `mark_notification_as_read(installation_id, notification_id)`

## 9.6. ImageRequestService
- `create_image_request(payload)`
- `attach_uploaded_image(request_id, image_path)`
- `enqueue_vision_job(request_id)`
- `retry_vision_job(request_id)`

## 9.7. VisionResultService
- `save_worker_result(payload)`
- `update_request_status_after_result(request_id, status)`
- `derive_risk_level(objects, nearest_obstacle_cm)`
- `build_summary_text(objects, nearest_obstacle_cm)`

## 9.8. TelemetryService
- `ingest_distance(payload)`
- `sample_or_store_distance(payload)`
- `update_live_status_from_distance(payload)`

## 9.9. GpsService
- `ingest_gps(payload)`
- `update_live_status_location(payload)`

---

## 10. Repository layer cần có

Mỗi collection có 1 repository riêng để tránh business logic nằm lẫn với truy vấn.

Bắt buộc:
- `UserRepository`
- `CareLinkRepository`
- `DeviceRepository`
- `ImageRequestRepository`
- `VisionResultRepository`
- `GpsRepository`
- `DistanceTelemetryRepository`
- `AlertRepository`
- `UserLiveStatusRepository`
- `MobileInstallationRepository`
- `InstallationAccountRepository`
- `NotificationEventRepository`
- `InstallationNotificationRepository`
- `RefreshTokenRepository`

Nguyên tắc:
- repository chỉ làm CRUD/query
- service mới chứa business logic
- không query MongoDB trực tiếp trong router

---

## 11. Quy tắc bảo mật

## 11.1. Auth
- password hash bằng bcrypt hoặc argon2
- access token sống ngắn
- refresh token sống dài hơn, chỉ lưu hash vào DB
- token gắn với user + installation

## 11.2. Device auth
Thiết bị không dùng auth của mobile.
Nên có:
- `device_code`
- `device_secret_hash` hoặc HMAC signature
- middleware xác thực riêng cho cane endpoints

## 11.3. Internal worker auth
`/api/internal/v1/*` phải có 1 trong 2 cách:
- internal API key trong header
- hoặc HMAC ký request body

Không để public.

## 11.4. Authorization
Family user chỉ xem được blind user có trong `care_links`.
Blind user chỉ xem dữ liệu của chính mình.
Admin xem toàn hệ thống.

## 11.5. Rate limit
Áp cho:
- login
- refresh
- cane ingest endpoints
- internal callback nếu public network

## 11.6. Validation
- dùng Pydantic DTO cho toàn bộ request/response
- validate ObjectId/id string
- validate time range
- validate page/limit

---

## 12. Đa nhiệm, queue và chịu tải

## 12.1. Vì sao phải dùng queue
Ảnh YOLO là tác vụ nặng, không được xử lý ngay trong HTTP request.
HTTP API chỉ nên:
- nhận metadata
- nhận ảnh
- lưu ảnh
- đẩy job vào queue
- trả nhanh cho ESP32

## 12.2. Queue đề xuất
Có thể chọn:
- `RQ`
- hoặc `Celery`

Để dễ triển khai với Redis, bản v3 ưu tiên:
- Redis + RQ

## 12.3. Worker design
Worker loop:
1. nhận job `request_id`
2. load image request từ Mongo
3. tải ảnh từ MinIO
4. chạy YOLO
5. build result payload
6. callback về internal API hoặc ghi trực tiếp DB
7. mark job done / fail

## 12.4. Retry
- retry tối đa 3 lần
- exponential backoff
- trạng thái request:
  - `created`
  - `uploaded`
  - `queued`
  - `processing`
  - `done`
  - `failed`

## 12.5. Concurrency
- API dùng uvicorn/gunicorn nhiều worker
- worker YOLO nên scale theo GPU/CPU thực tế
- GPS/distance endpoints phải nhẹ, không transaction nặng

## 12.6. Sampling telemetry
Distance không nên lưu mọi gói nếu thiết bị bắn quá dày.
Rule gợi ý:
- chỉ lưu khi cách bản ghi trước > 2 giây
- hoặc khi `abs(current_distance - last_distance) >= threshold`

---

## 13. Chi tiết router cần code

## 13.1. `routers/cane.py`
Endpoints:
- create request
- upload image
- gps
- telemetry distance
- heartbeat
- get config

DTO:
- `CreateImageRequestBody`
- `GpsIngestBody`
- `DistanceTelemetryBody`
- `HeartbeatBody`

## 13.2. `routers/auth.py`
Endpoints:
- login
- refresh
- logout

DTO:
- `LoginBody`
- `RefreshBody`
- `LogoutBody`

## 13.3. `routers/me.py`
Endpoints:
- get me
- patch me
- change password

## 13.4. `routers/care_links.py`
Endpoints:
- list
- create
- delete

## 13.5. `routers/dashboard.py`
Endpoints:
- dashboard
- today alerts
- recent alerts
- alert history
- alert detail
- locations
- devices

## 13.6. `routers/notifications.py`
Endpoints:
- list installation notifications
- mark read
- save push token
- list installation accounts
- switch account

## 13.7. `routers/internal.py`
Endpoints:
- worker result callback
- retry request

## 13.8. `routers/admin.py`
Endpoints:
- admin login
- list users
- get user
- patch user
- list devices
- assign device
- list image requests
- list alerts

---

## 14. Cần viết những model/Pydantic schema nào

Ít nhất phải có:
- `LoginRequest`
- `LoginResponse`
- `RefreshRequest`
- `UserResponse`
- `UpdateMeRequest`
- `ChangePasswordRequest`
- `CareLinkCreateRequest`
- `DashboardResponse`
- `AlertItemResponse`
- `AlertDetailResponse`
- `LocationItemResponse`
- `CreateImageRequestRequest`
- `CreateImageRequestResponse`
- `VisionResultCallbackRequest`
- `NotificationItemResponse`
- `SwitchAccountRequest`

---

## 15. Chính sách retention

- `gps_logs`: 30-90 ngày
- `distance_telemetry`: 7-30 ngày
- `image_requests`: giữ lâu hơn nếu cần audit ảnh
- ảnh raw trong MinIO: có thể giữ 7-30 ngày nếu không phải incident quan trọng
- `alerts`: giữ lâu
- `installation_notifications`: có thể giữ 30-90 ngày hoặc soft cleanup

---

## 16. Test plan

## 16.1. Unit tests
- auth service
- switch account service
- installation service
- dashboard service
- alert service
- notification service
- image request service
- telemetry service
- gps service

## 16.2. Integration tests
- login account A + account B cùng 1 máy
- switch account không cần password
- alert sinh từ blind user A vẫn vào inbox chung của máy
- family account chỉ xem được blind user có care link
- ESP32 gửi ảnh -> worker callback -> alert -> notification inbox
- push token lưu theo installation, không theo user

## 16.3. E2E
Kịch bản:
1. Máy đăng nhập 2 account
2. Switch giữa 2 account
3. Blind user A có gậy gửi cảnh báo
4. Inbox chung trên máy vẫn hiện cảnh báo
5. App đổi sang account B vẫn thấy cùng inbox máy
6. Family account B chỉ xem chi tiết blind user được phép

---

## 17. Những việc AI agent phải làm theo thứ tự

### Phase 1 - nền tảng
1. dựng FastAPI app
2. dựng config/env
3. kết nối MongoDB, Redis, MinIO
4. dựng base repository
5. dựng auth + refresh token
6. dựng mobile_installations + installation_accounts
7. dựng switch account API

### Phase 2 - lõi nghiệp vụ mobile
8. dựng users/me
9. dựng care_links
10. dựng dashboard
11. dựng alerts + locations + devices read APIs
12. dựng notification_events + installation_notifications
13. dựng push token theo installation

### Phase 3 - luồng thiết bị
14. dựng cane auth
15. dựng GPS ingest
16. dựng distance ingest
17. dựng heartbeat
18. dựng image request create/upload
19. nối MinIO

### Phase 4 - worker YOLO
20. dựng queue Redis + RQ
21. dựng worker Python
22. dựng callback internal result
23. dựng create alert từ vision result
24. dựng fanout notification

### Phase 5 - admin và hoàn thiện
25. dựng admin auth
26. dựng admin users/devices/image-requests/alerts
27. thêm retention cleanup
28. thêm rate limit
29. thêm tests
30. thêm logging/healthcheck

---

## 18. File `.env` gợi ý

```env
APP_NAME=PBL5 Server
APP_ENV=development
APP_PORT=8000

MONGODB_URI=mongodb://admin:password@mongo:27017/pbl5?authSource=admin
REDIS_URL=redis://redis:6379/0

JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=pbl5-images
MINIO_SECURE=false

INTERNAL_API_KEY=change_me_internal
DEVICE_HMAC_SECRET=change_me_device

YOLO_MODEL_PATH=/models/yolov8s.pt
ALERT_DISTANCE_THRESHOLD_CM=100
GPS_RETENTION_DAYS=30
DISTANCE_RETENTION_DAYS=14
```

---

## 19. Kết luận chốt

Bản v3 này đã được tinh gọn đúng theo yêu cầu:
- chỉ sửa phần cần sửa
- giữ lõi hệ thống cũ
- thêm switch account
- thêm notification chung theo máy
- bỏ những collection phụ chưa cần

Nếu code đúng theo spec này, backend sẽ:
- hỗ trợ nhiều account trên một máy
- cho phép switch account không cần login lại
- giữ inbox thông báo chung cho toàn bộ account trên máy
- vẫn xử lý được nhiều gậy, nhiều blind user, nhiều family user
- đủ nhẹ để làm MVP nhưng vẫn có đường mở rộng lên production
