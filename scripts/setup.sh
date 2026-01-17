#!/bin/bash

echo "🚀 Setting up Recruitment Backend..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "📦 Starting Docker containers..."
docker-compose up -d postgres redis

echo "⏳ Waiting for database to be ready..."
until docker-compose exec -T postgres pg_isready -U admin > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Database is ready!"

echo "📦 Installing dependencies..."
pnpm install

echo "🗄️  Generating Prisma Client..."
pnpm prisma:generate

echo "🔄 Running database migrations..."
pnpm prisma:migrate

echo "✨ Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "  1. Run 'pnpm start:dev' to start the development server"
echo "  2. Visit http://localhost:3001/api/v1/health to check the API"
