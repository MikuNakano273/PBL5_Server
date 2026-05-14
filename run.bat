@echo off
REM PBL5 Smart Cane Server - Windows Management Script
REM Usage: run.bat [command] [options]

setlocal enabledelayedexpansion
cd /d "%~dp0"

REM Colors (using ANSI escape codes - requires Windows 10+)
set "RESET=[0m"
set "RED=[31m"
set "GREEN=[32m"
set "YELLOW=[33m"
set "BLUE=[34m"

REM Commands
if "%1"=="" goto cmd_start
if /i "%1"=="start" goto cmd_start
if /i "%1"=="stop" goto cmd_stop
if /i "%1"=="restart" goto cmd_restart
if /i "%1"=="logs" goto cmd_logs
if /i "%1"=="build" goto cmd_build
if /i "%1"=="ps" goto cmd_ps
if /i "%1"=="status" goto cmd_status
if /i "%1"=="health" goto cmd_health
if /i "%1"=="clean" goto cmd_clean
if /i "%1"=="reset" goto cmd_reset
if /i "%1"=="update" goto cmd_update
if /i "%1"=="shell" goto cmd_shell
if /i "%1"=="info" goto cmd_info
if /i "%1"=="help" goto cmd_help
if /i "%1"=="-h" goto cmd_help
if /i "%1"=="--help" goto cmd_help

