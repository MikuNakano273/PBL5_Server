# PBL5 Server Starter

Bộ khởi tạo này dành cho dự án **PBL5 - Gậy thông minh cho người mù**.

Thành phần chính:
- `server/`: NestJS + TypeScript + MongoDB + Redis + Socket.IO + BullMQ
- `worker/`: Python YOLO worker xử lý ảnh bất đồng bộ
- `docker-compose.yml`: môi trường local/dev
- `.env.example`: biến môi trường mẫu
- `docs/IMPLEMENTATION_PLAN.md`: checklist triển khai rất chi tiết

Luồng chính:
1. Gậy gửi metadata ảnh, GPS, telemetry.
2. Server lưu MongoDB, cập nhật live state, đẩy realtime.
3. Ảnh được lưu MinIO, job được đẩy vào Redis/BullMQ.
4. Python worker lấy job, chạy YOLOv8, ghi kết quả về MongoDB và callback về API.
5. Server sinh cảnh báo, gửi push notification cho guardian, cập nhật dashboard.

## Chạy local

```bash
cp .env.example .env

docker compose up --build
```

API server mặc định: `http://localhost:3000`
MinIO console: `http://localhost:9001`
Mongo Express: `http://localhost:8081`

## Ghi chú

- Ảnh **không** lưu trong MongoDB, chỉ lưu object key / URL.
- Dashboard app nên ưu tiên đọc collection `user_live_status` để phản hồi nhanh.
- Worker AI nên scale ngang độc lập với API server.
