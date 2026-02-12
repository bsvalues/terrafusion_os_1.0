@echo off
REM Visual Progress Bar Function
REM Usage: call SHOW_PROGRESS.bat "Operation Name" duration_seconds

set OPERATION_NAME=%~1
set DURATION=%~2

if "%OPERATION_NAME%"=="" set OPERATION_NAME=Processing
if "%DURATION%"=="" set DURATION=30

echo.
echo 🔄 %OPERATION_NAME%...
echo.

set /a STEPS=%DURATION%
set /a CURRENT=0

:PROGRESS_LOOP
set /a CURRENT+=1
set /a PERCENT=(%CURRENT% * 100) / %STEPS%

REM Create progress bar
set PROGRESS_BAR=
set /a FILLED=(%CURRENT% * 50) / %STEPS%
set /a EMPTY=50 - %FILLED%

for /l %%i in (1,1,%FILLED%) do set PROGRESS_BAR=!PROGRESS_BAR!█
for /l %%i in (1,1,%EMPTY%) do set PROGRESS_BAR=!PROGRESS_BAR!░

REM Display progress
echo [%PROGRESS_BAR%] %PERCENT%%%
echo %OPERATION_NAME% in progress... (%CURRENT%/%STEPS%)

if %CURRENT% LSS %STEPS% (
    timeout /t 1 /nobreak >nul
    goto PROGRESS_LOOP
)

echo.
echo ✅ %OPERATION_NAME% completed!
echo. 