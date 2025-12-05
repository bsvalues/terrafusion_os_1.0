param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

switch ($Command.ToLower()) {
    "backend" {
        $script = Join-Path $PSScriptRoot "..\\..\\backend\\scripts\\start-api.ps1"
        & $script @Args
    }
    "run" {
        if (-not $Args -or $Args[0].ToLower() -ne "backend") {
            Write-Error "Usage: ./terra.ps1 run backend [args]"
            exit 1
        }

        $script = Join-Path $PSScriptRoot "..\\..\\backend\\scripts\\start-api.ps1"
        $scriptArgs = @()
        if ($Args.Length -gt 1) {
            $scriptArgs = $Args[1..($Args.Length - 1)]
        }

        & $script @scriptArgs
    }
    default {
        Write-Error "Unknown command '$Command'."
        exit 1
    }
}
