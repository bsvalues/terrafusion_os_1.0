@echo off 
echo Stopping TerraFusion Ultimate IDE... 
taskkill /f /im "dotnet.exe" 2>nul 
taskkill /f /im "node.exe" 2>nul 
echo TerraFusion Ultimate IDE stopped. 
pause 
