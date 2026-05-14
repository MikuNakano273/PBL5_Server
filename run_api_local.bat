@echo off
setlocal

cd /d "%~dp0"

echo Starting PBL5 API local runtime...

if not exist ".venv\Scripts\activate.bat" (
  echo Missing .venv. Create it first:
  echo   py -3.11 -m venv .venv
  echo   .venv\Scripts\activate
  echo   python -m pip install -r api\requirements.txt
  pause
  exit /b 1
)

echo Starting Docker infrastructure: mongo redis minio
docker compose up -d mongo redis minio
if errorlevel 1 (
  echo Failed to start Docker infrastructure.
  pause
  exit /b 1
)

call ".venv\Scripts\activate.bat"

set "PYTHONPATH=%CD%\api"
set "MONGODB_URI=mongodb://localhost:27017/pbl5"
set "REDIS_HOST=localhost"
set "REDIS_PORT=6379"
set "REDIS_DB=0"
set "MINIO_ENDPOINT=localhost:9000"
set "MINIO_HOST=localhost"
set "MINIO_PORT=9000"
set "INTERNAL_API_URL=http://localhost:8000"

echo API health: http://localhost:8000/api/health
echo Swagger docs: http://localhost:8000/docs
echo Press Ctrl+C to stop API.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
