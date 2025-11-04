@echo off
echo ========================================
echo TerraFusion Rust Backend Launcher
echo ========================================

echo Checking Rust installation...
cargo --version
if %ERRORLEVEL% neq 0 (
    echo ❌ Rust not found! Please install Rust from https://rustup.rs/
    pause
    exit /b 1
)

echo ✅ Rust found!
echo.

echo Building TerraFusion Rust Backend...
cargo build --release
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed! Check errors above.
    pause
    exit /b 1
)

echo ✅ Build successful!
echo.

echo 🚀 Starting TerraFusion Rust Backend on port 8080...
echo 📊 Database: SQLite (terrabuild.db)
echo 🌐 API Endpoints: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo.

cargo run --release 