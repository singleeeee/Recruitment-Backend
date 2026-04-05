# ---- 构建阶段 ----
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖（优先复制 lock 文件利用缓存）
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# 生成 Prisma Client
RUN npx prisma generate

# 复制源码并构建
COPY . .
RUN npm run build

# ---- 运行阶段 ----
FROM node:20-alpine AS runner

WORKDIR /app

# 只安装生产依赖
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 创建上传目录
RUN mkdir -p uploads

EXPOSE 3001

# 启动：先执行数据库迁移，再启动服务
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
