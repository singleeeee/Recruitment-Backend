# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装 OpenSSL（解决 Prisma libssl 检测失败）
RUN apk add --no-cache openssl

# 安装依赖（优先复制 lock 文件利用缓存）
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# 生成 Prisma Client（generate 不需要真实数据库连接，传入占位 URL 避免报错）
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# 复制源码并构建
COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 OpenSSL（运行时同样需要）
RUN apk add --no-cache openssl

# 只安装生产依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

# 复制构建产物和启动脚本
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts
RUN chmod +x scripts/start.sh

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3001

# 启动：执行 start.sh（迁移 → seed检查 → 启动服务）
CMD ["sh", "scripts/start.sh"]
