@echo off 
echo Deploying complete TerraFusion package to F: drive... 
if not exist "F:\" echo ERROR: F: drive not found && pause && exit /b 1 
xcopy "*" "F:\TerraFusion_Complete\" /E /I /H /Y 
echo Deployment complete! 
