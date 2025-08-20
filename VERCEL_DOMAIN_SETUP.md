# 🌐 Vercel自定义域名配置完整指南

## 📋 **目录**
1. [快速开始](#快速开始)
2. [手动配置步骤](#手动配置步骤)
3. [自动化脚本使用](#自动化脚本使用)
4. [DNS配置详解](#dns配置详解)
5. [验证和故障排除](#验证和故障排除)
6. [常见问题解答](#常见问题解答)

## 🚀 **快速开始**

### 前置条件
- ✅ 已安装 [Vercel CLI](https://vercel.com/cli)
- ✅ 已登录Vercel账号
- ✅ 拥有要配置的域名
- ✅ 可以修改域名的DNS设置

### 一键配置（推荐）
```bash
# 1. 给脚本执行权限
chmod +x scripts/setup-domain.sh

# 2. 运行配置脚本
./scripts/setup-domain.sh your-domain.com

# 3. 按照提示配置DNS记录

# 4. 验证配置
./scripts/setup-domain.sh your-domain.com --verify
```

## 🛠 **手动配置步骤**

### 步骤1：Vercel控制台配置

#### 1.1 登录Vercel
```bash
vercel login
```

#### 1.2 添加域名
```bash
# 方法1: 使用CLI
vercel domains add your-domain.com your-project-name

# 方法2: 通过Web界面
# 访问 https://vercel.com/dashboard
# 选择项目 → Settings → Domains → Add Domain
```

#### 1.3 获取DNS配置信息
添加域名后，Vercel会显示需要配置的DNS记录。

### 步骤2：DNS配置

#### 2.1 根域名配置（example.com）
在您的域名注册商处添加以下记录：

```
类型: A
名称: @ (或留空)
值: 76.76.19.19
TTL: 3600

类型: A
名称: @ (或留空)  
值: 76.223.126.88
TTL: 3600
```

#### 2.2 www子域名配置（推荐同时配置）
```
类型: CNAME
名称: www
值: cname.vercel-dns.com
TTL: 3600
```

#### 2.3 自定义子域名配置（chat.example.com）
```
类型: CNAME
名称: chat
值: cname.vercel-dns.com
TTL: 3600
```

### 步骤3：等待DNS生效
- ⏱️ **生效时间**：几分钟到几小时
- 🔍 **检查方法**：使用 `nslookup your-domain.com`

## 🤖 **自动化脚本使用**

### 脚本1：完整配置工具
```bash
# 使用Node.js脚本（功能最全）
node scripts/vercel-domain-setup.js your-domain.com

# 验证配置
node scripts/vercel-domain-setup.js your-domain.com --verify
```

### 脚本2：Shell脚本（简单快速）
```bash
# 配置域名
./scripts/setup-domain.sh your-domain.com

# 验证配置
./scripts/setup-domain.sh your-domain.com --verify
```

### 脚本3：专业验证工具
```bash
# 全面验证域名配置
node scripts/verify-domain.js your-domain.com
```

## 🌐 **DNS配置详解**

### 主要DNS记录类型

#### A记录（Address Record）
- **用途**：将域名指向IP地址
- **适用**：根域名（example.com）
- **Vercel IP**：76.76.19.19, 76.223.126.88

#### CNAME记录（Canonical Name）
- **用途**：将域名指向另一个域名
- **适用**：子域名（www.example.com, api.example.com）
- **Vercel CNAME**：cname.vercel-dns.com

### 不同域名注册商配置示例

#### Cloudflare
```
Type: A
Name: @
Content: 76.76.19.19
TTL: Auto

Type: A
Name: @
Content: 76.223.126.88
TTL: Auto

Type: CNAME
Name: www
Content: cname.vercel-dns.com
TTL: Auto
```

#### Namecheap
```
Type: A Record
Host: @
Value: 76.76.19.19
TTL: Automatic

Type: A Record
Host: @
Value: 76.223.126.88
TTL: Automatic

Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

#### GoDaddy
```
Type: A
Name: @
Value: 76.76.19.19
TTL: 1 Hour

Type: A
Name: @
Value: 76.223.126.88
TTL: 1 Hour

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 1 Hour
```

## 🔍 **验证和故障排除**

### 验证命令

#### DNS解析检查
```bash
# 检查A记录
nslookup your-domain.com

# 检查CNAME记录
nslookup www.your-domain.com

# 详细DNS信息
dig your-domain.com

# 追踪DNS解析路径
dig +trace your-domain.com
```

#### HTTP访问检查
```bash
# 检查HTTP状态
curl -I https://your-domain.com

# 检查重定向
curl -L -I https://your-domain.com

# 检查SSL证书
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

#### Vercel状态检查
```bash
# 查看域名列表
vercel domains ls

# 查看项目信息
vercel ls

# 查看部署状态
vercel inspect your-domain.com
```

### 常见问题诊断

#### 问题1：DNS解析失败
```bash
# 症状：nslookup返回错误
# 原因：DNS记录未配置或未生效
# 解决：检查DNS配置，等待生效时间

# 检查命令
nslookup your-domain.com 8.8.8.8
```

#### 问题2：SSL证书错误
```bash
# 症状：HTTPS访问失败
# 原因：SSL证书未生成或配置错误
# 解决：等待Vercel自动生成证书（通常几分钟）

# 检查命令
curl -I https://your-domain.com
```

#### 问题3：404错误
```bash
# 症状：域名可访问但显示404
# 原因：域名未正确关联到项目
# 解决：检查Vercel项目配置

# 检查命令
vercel domains ls
vercel inspect your-domain.com
```

## ❓ **常见问题解答**

### Q1: DNS记录多久生效？
**A**: 通常几分钟到几小时，最长可能需要48小时。可以使用不同的DNS服务器测试：
```bash
nslookup your-domain.com 8.8.8.8      # Google DNS
nslookup your-domain.com 1.1.1.1      # Cloudflare DNS
```

### Q2: 可以同时配置多个域名吗？
**A**: 可以，Vercel支持为一个项目配置多个域名：
```bash
vercel domains add domain1.com your-project
vercel domains add domain2.com your-project
vercel domains add www.domain1.com your-project
```

### Q3: 如何配置子域名？
**A**: 子域名使用CNAME记录：
```bash
# 添加子域名
vercel domains add api.your-domain.com your-project

# DNS配置
Type: CNAME
Name: api
Value: cname.vercel-dns.com
```

### Q4: SSL证书如何管理？
**A**: Vercel自动管理SSL证书：
- 自动申请Let's Encrypt证书
- 自动续期
- 支持通配符证书（*.your-domain.com）

### Q5: 如何删除域名？
**A**: 使用CLI或Web界面：
```bash
vercel domains rm your-domain.com your-project
```

## 🎯 **最佳实践**

### 1. 域名配置建议
- ✅ 同时配置根域名和www子域名
- ✅ 设置合适的TTL值（3600秒推荐）
- ✅ 使用HTTPS重定向
- ✅ 配置域名监控

### 2. 安全建议
- ✅ 启用域名锁定
- ✅ 使用强密码保护域名账号
- ✅ 定期检查域名配置
- ✅ 监控SSL证书有效期

### 3. 性能优化
- ✅ 使用CDN加速
- ✅ 启用Gzip压缩
- ✅ 配置缓存策略
- ✅ 优化图片和资源

## 🔧 **环境变量配置**

创建 `.env.local` 文件：
```bash
# Vercel配置
VERCEL_PROJECT_NAME=langchain-chat
VERCEL_TEAM_ID=your-team-id
VERCEL_TOKEN=your-vercel-token

# 域名配置
CUSTOM_DOMAIN=your-domain.com
DNS_PROVIDER=cloudflare
```

## 📞 **获取帮助**

### 官方资源
- 📖 [Vercel域名文档](https://vercel.com/docs/concepts/projects/domains)
- 💬 [Vercel社区](https://github.com/vercel/vercel/discussions)
- 🎫 [Vercel支持](https://vercel.com/support)

### 脚本支持
如果脚本遇到问题，请检查：
1. Node.js版本（推荐v16+）
2. Vercel CLI版本（最新版）
3. 网络连接状态
4. 域名注册商限制

---

## ✅ **配置完成检查清单**

- [ ] Vercel CLI已安装并登录
- [ ] 域名已添加到Vercel项目
- [ ] DNS记录已正确配置
- [ ] DNS解析正常（nslookup测试）
- [ ] HTTPS访问正常（curl测试）
- [ ] SSL证书有效
- [ ] 项目正常部署和访问

**🎉 恭喜！您的自定义域名配置完成！**
