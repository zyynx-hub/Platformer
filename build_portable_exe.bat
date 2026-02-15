@echo off
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
if "%PYTHON%"=="" set "PYTHON=py"

REM Offline build script (expects dependencies already installed locally):
REM py -m pip install pywebview pyinstaller
if "%UPDATE_GH_REPO%"=="" set "UPDATE_GH_REPO="
if "%UPDATE_CHANNEL%"=="" set "UPDATE_CHANNEL=stable"
if "%UPDATE_ENABLED%"=="" set "UPDATE_ENABLED=true"
set "BUILD_DIST=build\portable_out"
echo [build] UPDATE_GH_REPO=%UPDATE_GH_REPO%
echo [build] UPDATE_CHANNEL=%UPDATE_CHANNEL%
echo [build] UPDATE_ENABLED=%UPDATE_ENABLED%

"%PYTHON%" scripts\write_build_info.py
if errorlevel 1 (
  echo Failed to write build info.
  exit /b 1
)

"%PYTHON%" scripts\build_js_bundle.py
if errorlevel 1 (
  echo Failed to build JS bundle/source map.
  exit /b 1
)

"%PYTHON%" scripts\validate_assets.py
if errorlevel 1 (
  echo Asset validation failed.
  exit /b 1
)

"%PYTHON%" scripts\cleanup_backups.py

"%PYTHON%" -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --onefile ^
  --windowed ^
  --name "AnimePlatformer" ^
  --distpath "%BUILD_DIST%" ^
  --workpath "build" ^
  --specpath "." ^
  --add-data "assets;assets" ^
  --add-data "js;js" ^
  --add-data "index.html;." ^
  desktop_launcher.py

if errorlevel 1 (
  echo Build failed.
  exit /b 1
)

set "NEW_EXE=%BUILD_DIST%\AnimePlatformer.exe"
if not exist "%NEW_EXE%" (
  echo Built EXE not found: %NEW_EXE%
  exit /b 1
)

taskkill /F /IM AnimePlatformer.exe /T >nul 2>&1
timeout /t 1 /nobreak >nul

del /q "%SCRIPT_DIR%*.bak" >nul 2>&1
del /q "%BUILD_DIST%\*.bak" >nul 2>&1
copy /Y "%NEW_EXE%" "%~dp0AnimePlatformer.exe" >nul 2>&1
if errorlevel 1 (
  echo [build] Failed to replace root AnimePlatformer.exe.
  echo [build] Fresh build is available at: %NEW_EXE%
) else (
  echo [build] Root EXE updated: %~dp0AnimePlatformer.exe
)

if "%UPDATE_GH_REPO%"=="" goto :after_publish
if "%GH_TOKEN%"=="" if "%GITHUB_TOKEN%"=="" (
  echo [build] No GH_TOKEN/GITHUB_TOKEN set; skipping GitHub release publish.
  goto :after_publish
)

"%PYTHON%" scripts\publish_github_release.py --repo "%UPDATE_GH_REPO%" --channel "%UPDATE_CHANNEL%" --exe "%NEW_EXE%"
if errorlevel 1 (
  echo [build] GitHub publish failed.
  exit /b 1
)

:after_publish
echo.
echo Build complete.
echo Plug-and-play EXE:
echo %NEW_EXE%
echo.
pause
