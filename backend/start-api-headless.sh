#!/usr/bin/env bash
# Workaround for .NET CLI "The handle is invalid" error when running
# without a proper console (e.g., from preview subprocess on Windows).
export DOTNET_SYSTEM_CONSOLE_ALLOW_ANSI_COLOR_REDIRECTION=1
export DOTNET_NOLOGO=1
export NO_COLOR=1
exec dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj "$@"
