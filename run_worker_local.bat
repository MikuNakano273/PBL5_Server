@echo off
setlocal

cd /d "%~dp0"

echo Starting PBL5 worker local runtime...

if not exist ".venv\Scripts\activate.bat" (
  echo Missing .venv. Create it first:
  echo   py -3.11 -m venv .venv
  echo   .venv\Scripts\activate
  echo   python -m pip install -r worker\requirements.txt
  pause
  exit /b 1
)

call ".venv\Scripts\activate.bat"

set "PYTHONPATH=%CD%\worker"
set "MONGODB_URI=mongodb://localhost:27017/pbl5"
set "REDIS_HOST=localhost"
set "REDIS_PORT=6379"
set "REDIS_DB=0"
set "MINIO_ENDPOINT=localhost:9000"
set "MINIO_HOST=localhost"
set "MINIO_PORT=9000"
set "INTERNAL_API_URL=http://localhost:8000"
set "INTERNAL_WORKER_TOKEN=change-me"

echo Worker queue: vision-jobs
echo Make sure API is already running at: http://localhost:8000
echo Press Ctrl+C to stop worker.

python -m app.main

pause
