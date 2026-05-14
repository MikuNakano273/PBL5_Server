# PBL5 Server v3 Quickstart

## Prerequisites

- Python 3.11+
- Docker Desktop
- MongoDB, Redis, and MinIO from `docker-compose.yml`

## Start Infrastructure

```bash
cp .env.example .env
docker compose up -d mongo redis minio
```

## Install Dependencies

```bash
python -m pip install -r api/requirements.txt
python -m pip install -r worker/requirements.txt
```

## Run API

```bash
$env:PYTHONPATH='D:\PBL5_Server\api'
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/api/health
```

## Run YOLO Worker

```bash
$env:PYTHONPATH='D:\PBL5_Server\worker'
python -m app.main
```

The worker listens to Redis RQ queue `vision-jobs`.

## Test

```bash
$env:PYTHONPATH='D:\PBL5_Server\api'; python -m unittest discover api\tests
$env:PYTHONPATH='D:\PBL5_Server\worker'; python -m unittest discover worker\tests
```

## Endpoint Groups

- Mobile auth/profile/care links/dashboard/blind user data: `/api/mobile/v1`
- Cane device ingest/config: `/api/cane/v1`
- Worker callback/retry: `/api/internal/v1`
- Admin auth/resources: `/api/admin/v1`

OpenAPI docs are available at `http://localhost:8000/docs`.

## Demo Data For NavicAid App

Seed local MongoDB with demo users, one device, GPS logs, alerts, and one care link:

```powershell
python scripts\seed_demo_data.py
```

Demo credentials:

- Blind user: `blind@example.com` / `password123`
- Family user: `family@example.com` / `password123`
- Admin user: `admin@example.com` / `password123`

The NavicAid app defaults to blind user id `blind-1`.
