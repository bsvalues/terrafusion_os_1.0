cd "C:\Users\bsval\terrafusion_os_1.0\backend"
$file = "TerraFusion.AI\Hubs\NotebookHub.cs"
$content = Get-Content $file -Raw
$content = $content -replace 'types;', 'types'
Set-Content $file $content -NoNewline
dotnet build TerraFusion.sln --no-restore 2>&1 | Select-String "Build succeeded|Build FAILED"
