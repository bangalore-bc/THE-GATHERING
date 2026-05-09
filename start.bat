@echo off
echo ====================================================
echo Starting The Gathering Website
echo ====================================================
echo.
echo Closing any stuck background processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1

echo Starting your Node.js Backend...
echo (Your backend is now connected directly to your LIVE Supabase Database!)
echo.
echo Frontend will be available at: http://localhost:8080/eg.html
echo.
cd backend && npm start
