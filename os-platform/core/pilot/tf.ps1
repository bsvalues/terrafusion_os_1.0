#!/usr/bin/env pwsh
# TerraFusion Local Agent — PowerShell wrapper
# Usage: .\tf.ps1 <command> [args...]
# Example: .\tf.ps1 init | .\tf.ps1 doctor | .\tf.ps1 start | .\tf.ps1 events | .\tf.ps1 release
#
# Add this directory to $env:PATH for shell-level `tf <command>` access.

$cli = Join-Path $PSScriptRoot "local-agent\cli.js"
node $cli @args
exit $LASTEXITCODE
