#!/bin/bash

# LangChain聊天应用部署脚本
# 使用方法: ./deploy.sh [domain] [email]

set -e

DOMAIN=${1:-"yourdomain.com"}
EMAIL=${2:-"your@email.com"}

echo "🚀 开始部署 LangChain 聊天应用..."
echo "域名: $DOMAIN"
echo "邮箱: $EMAIL"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "📝 创建环境变量文件..."
    cp env.example .env
    echo "⚠️  请编辑 .env 文件，填入您的 API 密钥和配置"
    echo "⚠️  配置完成后，请重新运行此脚本"
    exit 1
fi

# 更新配置文件中的域名
echo "🔧 更新配置文件..."
sed -i "s/yourdomain.com/$DOMAIN/g" docker-compose.yml
sed -i "s/yourdomain.com/$DOMAIN/g" nginx/default.conf
sed -i "s/your@email.com/$EMAIL/g" docker-compose.yml

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs uploads certbot/conf certbot/www

# 构建和启动服务
echo "🏗️  构建应用镜像..."
docker-compose build

echo "🚀 启动服务..."
docker-compose up -d nginx redis prometheus grafana

# 等待nginx启动
echo "⏳ 等待服务启动..."
sleep 10

# 获取SSL证书
echo "🔒 获取SSL证书..."
docker-compose run --rm certbot

# 启动主应用
echo "🚀 启动主应用..."
docker-compose up -d app

# 等待应用启动
echo "⏳ 等待应用启动..."
sleep 30

# 健康检查
echo "🔍 检查服务状态..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ 应用健康检查通过"
else
    echo "❌ 应用健康检查失败"
    docker-compose logs app
    exit 1
fi

echo "🎉 部署完成！"
echo ""
echo "📋 部署信息:"
echo "🌐 应用地址: https://$DOMAIN"
echo "📊 监控地址: http://$DOMAIN:3001 (Grafana, 用户名: admin, 密码: admin123)"
echo "📈 指标地址: http://$DOMAIN:9090 (Prometheus)"
echo ""
echo "📝 管理命令:"
echo "  查看日志: docker-compose logs -f app"
echo "  重启应用: docker-compose restart app"
echo "  停止应用: docker-compose down"
echo "  更新应用: git pull && docker-compose build && docker-compose up -d"
echo ""
echo "⚠️  重要提醒:"
echo "  1. 请确保防火墙开放 80、443、3001、9090 端口"
echo "  2. 请定期备份 .env 文件和 logs、uploads 目录"
echo "  3. 建议定期更新 SSL 证书: docker-compose run --rm certbot renew"
