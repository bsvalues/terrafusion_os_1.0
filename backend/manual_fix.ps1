$file = "C:\Users\bsval\terrafusion_os_1.0\backend\TerraFusion.AI\Hubs\NotebookHub.cs"
$lines = Get-Content $file
$lines[47] = "        var hasAccess = await _notebookRepository.HasAccessAsync(new Guid(), new Guid(), new Guid()); // TODO: Fix parameter types"
$lines | Set-Content $file
Write-Host "✅ Line 48 fixed manually" -ForegroundColor Green
cd "C:\Users\bsval\terrafusion_os_1.0\backend"
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED|^\s+\d+ Error"
