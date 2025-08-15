# LangChain 聊天应用部署指南

## 快速开始

### 方式一：快速部署（推荐用于开发/测试）

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd langchain-chat-app

# 运行快速部署脚本
./quick-deploy.sh
```

这将在本地启动开发环境，应用将在 http://localhost:8080 访问。

### 方式二：生产环境部署

```bash
# 1. 配置域名和SSL
./deploy.sh yourdomain.com your@email.com

# 2. 或者手动部署
cp env.example .env
# 编辑 .env 文件，填入您的配置
docker-compose up -d
```

## 环境变量配置

### 必需的 API 密钥

在 `.env` 文件中配置以下 API 密钥：

```bash
# OpenAI API (GPT模型)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx

# Anthropic API (Claude模型)
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx

# Google AI API (Gemini模型)
GOOGLE_API_KEY=AIxxxxxxxxxxxxxxxxxxxxx

# Groq API (Llama/Mixtral模型)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx
```

### 生产环境配置

```bash
# 服务器配置
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# 安全配置
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-secure-random-secret-here
SESSION_SECRET=another-secure-secret-here

# 限流配置
RATE_LIMIT_WINDOW_MS=900000  # 15分钟
RATE_LIMIT_MAX_REQUESTS=100  # 每IP限制100请求
```

## 部署架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Node.js App   │    │   Monitoring    │
│   (SSL/Gzip)    │────│   (Express)     │────│ (Prometheus)    │
│   Port 80/443   │    │   Port 3000     │    │   Port 9090     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │              ┌─────────────────┐
         │                       │              │     Grafana     │
         │                       │              │   (Dashboard)   │
         │                       │              │    Port 3001    │
         │                       │              └─────────────────┘
         │              ┌─────────────────┐
         │              │      Redis      │
         │              │   (Session)     │
         │              │    Port 6379    │
         │              └─────────────────┘
```

## 部署步骤详解

### 1. 系统要求

- Linux 服务器 (Ubuntu 20.04+ 推荐)
- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB RAM, 1 CPU
- 10GB 可用磁盘空间

### 2. 安装 Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 域名和 DNS 配置

1. 购买域名
2. 配置 DNS A 记录指向您的服务器 IP
3. 等待 DNS 生效（通常 5-30 分钟）

### 4. 防火墙配置

```bash
# Ubuntu UFW
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 3001    # Grafana (可选)
sudo ufw allow 9090    # Prometheus (可选)
sudo ufw enable
```

### 5. 部署应用

```bash
# 克隆代码
git clone <your-repo-url>
cd langchain-chat-app

# 配置环境变量
cp env.example .env
nano .env  # 编辑配置

# 执行部署
./deploy.sh yourdomain.com your@email.com
```

## 监控和维护

### 查看应用状态

```bash
# 查看所有服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f app

# 查看nginx日志
docker-compose logs -f nginx

# 查看资源使用
docker stats
```

### 健康检查

```bash
# 应用健康检查
curl http://localhost:3000/health

# API健康检查
curl http://localhost:3000/api/health

# 监控指标
curl http://localhost:3000/metrics
```

### 监控面板

- **Grafana**: http://yourdomain.com:3001
  - 用户名: admin
  - 密码: admin123
- **Prometheus**: http://yourdomain.com:9090

### 日志管理

```bash
# 清理旧日志
docker system prune -f

# 查看日志大小
du -sh logs/

# 清理应用日志
> logs/app.log
```

## 备份和恢复

### 备份重要数据

```bash
# 创建备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# 备份环境变量
cp .env $BACKUP_DIR/

# 备份上传文件
tar -czf $BACKUP_DIR/uploads.tar.gz uploads/

# 备份日志
tar -czf $BACKUP_DIR/logs.tar.gz logs/

echo "备份完成: $BACKUP_DIR"
EOF

chmod +x backup.sh
```

### SSL 证书续期

```bash
# 手动续期
docker-compose run --rm certbot renew

# 设置自动续期
echo "0 12 * * * /usr/local/bin/docker-compose -f /path/to/langchain-chat-app/docker-compose.yml run --rm certbot renew" | sudo crontab -
```

## 性能优化

### 1. Nginx 缓存优化

编辑 `nginx/default.conf`:

```nginx
# 静态文件缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 启用Gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

### 2. Node.js 性能优化

在 `.env` 中添加:

```bash
# Node.js优化
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=16
```

### 3. 限流配置

```bash
# API限流
RATE_LIMIT_WINDOW_MS=900000  # 15分钟窗口
RATE_LIMIT_MAX_REQUESTS=100  # 每IP最多100请求
```

## 故障排除

### 常见问题

1. **应用无法启动**

   ```bash
   # 检查日志
   docker-compose logs app

   # 检查环境变量
   docker-compose exec app env | grep API_KEY
   ```

2. **SSL 证书问题**

   ```bash
   # 重新获取证书
   docker-compose run --rm certbot certonly --webroot -w /var/www/certbot --force-renewal --email your@email.com -d yourdomain.com --agree-tos
   ```

3. **内存不足**

   ```bash
   # 检查内存使用
   free -h
   docker stats

   # 增加swap
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **API 调用失败**
   - 检查 API 密钥是否正确
   - 检查网络连接
   - 查看应用日志了解具体错误

### 联系支持

如果遇到问题，请提供以下信息：

- 错误日志: `docker-compose logs app`
- 系统信息: `uname -a && docker --version`
- 配置信息: `.env` 文件（隐藏敏感信息）
