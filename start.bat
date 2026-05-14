@echo off
echo ====================================================
echo Starting The Gathering Website (Local Mode)
echo ====================================================
echo.
echo Closing any stuck background processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Starting your Node.js Backend...
echo (Your backend is now running using your LOCAL database!)
echo.
echo Frontend will be available at: http://localhost:8080/index.html
echo.
set USE_LOCAL_DB=true
cd backend && npm start
