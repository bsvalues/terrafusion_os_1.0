@echo off
echo.
echo ====================================
echo TerraFusion GIS Workflow Assistant
echo Benton County, Washington Edition
echo ====================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js LTS from nodejs.org
    pause
    exit /b 1
)

echo Node.js detected successfully
echo.

REM Navigate to the backend directory
cd /d "%~dp0tf-assistant\backend"

REM Check if required dependencies are available
if not exist "node_modules" (
    echo Installing dependencies...
    npm install express body-parser cors
    echo.
)

REM Start the TerraFusion GIS Workflow Assistant
echo Starting TerraFusion GIS Workflow Assistant...
echo.
echo Server will run on: http://localhost:3001
echo.
echo Available endpoints:
echo   /health                    - System health check
echo   /agent-mesh/workflow       - Multi-agent workflow processing
echo   /parcel/sm00-report        - SM00 report generation
echo   /parcel/bla-merge-split    - Boundary Line Adjustment processing
echo   /rag/search                - Document search with RAG
echo   /prompts/pending           - Prompt approval queue
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause