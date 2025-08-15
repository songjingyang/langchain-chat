# 多阶段构建 - 前端构建阶段
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./
RUN npm ci --only=production

# 复制前端源码并构建
COPY frontend/ ./
RUN npm run build

# 后端运行阶段
FROM node:18-alpine AS production

# 安装必要的系统依赖
RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# 复制后端依赖文件
COPY backend/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 复制后端源码
COPY backend/ ./

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/dist ./public

# 创建必要的目录
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs /app

# 切换到非root用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# 使用dumb-init启动应用
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
