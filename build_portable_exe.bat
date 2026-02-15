@echo off
setlocal
cd /d "%~dp0"

REM Offline build script (expects dependencies already installed locally):
REM py -m pip install pywebview pyinstaller
if "%UPDATE_GH_REPO%"=="" set "UPDATE_GH_REPO="
if "%UPDATE_CHANNEL%"=="" set "UPDATE_CHANNEL=stable"
if "%UPDATE_ENABLED%"=="" set "UPDATE_ENABLED=true"
set "BUILD_DIST=build\portable_out"
echo [build] UPDATE_GH_REPO=%UPDATE_GH_REPO%
echo [build] UPDATE_CHANNEL=%UPDATE_CHANNEL%
echo [build] UPDATE_ENABLED=%UPDATE_ENABLED%

py scripts\write_build_info.py
if errorlevel 1 (
  echo Failed to write build info.
  exit /b 1
)

py -m PyInstaller ^
  --noconfirm ^
  --clean ^
  --onefile ^
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

copy /Y "%NEW_EXE%" "%~dp0AnimePlatformer.exe" >nul 2>&1
if errorlevel 1 (
  echo [build] Root EXE is in use; kept existing AnimePlatformer.exe running.
  echo [build] Fresh build is still available at: %NEW_EXE%
) else (
  echo [build] Root EXE updated: %~dp0AnimePlatformer.exe
)

if "%UPDATE_GH_REPO%"=="" goto :after_publish
if "%GH_TOKEN%"=="" if "%GITHUB_TOKEN%"=="" (
  echo [build] No GH_TOKEN/GITHUB_TOKEN set; skipping GitHub release publish.
  goto :after_publish
)

py scripts\publish_github_release.py --repo "%UPDATE_GH_REPO%" --channel "%UPDATE_CHANNEL%" --exe "%NEW_EXE%"
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
