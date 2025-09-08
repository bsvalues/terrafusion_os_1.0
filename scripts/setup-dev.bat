@echo off
REM TerraFusion Development Setup Script for Windows
REM This script sets up the complete development environment

echo 🚀 Starting TerraFusion Development Environment Setup...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update .env file with your actual configuration values before proceeding.
    echo    Required: POSTGRES_PASSWORD, REDIS_PASSWORD, JWT_SECRET_KEY
    pause
)

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist logs\nginx mkdir logs\nginx
if not exist data\postgres mkdir data\postgres
if not exist data\redis mkdir data\redis
if not exist docker\nginx\ssl mkdir docker\nginx\ssl

REM Generate self-signed SSL certificate for development (requires OpenSSL)
if not exist docker\nginx\ssl\cert.pem (
    echo 🔐 Generating self-signed SSL certificate for development...
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout docker\nginx\ssl\private.key -out docker\nginx\ssl\cert.pem -subj "/C=US/ST=State/L=City/O=TerraFusion/CN=localhost"
    if %errorlevel% neq 0 (
        echo ⚠️  OpenSSL not found. SSL certificate generation skipped.
        echo    You can generate it manually later or use HTTP only for development.
    )
)

REM Pull latest images
echo 📦 Pulling latest Docker images...
docker-compose pull

REM Build custom images
echo 🔨 Building application images...
docker-compose build --parallel

REM Start services
echo 🚀 Starting services...
docker-compose up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...
docker-compose ps

REM Display useful information
echo.
echo ✅ TerraFusion Development Environment is ready!
echo.
echo 🌐 Application URLs:
echo    Frontend:    http://localhost:3000
echo    Backend API: http://localhost:8080
echo    AI Agent:    http://localhost:3001
echo    Database:    localhost:5432
echo    Redis:       localhost:6379
echo.
echo 📊 Useful commands:
echo    View logs:       docker-compose logs -f [service_name]
echo    Stop services:   docker-compose down
echo    Restart:         docker-compose restart [service_name]
echo    Database shell:  docker-compose exec postgres psql -U terrafusion_user -d terrafusion
echo    Redis CLI:       docker-compose exec redis redis-cli
echo.
echo 🔧 Troubleshooting:
echo    Check status:    docker-compose ps
echo    View all logs:   docker-compose logs
echo    Rebuild images:  docker-compose build --no-cache
echo.

REM Optional: Open browser
set /p REPLY="Open application in browser? (y/N): "
if /i "%REPLY%"=="y" (
    start http://localhost:3000
)

echo 🎉 Setup complete! Happy coding!
pause
