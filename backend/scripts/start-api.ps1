$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Resolve-Path "$scriptDir/../.."

Set-Location "$rootDir/backend"

dotnet restore TerraFusion.sln
dotnet run --project src/TerraFusion.API/TerraFusion.API.csproj
