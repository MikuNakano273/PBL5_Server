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
- Admin web after building: `http://localhost:8000/admin`
- MinIO console: `http://localhost:9001`

Admin frontend development:

```bash
cd admin-web
npm install
npm test -- --run
npm run dev
```

Vite proxies `/api` requests to `http://localhost:8000`. Build the frontend
before serving it from FastAPI:

```bash
cd admin-web
npm run build
```

If `admin-web/dist` is missing, FastAPI still starts and `/admin` returns an
informative `503` response.

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
- API stores `vision_results`, updates `image_requests`, and creates alerts independently from the installation notification inbox
- Notification inbox and push are reserved for system, account, announcement, and other general events; alerts are read through alert APIs

Admin:

- `POST /api/admin/v1/auth/login` issues admin-scoped JWTs with `token_use=admin`
- Admin APIs cover users, devices, device assignment, image requests, and alerts

Actors are limited to `admin` and `user`. A `user` account manages one cane. Phone installations may contain multiple user accounts, and those accounts share one installation-scoped notification inbox.

More detail: `docs/workflows.md`.

## Development Test Alert

The dev-only test endpoint is registered when neither `APP_ENV` nor legacy `ENVIRONMENT` is `production`, or when `ENABLE_DEV_ENDPOINTS=true`:

```bash
curl -X POST http://localhost:8000/api/mobile/v1/dev/test-alert \
  -H "Authorization: Bearer <mobile-access-token>"
```

It creates and returns a new high-risk `OBSTACLE` alert for the authenticated user's cane. The endpoint is absent from the production routing table by default. Do not set `ENABLE_DEV_ENDPOINTS=true` in production.

## Docker Storage And Ports

The Docker stack publishes only the interfaces needed from the host:

- API and admin web: `http://localhost:8000`
- MinIO console: `http://localhost:9001`

MongoDB, Redis, and the MinIO API remain available to containers on the
`pbl5-network` network, but are not published to the host.

MongoDB application data uses database `pbl5`. The connection is configured
in `docker-compose.yml` through `MONGODB_URI` and `MONGODB_DB_NAME`; API
connection code lives in `api/app/core/database.py`. Persistent database files
are stored in the project at `Database/mongo`, mounted at `/data/db` inside
the MongoDB container.

```bash
docker exec pbl5-mongo mongosh --quiet -u admin -p admin123 \
  --authenticationDatabase admin pbl5
```

MongoDB's Docker logging driver is intentionally disabled because MongoDB
prints connection and checkpoint INFO messages continuously. Use container
health and an authenticated ping instead:

```bash
docker compose ps mongo
docker exec pbl5-mongo mongosh --quiet -u admin -p admin123 \
  --authenticationDatabase admin --eval "db.getSiblingDB('pbl5').runCommand({ping: 1})"
```

Do not delete `Database/mongo` unless the MongoDB data should be permanently
removed.

## Verification

```bash
$env:PYTHONPATH='D:\PBL5_Server\api'; python -m unittest discover api\tests
$env:PYTHONPATH='D:\PBL5_Server\worker'; python -m unittest discover worker\tests
```
