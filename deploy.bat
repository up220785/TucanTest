@echo off
title TucanTest Docker Deployment

echo 🐳 TucanTest Docker Deployment Script
echo =====================================

:check_docker
echo Checking Docker installation...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH.
    echo    Please install Docker Desktop from: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available.
    echo    Please install Docker Compose or update Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker and Docker Compose are available

:main_menu
echo.
echo Please choose a deployment option:
echo 1^) 🚀 Production deployment (with Nginx reverse proxy^)
echo 2^) 🛠️  Development deployment (with hot reloading^)
echo 3^) 📊 Show running services status
echo 4^) 📋 Show service logs
echo 5^) 🛑 Stop all services
echo 6^) 🔄 Rebuild and restart services
echo 7^) 🧹 Clean up (stop and remove containers, networks, volumes^)
echo 8^) ❌ Exit
echo.

set /p choice=Enter your choice (1-8): 

if "%choice%"=="1" goto deploy_production
if "%choice%"=="2" goto deploy_development
if "%choice%"=="3" goto show_status
if "%choice%"=="4" goto show_logs
if "%choice%"=="5" goto stop_services
if "%choice%"=="6" goto rebuild_restart
if "%choice%"=="7" goto cleanup
if "%choice%"=="8" goto exit_script

echo ❌ Invalid choice. Please try again.
goto main_menu

:deploy_production
echo 🚀 Starting production deployment...
docker-compose down >nul 2>&1
docker-compose up -d --build

if %errorlevel% equ 0 (
    echo.
    echo ✅ Production deployment successful!
    echo.
    echo 🌐 Access your application at:
    echo    • Main Application: http://localhost
    echo    • Frontend Direct:  http://localhost:4173
    echo    • Backend API:      http://localhost:5000
    echo    • Swagger UI:       http://localhost:5000/api/docs/
    echo.
    echo 🔍 Check status with: docker-compose ps
    echo 📋 View logs with:    docker-compose logs -f
) else (
    echo ❌ Production deployment failed!
)
goto continue

:deploy_development
echo 🛠️  Starting development deployment...
docker-compose -f docker-compose.dev.yml down >nul 2>&1
docker-compose -f docker-compose.dev.yml up -d --build

if %errorlevel% equ 0 (
    echo.
    echo ✅ Development deployment successful!
    echo.
    echo 🌐 Access your application at:
    echo    • Frontend (Vite^):  http://localhost:5173
    echo    • Backend API:      http://localhost:5000
    echo    • Swagger UI:       http://localhost:5000/api/docs/
    echo.
    echo 🔄 Hot reloading is enabled for development
    echo 🔍 Check status with: docker-compose -f docker-compose.dev.yml ps
    echo 📋 View logs with:    docker-compose -f docker-compose.dev.yml logs -f
) else (
    echo ❌ Development deployment failed!
)
goto continue

:show_status
echo 📊 Checking service status...
echo.
echo Production services:
docker-compose ps 2>nul
if %errorlevel% neq 0 echo No production services running
echo.
echo Development services:
docker-compose -f docker-compose.dev.yml ps 2>nul
if %errorlevel% neq 0 echo No development services running
goto continue

:show_logs
echo Which logs would you like to see?
echo 1^) Production logs
echo 2^) Development logs
echo 3^) Backend logs only
echo 4^) Frontend logs only
set /p log_choice=Enter your choice (1-4): 

if "%log_choice%"=="1" (
    echo 📋 Showing production logs (press Ctrl+C to exit^)...
    docker-compose logs -f
)
if "%log_choice%"=="2" (
    echo 📋 Showing development logs (press Ctrl+C to exit^)...
    docker-compose -f docker-compose.dev.yml logs -f
)
if "%log_choice%"=="3" (
    echo 📋 Showing backend logs (press Ctrl+C to exit^)...
    docker-compose logs -f backend 2>nul || docker-compose -f docker-compose.dev.yml logs -f backend
)
if "%log_choice%"=="4" (
    echo 📋 Showing frontend logs (press Ctrl+C to exit^)...
    docker-compose logs -f frontend 2>nul || docker-compose -f docker-compose.dev.yml logs -f frontend
)
goto continue

:stop_services
echo 🛑 Stopping all services...
docker-compose down >nul 2>&1
docker-compose -f docker-compose.dev.yml down >nul 2>&1
echo ✅ All services stopped
goto continue

:rebuild_restart
echo 🔄 Rebuilding and restarting services...
echo Which deployment?
echo 1^) Production
echo 2^) Development
set /p rebuild_choice=Enter your choice (1-2): 

if "%rebuild_choice%"=="1" (
    docker-compose down >nul 2>&1
    docker-compose build --no-cache
    docker-compose up -d
    echo ✅ Production services rebuilt and restarted
)
if "%rebuild_choice%"=="2" (
    docker-compose -f docker-compose.dev.yml down >nul 2>&1
    docker-compose -f docker-compose.dev.yml build --no-cache
    docker-compose -f docker-compose.dev.yml up -d
    echo ✅ Development services rebuilt and restarted
)
goto continue

:cleanup
echo 🧹 This will stop and remove all containers, networks, and volumes.
set /p confirm=Are you sure? (y/N): 

if /i "%confirm%"=="y" (
    echo 🧹 Cleaning up...
    docker-compose down --volumes --remove-orphans >nul 2>&1
    docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans >nul 2>&1
    docker system prune -f
    echo ✅ Cleanup completed
) else (
    echo ❌ Cleanup cancelled
)
goto continue

:continue
echo.
pause
goto main_menu

:exit_script
echo 👋 Goodbye!
pause
exit /b 0
