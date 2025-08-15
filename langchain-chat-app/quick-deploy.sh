#!/bin/bash

# 快速部署脚本 - 适用于开发/测试环境
set -e

echo "🚀 快速部署 LangChain 聊天应用 (开发模式)..."

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 请先安装 Docker"
    exit 1
fi

# 检查环境变量
if [ ! -f .env ]; then
    echo "📝 创建开发环境变量..."
    cat > .env << 'EOF'
# 开发环境配置
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# API Keys - 请替换为您的实际密钥
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here

# 开发环境CORS
CORS_ORIGIN=http://localhost,http://localhost:3000,http://localhost:5173

# 日志配置
LOG_LEVEL=debug
EOF
    echo "⚠️  已创建基础配置文件 .env"
    echo "⚠️  请编辑 .env 文件，填入您的 API 密钥"
    read -p "是否现在编辑配置文件？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# 创建简化的docker-compose文件
echo "📝 创建开发环境Docker配置..."
cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  app:
    build: .
    container_name: langchain-chat-dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./uploads:/app/uploads
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: langchain-nginx-dev
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./nginx/dev.conf:/etc/nginx/conf.d/default.conf:ro
    networks:
      - app-network
    depends_on:
      - app

networks:
  app-network:
    driver: bridge
EOF

# 创建开发环境nginx配置
mkdir -p nginx
cat > nginx/dev.conf << 'EOF'
server {
    listen 80;
    server_name localhost;

    # API代理
    location /api/ {
        proxy_pass http://app:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /health {
        proxy_pass http://app:3000/health;
        access_log off;
    }

    # 前端文件
    location / {
        proxy_pass http://app:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 创建目录
mkdir -p logs uploads

echo "🏗️  构建应用..."
docker-compose -f docker-compose.dev.yml build

echo "🚀 启动服务..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ 等待服务启动..."
sleep 20

# 健康检查
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 应用启动成功！"
    echo ""
    echo "🌐 访问地址:"
    echo "  应用地址: http://localhost:8080"
    echo "  API地址: http://localhost:3000"
    echo "  健康检查: http://localhost:3000/health"
    echo ""
    echo "📝 管理命令:"
    echo "  查看日志: docker-compose -f docker-compose.dev.yml logs -f"
    echo "  重启: docker-compose -f docker-compose.dev.yml restart"
    echo "  停止: docker-compose -f docker-compose.dev.yml down"
else
    echo "❌ 服务启动失败，查看日志:"
    docker-compose -f docker-compose.dev.yml logs app
fi
