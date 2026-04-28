@echo off
setlocal
cd /d "%~dp0\..\..\.."
node os-platform\core\pilot\local-agent-release-proof-wrapper.mjs
exit /b %ERRORLEVEL%