echo.
echo [91mError: Unknown command '%1'[0m
echo Use 'run.bat help' for usage information
echo.
exit /b 1

REM ====================
REM Command: START
REM ====================
:cmd_start
cls
echo.
echo ===================================
echo   Starting PBL5 Services
echo ===================================
echo.

if not exist ".env" (
    echo [93mWarning: .env file not found[0m
    if exist ".env.example" (
        echo Copying from .env.example...
        copy .env.example .env >nul
        echo [92mSuccess: .env created[0m
    ) else (
        echo [91mError: .env.example not found[0m
        exit /b 1
    )
)

echo [36mBuilding and starting services...[0m
docker-compose up -d --build
if errorlevel 1 (
    echo [91mError: Failed to start services[0m
    exit /b 1
)

echo [92mSuccess: Services started![0m
echo [36mWaiting for services to be ready...[0m
timeout /t 10 /nobreak

call :cmd_status
goto end

REM ====================
REM Command: STOP
REM ====================
:cmd_stop
cls
echo.
echo ===================================
echo   Stopping PBL5 Services
echo ===================================
echo.

docker-compose down
if errorlevel 1 (
    echo [91mError: Failed to stop services[0m
    exit /b 1
)

echo [92mSuccess: All services stopped[0m
echo.
goto end

REM ====================
REM Command: RESTART
REM ====================
:cmd_restart
call :cmd_stop
timeout /t 2 /nobreak
call :cmd_start
goto end

REM ====================
REM Command: LOGS
REM ====================
:cmd_logs
cls
echo.
echo ===================================
echo   PBL5 Service Logs
echo ===================================
echo.
echo Press Ctrl+C to exit logs viewer
echo.

if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

REM ====================
REM Command: BUILD
REM ====================
:cmd_build
cls
echo.
echo ===================================
echo   Building PBL5 Services
echo ===================================
echo.

if /i "%2"=="clean" (
    echo [36mBuilding without cache...[0m
    docker-compose build --no-cache
) else (
    echo [36mBuilding images...[0m
    docker-compose build
)

if errorlevel 1 (
    echo [91mError: Build failed[0m
    exit /b 1
)

echo [92mSuccess: Build completed[0m
echo.
goto end

REM ====================
REM Command: PS
REM ====================
:cmd_ps
cls
echo.
echo ===================================
echo   Running Services
echo ===================================
echo.
docker-compose ps
echo.
goto end

REM ====================
REM Command: STATUS
REM ====================
:cmd_status
cls
echo.
echo ===================================
echo   Service Status
echo ===================================
echo.
docker-compose ps
echo.
echo [36mService URLs:[0m
echo   - API Health:   http://localhost/api/health
echo   - API Docs:     http://localhost/docs
echo   - MongoDB UI:   http://localhost:8081
echo   - MinIO:        http://localhost:9001
echo.
goto end

REM ====================
REM Command: HEALTH
REM ====================
:cmd_health
cls
echo.
echo ===================================
echo   Health Checks
echo ===================================
echo.

echo [36mTesting API endpoint...[0m
curl -s http://localhost/api/health >nul 2>&1
if errorlevel 1 (
    echo [91m  - API: Not responding[0m
) else (
    echo [92m  - API: Healthy[0m
)

echo [36mTesting Swagger documentation...[0m
curl -s -o nul -w "%%{http_code}" http://localhost/docs 2>nul | findstr /r "200 301" >nul
if errorlevel 1 (
    echo [91m  - Swagger: Not accessible[0m
) else (
    echo [92m  - Swagger: Accessible[0m
)

echo [36mTesting MongoDB Express...[0m
curl -s -o nul -w "%%{http_code}" http://localhost:8081 2>nul | findstr /r "200" >nul
if errorlevel 1 (
    echo [91m  - MongoDB: Not accessible[0m
) else (
    echo [92m  - MongoDB: Accessible[0m
)

echo [36mTesting MinIO console...[0m
curl -s -o nul -w "%%{http_code}" http://localhost:9001 2>nul | findstr /r "200" >nul
if errorlevel 1 (
    echo [91m  - MinIO: Not accessible[0m
) else (
    echo [92m  - MinIO: Accessible[0m
)

echo.
echo [36mContainer health status:[0m
docker-compose ps
echo.
goto end

REM ====================
REM Command: CLEAN
REM ====================
:cmd_clean
cls
echo.
echo ===================================
echo   Cleaning Up
echo ===================================
echo.

if /i "%2"=="volumes" (
    echo [93mWarning: This will delete all data![0m
    set /p confirm="Continue? (yes/no): "
    if /i not "!confirm!"=="yes" (
        echo [36mCleanup cancelled[0m
        goto end
    )
    echo [36mRemoving all containers and volumes...[0m
    docker-compose down -v
    docker system prune -a --volumes -f
) else if /i "%2"=="all" (
    echo [36mFull cleanup (keeping volumes)...[0m
    docker-compose down
    docker system prune -f
) else (
    echo [36mRemoving stopped containers...[0m
    docker container prune -f
)

if errorlevel 1 (
    echo [91mError: Cleanup failed[0m
    exit /b 1
)

echo [92mSuccess: Cleanup completed[0m
echo.
goto end

REM ====================
REM Command: RESET
REM ====================
:cmd_reset
cls
echo.
echo ===================================
echo   FULL SYSTEM RESET
echo ===================================
echo.
echo [91mWarning: This will remove EVERYTHING![0m
set /p confirm="Type 'yes' to continue: "

if /i not "!confirm!"=="yes" (
    echo [36mReset cancelled[0m
    goto end
)

echo [36mRemoving all containers, images, and volumes...[0m
docker-compose down -v
docker system prune -a --volumes -f

echo [92mSuccess: System reset complete[0m
echo.
goto end

REM ====================
REM Command: UPDATE
REM ====================
:cmd_update
cls
echo.
echo ===================================
echo   Updating Services
echo ===================================
echo.

echo [36mRebuilding images (no cache)...[0m
docker-compose build --no-cache
if errorlevel 1 (
    echo [91mError: Build failed[0m
    exit /b 1
)

echo [36mRestarting services...[0m
docker-compose down
docker-compose up -d

timeout /t 3 /nobreak
call :cmd_status
goto end

REM ====================
REM Command: SHELL
REM ====================
:cmd_shell
cls
echo.
if "%2"=="" (
    echo [91mError: Please specify service: worker, api, mongo, redis[0m
    exit /b 1
)

echo ===================================
echo   Opening shell in %2
echo ===================================
echo.

if /i "%2"=="worker" (
    docker-compose exec worker bash
) else if /i "%2"=="api" (
    docker-compose exec api sh
) else if /i "%2"=="mongo" (
    docker-compose exec mongo mongosh
) else if /i "%2"=="redis" (
    docker-compose exec redis redis-cli
) else (
    echo [91mError: Unknown service: %2[0m
    exit /b 1
)

goto end

REM ====================
REM Command: INFO
REM ====================
:cmd_info
cls
echo.
echo ===================================
echo   System Information
echo ===================================
echo.

echo [36mDocker versions:[0m
docker --version
docker-compose --version

echo.
echo [36mRunning containers:[0m
docker-compose ps

echo.
echo [36mDisk usage:[0m
docker system df

echo.
if exist ".env" (
    echo [92m.env file exists[0m
) else (
    echo [93m.env file not found[0m
)

echo.
goto end

REM ====================
REM Command: HELP
REM ====================
:cmd_help
cls
echo.
echo ===================================
echo   PBL5 Server - Management Script
echo ===================================
echo.
echo USAGE:
echo   run.bat [command] [options]
echo.
echo COMMANDS:
echo   start           Start all services
echo   stop            Stop all services
echo   restart         Restart all services
echo   logs [service]  Show logs (optionally for specific service)
echo   build [clean]   Build images (with 'clean' for no cache)
echo   ps              Show running services
echo   status          Check service status
echo   health          Run health checks
echo   shell [service] Open shell in container
echo   clean [all/vol] Clean up containers/volumes
echo   reset           Full system reset (WARNING!)
echo   update          Update and restart services
echo   info            Show system information
echo   help            Show this help message
echo.
echo EXAMPLES:
echo   run.bat start
echo   run.bat logs worker
echo   run.bat build clean
echo   run.bat shell api
echo   run.bat health
echo.
echo URLS:
echo   API:       http://localhost/api
echo   Docs:      http://localhost/docs
echo   MongoDB:   http://localhost:8081
echo   MinIO:     http://localhost:9001
echo.
echo DOCUMENTATION:
echo   - QUICKSTART.md
echo   - CLEANUP_GUIDE.md
echo   - CHANGES_SUMMARY.md
echo.
goto end

REM ====================
REM End
REM ====================
:end
echo.
exit /b 0
