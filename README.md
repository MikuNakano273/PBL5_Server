# PBL5 Server v3

Backend for the PBL5 smart cane MVP, aligned with the admin/user domain model in `docs/superpowers/specs/2026-05-14-admin-user-auth-domain-design.md`.

## Stack

- API: Python 3.11, FastAPI
- Worker: Python, RQ, YOLO/Ultralytics
- Database: MongoDB
- Queue/cache: Redis + RQ queue `vision-jobs`
- Object storage: MinIO bucket `pbl5-images`

Legacy assumptions such as NestJS, Socket.IO, BullMQ, `notification_tokens`, `alert_receivers`, `audit_logs`, and `daily_alert_stats` are not part of the v3 minimal implementation.

## Local Run

```bash
cp .env.example .env
python -m pip install -r api/requirements.txt
python -m pip install -r worker/requirements.txt
docker compose up -d mongo redis minio
```

Run API:

```bash
$env:PYTHONPATH='D:\PBL5_Server\api'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Run worker:

```bash
$env:PYTHONPATH='D:\PBL5_Server\worker'
python -m app.main
```

Useful URLs:

- API health: `http://localhost:8000/api/health`
- Swagger/OpenAPI: `http://localhost:8000/docs`
- MinIO console: `http://localhost:9001`

## Main Workflows

Mobile auth uses installation-aware tokens:

- `POST /api/mobile/v1/auth/login`
- `POST /api/mobile/v1/auth/refresh`
- `POST /api/mobile/v1/auth/logout`
- `GET /api/mobile/v1/installations/me/accounts`
- `POST /api/mobile/v1/installations/me/switch-account`

One physical phone is represented by `mobile_installations`. Multiple accounts can be attached via `installation_accounts`; only one account is active at a time, but the notification inbox is shared by installation.

Cane/device flow:

- Cane authenticates with `X-Device-Code` and `X-Device-Secret`
- GPS, distance, heartbeat, image metadata, and uploaded image are accepted under `/api/cane/v1`
- Image upload queues an RQ job with `request_id`, `device_id`, `user_id`, object key, and timestamp
- Worker downloads the image from MinIO, runs YOLO, and callbacks to `/api/internal/v1/vision/results`
- API stores `vision_results`, updates `image_requests`, creates alerts, fans out notification inbox rows, and sends push through installation tokens when present

Admin:

- `POST /api/admin/v1/auth/login` issues admin-scoped JWTs with `token_use=admin`
- Admin APIs cover users, devices, device assignment, image requests, and alerts

Actors are limited to `admin` and `user`. A `user` account manages one cane. Phone installations may contain multiple user accounts, and those accounts share one installation-scoped notification inbox.

More detail: `docs/workflows.md`.

## Verification

```bash
$env:PYTHONPATH='D:\PBL5_Server\api'; python -m unittest discover api\tests
$env:PYTHONPATH='D:\PBL5_Server\worker'; python -m unittest discover worker\tests
```
