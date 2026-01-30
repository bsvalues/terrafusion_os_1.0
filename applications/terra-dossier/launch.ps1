$env:Path += ";$home\.deno\bin"
$env:DENO_NO_PACKAGE_JSON = 1
cd $PSScriptRoot
Write-Host "Starting Deno Vite Server..."
deno task dev