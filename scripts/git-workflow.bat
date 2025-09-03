@echo off
echo 🚀 TerraFusion Git Workflow Helper
echo.

:menu
echo Choose an action:
echo 1. Start Day (get latest changes)
echo 2. Save Work (commit and push)
echo 3. Check Status
echo 4. Undo Last Change
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto start_day
if "%choice%"=="2" goto save_work
if "%choice%"=="3" goto check_status
if "%choice%"=="4" goto undo_change
if "%choice%"=="5" goto exit
echo Invalid choice. Please try again.
goto menu

:start_day
echo.
echo 📥 Getting latest changes from GitHub...
git pull origin master
echo ✅ Day started! You have the latest code.
pause
goto menu

:save_work
echo.
echo 💾 Saving your work to GitHub...
echo.
set /p message="What did you work on today? (describe your changes): "
git add .
git commit -m "%message%"
git push origin master
echo ✅ Work saved to GitHub!
pause
goto menu

:check_status
echo.
echo 📊 Checking your repository status...
git status
echo.
echo 📈 Recent commits:
git log --oneline -5
pause
goto menu

:undo_change
echo.
echo ⚠️ WARNING: This will undo your last change!
echo Are you sure? (y/n)
set /p confirm="Enter y to confirm: "
if /i "%confirm%"=="y" (
    git reset --hard HEAD~1
    echo ✅ Last change undone!
) else (
    echo ❌ No changes made.
)
pause
goto menu

:exit
echo 👋 Happy coding! Remember to save your work regularly.
exit
