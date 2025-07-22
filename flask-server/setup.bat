@echo off
echo 🚀 Setting up Tucan Test Flask Server...

REM Check if Python is installed
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

echo ✅ Python found

REM Check if pip is available
pip --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ pip is not available
    pause
    exit /b 1
)

echo ✅ pip found

REM Install Python dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

if %ERRORLEVEL% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Initialize database
echo 🗄️ Initializing database...
python init_db.py

echo 🎉 Setup complete!
echo.
echo To start the server, run:
echo   python server.py
echo.
echo The API will be available at: http://localhost:5000
pause
