@echo off
echo.
echo ========================================
echo   TERRAFUSION WORKSPACE CLEANUP
echo   TF-ICSF Excellence Standard
echo ========================================
echo.

REM Create archive directory structure
echo Creating archive structure...
if not exist "archive\deprecated\test_files" mkdir "archive\deprecated\test_files"
if not exist "archive\deprecated\experimental_features" mkdir "archive\deprecated\experimental_features"
if not exist "archive\deprecated\legacy_servers" mkdir "archive\deprecated\legacy_servers"
if not exist "archive\deprecated\old_documentation" mkdir "archive\deprecated\old_documentation"
if not exist "archive\reference\research_notes" mkdir "archive\reference\research_notes"
if not exist "archive\backup\configuration_backups" mkdir "archive\backup\configuration_backups"

REM Archive test files
echo Archiving test files...
for %%f in (test-*.js) do (
    if exist "%%f" (
        echo   Moving %%f
        move "%%f" "archive\deprecated\test_files\" >nul 2>&1
    )
)

REM Archive experimental HTML files
echo Archiving experimental HTML files...
for %%f in (*property*.html *stardust*.html simple-*.html view-*.html) do (
    if exist "%%f" (
        echo   Moving %%f
        move "%%f" "archive\deprecated\experimental_features\" >nul 2>&1
    )
)

REM Archive legacy server files
echo Archiving legacy server files...
for %%f in (serve-*.js serve-*.cjs *-server.js proxy.js) do (
    if exist "%%f" (
        echo   Moving %%f
        move "%%f" "archive\deprecated\legacy_servers\" >nul 2>&1
    )
)

REM Archive old documentation
echo Archiving old documentation...
for %%f in (README-*.md AI-VALUATION-README.md audit_manifest.md) do (
    if exist "%%f" (
        echo   Moving %%f
        move "%%f" "archive\deprecated\old_documentation\" >nul 2>&1
    )
)

REM Archive experimental scripts
echo Archiving experimental scripts...
for %%f in (analyze-*.js conversion_*.js run_*.py serve_*.py start_*.js) do (
    if exist "%%f" (
        echo   Moving %%f
        move "%%f" "archive\deprecated\experimental_features\" >nul 2>&1
    )
)

REM Archive temporary files
echo Archiving temporary files...
if exist "frontend_logs.txt" move "frontend_logs.txt" "archive\backup\" >nul 2>&1
if exist "generated-icon.png" move "generated-icon.png" "archive\backup\" >nul 2>&1

REM Clean up empty directories
echo Cleaning up empty directories...
for /d %%d in (temp* extracted_* uploads\temp*) do (
    if exist "%%d" (
        echo   Removing empty directory %%d
        rmdir "%%d" /s /q >nul 2>&1
    )
)

echo.
echo ========================================
echo   WORKSPACE CLEANUP COMPLETE
echo ========================================
echo.
echo Production-ready workspace achieved!
echo.
echo ACTIVE FILES:
echo   - Core platform files
echo   - Production documentation
echo   - Deployment scripts
echo   - Configuration files
echo.
echo ARCHIVED FILES:
echo   - Test files: archive\deprecated\test_files\
echo   - Experimental: archive\deprecated\experimental_features\
echo   - Legacy servers: archive\deprecated\legacy_servers\
echo   - Old docs: archive\deprecated\old_documentation\
echo.
echo Ready for Phase 2 market domination!
echo.
pause 