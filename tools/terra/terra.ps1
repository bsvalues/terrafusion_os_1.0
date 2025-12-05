param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

function Invoke-TerraScript {
    param(
        [string]$RelativePath,
        [string[]]$ScriptArgs
    )

    $script = Join-Path $PSScriptRoot $RelativePath
    & $script @ScriptArgs
}

function Show-Usage {
    Write-Error "Usage: ./terra.ps1 <backend|frontend|run> [args]"
    Write-Error "       ./terra.ps1 run <backend|frontend> [args]"
}

switch ($Command.ToLower()) {
    "backend" {
        Invoke-TerraScript "..\\..\\backend\\scripts\\start-api.ps1" $Args
    }
    "frontend" {
        Invoke-TerraScript "..\\..\\frontend\\scripts\\command-center.ps1" $Args
    }
    "run" {
        if (-not $Args) {
            Show-Usage
            exit 1
        }

        $target = $Args[0].ToLower()
        $scriptArgs = @()
        if ($Args.Length -gt 1) {
            $scriptArgs = $Args[1..($Args.Length - 1)]
        }

        switch ($target) {
            "backend" {
                Invoke-TerraScript "..\\..\\backend\\scripts\\start-api.ps1" $scriptArgs
            }
            "frontend" {
                Invoke-TerraScript "..\\..\\frontend\\scripts\\command-center.ps1" $scriptArgs
            }
            default {
                Show-Usage
                exit 1
            }
        }
    }
    default {
        Show-Usage
        exit 1
    }
}
