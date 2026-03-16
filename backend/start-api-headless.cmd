@echo off
REM Workaround for .NET CLI "The handle is invalid" error when running
REM without a proper console (e.g., from preview subprocess on Windows).
set DOTNET_SYSTEM_CONSOLE_ALLOW_ANSI_COLOR_REDIRECTION=1
set DOTNET_NOLOGO=1
set NO_COLOR=1
dotnet run --project src\TerraFusion.API\TerraFusion.API.csproj %*
