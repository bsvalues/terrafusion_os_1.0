@echo off
title TerraFusion Configuration Wizard
color 0B

echo.
echo ===============================================
echo    🔧 TERRAFUSION CONFIGURATION WIZARD 🔧
echo ===============================================
echo.
echo This wizard will help you configure your API keys.
echo You'll need these to enable AI features:
echo.
echo 1. OpenAI API Key (for property analysis)
echo 2. Anthropic API Key (for advanced reasoning)
echo.
echo Don't have API keys? No problem!
echo - OpenAI: Visit https://platform.openai.com/api-keys
echo - Anthropic: Visit https://console.anthropic.com/
echo.
echo You can skip this step and add keys later.
echo.

set /p SETUP_KEYS="Would you like to set up API keys now? (y/n): "
if /i "%SETUP_KEYS%"=="y" goto SETUP_KEYS
if /i "%SETUP_KEYS%"=="yes" goto SETUP_KEYS
goto SKIP_KEYS

:SETUP_KEYS
echo.
echo 🔑 Setting up API keys...
echo.
set /p OPENAI_KEY="Enter your OpenAI API Key (or press Enter to skip): "
set /p ANTHROPIC_KEY="Enter your Anthropic API Key (or press Enter to skip): "
echo.

if not "%OPENAI_KEY%"=="" (
    if exist terrafusion_rust\.env (
        powershell -Command "(Get-Content terrafusion_rust\.env) -replace 'OPENAI_API_KEY=.*', 'OPENAI_API_KEY=%OPENAI_KEY%' | Set-Content terrafusion_rust\.env"
        echo ✅ OpenAI API key configured
    ) else (
        echo ⚠️  Environment file not found
    )
)

if not "%ANTHROPIC_KEY%"=="" (
    if exist terrafusion_rust\.env (
        powershell -Command "(Get-Content terrafusion_rust\.env) -replace 'ANTHROPIC_API_KEY=.*', 'ANTHROPIC_API_KEY=%ANTHROPIC_KEY%' | Set-Content terrafusion_rust\.env"
        echo ✅ Anthropic API key configured
    ) else (
        echo ⚠️  Environment file not found
    )
)

echo.
echo 🎉 Configuration complete!
goto END

:SKIP_KEYS
echo.
echo ⏭️  Skipping API key setup
echo You can run this wizard again anytime to configure keys.

:END
echo.
echo 📚 Quick Tips:
echo - API keys enable advanced AI features
echo - You can always change these settings later
echo - Keep your API keys secure and private
echo.
echo You can always run this wizard again by double-clicking:
echo "TerraFusion Configuration Wizard.bat"
echo.
pause 