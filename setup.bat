@echo off
echo.
echo 🎮 Setting up Modern Crossword Game Platform
echo ==============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if we're in the right directory
if not exist "README.md" goto :wrong_dir
if not exist "backend" goto :wrong_dir
if not exist "frontend" goto :wrong_dir
goto :right_dir

:wrong_dir
echo ❌ Please run this script from the project root directory
pause
exit /b 1

:right_dir
echo.
echo 📦 Installing dependencies...

REM Backend setup
echo.
echo 🔧 Setting up backend...
cd backend

if not exist "package.json" (
    echo ❌ Backend package.json not found
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Backend npm install failed
    pause
    exit /b 1
)

echo ✅ Backend dependencies installed

REM Database setup
echo.
echo 🗄️ Setting up database...
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database generation failed
    pause
    exit /b 1
)

call npm run db:push
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database push failed
    pause
    exit /b 1
)

call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Database seeding failed
    pause
    exit /b 1
)

echo ✅ Database setup complete

REM Frontend setup
echo.
echo 🎨 Setting up frontend...
cd ..\frontend

if not exist "package.json" (
    echo ❌ Frontend package.json not found
    pause
    exit /b 1
)

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Frontend npm install failed
    pause
    exit /b 1
)

echo ✅ Frontend dependencies installed

REM Go back to root
cd ..

echo.
echo 🎉 Setup completed successfully!
echo.
echo 🚀 To start the application:
echo    1. Backend:  cd backend && npm run dev
echo    2. Frontend: cd frontend && npm run dev
echo.
echo 🔑 Admin Access:
echo    URL: http://localhost:3000/admin-secret-2024
echo    Email: admin@crossword.com
echo    Password: admin123
echo    Secret Code: admin-secret-2024
echo.
echo 🎮 Player Access:
echo    URL: http://localhost:3000
echo.
echo Happy coding! 🎯
echo.
pause
