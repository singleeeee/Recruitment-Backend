@echo off
echo 🚀 Setting up Recruitment Backend...

REM 检查 Docker 是否运行
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

echo 📦 Starting Docker containers...
docker-compose up -d postgres redis

echo ⏳ Waiting for database to be ready...
:waitloop
docker-compose exec -T postgres pg_isready -U admin >nul 2>&1
if %errorlevel% neq 0 (
    echo Waiting for PostgreSQL...
    timeout /t 2 /nobreak >nul
    goto waitloop
)

echo ✅ Database is ready!

echo 📦 Installing dependencies...
call pnpm install

echo 🗄️  Generating Prisma Client...
call pnpm prisma:generate

echo 🔄 Running database migrations...
call pnpm prisma:migrate

echo ✨ Setup completed successfully!
echo.
echo 📝 Next steps:
echo   1. Run 'pnpm start:dev' to start the development server
echo   2. Visit http://localhost:3001/api/v1/health to check the API
