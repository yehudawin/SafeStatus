@echo off
echo ====================================
echo SafeStatus - Build for Google Play Store
echo ====================================

echo.
echo Step 1: Building web assets...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Syncing with Capacitor...
call npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Opening Android Studio...
echo Please complete the following steps in Android Studio:
echo.
echo 1. Build ^> Clean Project
echo 2. Build ^> Rebuild Project  
echo 3. Build ^> Build Bundle(s) / APK(s) ^> Build Bundle(s)
echo.
echo The AAB file will be created in:
echo android\app\build\outputs\bundle\release\app-release.aab
echo.

call npx cap open android

echo.
echo Build script completed!
echo.
echo Next steps:
echo 1. Complete the build in Android Studio
echo 2. Sign the AAB with your keystore
echo 3. Upload to Google Play Console
echo.
pause 