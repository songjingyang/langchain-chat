# 免费部署指南 🆓

本指南将帮助您将 LangChain 聊天应用免费部署到各大云平台。

## 🌟 推荐平台对比

| 平台        | 类型      | 优点                    | 限制                     | 推荐指数   |
| ----------- | --------- | ----------------------- | ------------------------ | ---------- |
| **Vercel**  | 全栈      | 🔥 最简单，CDN 全球加速 | 10s 函数超时，512MB 内存 | ⭐⭐⭐⭐⭐ |
| **Railway** | 容器      | 🔥 最接近生产环境       | 500 小时/月，5$/月后付费 | ⭐⭐⭐⭐⭐ |
| **Render**  | 容器      | 完整 Docker 支持        | 冷启动，512MB 内存       | ⭐⭐⭐⭐   |
| **Netlify** | 前端+函数 | 优秀的前端体验          | 函数限制较多             | ⭐⭐⭐     |

---

## 🚀 方式一：Vercel 部署（推荐）

### 步骤 1：准备代码

```bash
# 确保您的代码已推送到GitHub
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 步骤 2：部署到 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 登录
3. 点击 "New Project"
4. 选择您的仓库
5. 配置环境变量：

   - `OPENAI_API_KEY` = 您的 OpenAI 密钥
   - `ANTHROPIC_API_KEY` = 您的 Anthropic 密钥
   - `GOOGLE_API_KEY` = 您的 Google AI 密钥
   - `GROQ_API_KEY` = 您的 Groq 密钥

6. 点击 "Deploy"

✅ **完成！** 您的应用将在几分钟内部署完成，获得一个 `.vercel.app` 域名。

### Vercel 优势

- 🚀 全球 CDN 加速
- 🔄 自动部署（Git 推送即部署）
- 🆓 每月 100GB 带宽
- 📱 完美支持前端框架

---

## 🚂 方式二：Railway 部署（最像生产环境）

### 步骤 1：部署

1. 访问 [railway.app](https://railway.app)
2. 使用 GitHub 登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择您的仓库
5. Railway 会自动检测并部署

### 步骤 2：配置环境变量

在 Railway 面板中添加：

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_API_KEY`
- `GROQ_API_KEY`

✅ **完成！** Railway 会提供一个自定义域名。

### Railway 优势

- 🐳 完整 Docker 支持
- 🔄 自动重启和扩展
- 💾 持久化存储
- 🆓 每月 500 小时免费

---

## 🎨 方式三：Render 部署

### 步骤 1：创建 Web Service

1. 访问 [render.com](https://render.com)
2. 使用 GitHub 登录
3. 点击 "New +" → "Web Service"
4. 连接您的 GitHub 仓库

### 步骤 2：配置

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Environment**: `Node`

### 步骤 3：环境变量

添加 API 密钥环境变量

✅ **完成！** Render 会提供免费的 `.onrender.com` 域名。

### Render 优势

- 🐳 原生 Docker 支持
- 🔒 自动 SSL 证书
- 📊 内置监控
- 🆓 512MB 内存免费

---

## 🟢 方式四：Netlify 部署（仅前端）

**注意**: Netlify 适合纯前端部署，后端 API 需要单独部署。

### 步骤 1：前端部署

1. 访问 [netlify.com](https://netlify.com)
2. 拖拽 `frontend/dist` 文件夹到 Netlify
3. 或连接 GitHub 自动部署

### 步骤 2：后端部署

将后端部署到其他平台（Vercel Functions、Railway 等）

---

## 🔧 部署前准备

### 1. 获取 API 密钥

**OpenAI** (GPT 模型)

- 访问 [platform.openai.com](https://platform.openai.com)
- 创建 API 密钥

**Anthropic** (Claude 模型)

- 访问 [console.anthropic.com](https://console.anthropic.com)
- 创建 API 密钥

**Google AI** (Gemini 模型)

- 访问 [makersuite.google.com](https://makersuite.google.com)
- 创建 API 密钥

**Groq** (Llama/Mixtral 模型)

- 访问 [console.groq.com](https://console.groq.com)
- 创建 API 密钥

### 2. 推送代码到 GitHub

```bash
# 如果还没有Git仓库
git init
git add .
git commit -m "Initial commit"

# 创建GitHub仓库并推送
git remote add origin https://github.com/yourusername/langchain-chat-app.git
git branch -M main
git push -u origin main
```

---

## 🎯 快速选择指南

### 🔰 新手推荐

选择 **Vercel** - 最简单，点击几下就能部署

### 🚀 追求性能

选择 **Railway** - 最接近生产环境，性能最佳

### 💰 预算考虑

- **完全免费**: Vercel (有使用限制)
- **免费试用**: Railway (500 小时/月)
- **长期免费**: Render (512MB 内存限制)

### ⚡ 部署速度

1. Vercel - 2 分钟 ⚡⚡⚡
2. Railway - 5 分钟 ⚡⚡
3. Render - 10 分钟 ⚡

---

## 🛠️ 故障排除

### 常见问题

**1. 构建失败**

```bash
# 检查Node.js版本
"engines": {
  "node": "18.x"
}
```

**2. API 调用失败**

- 检查环境变量是否正确设置
- 确认 API 密钥有效
- 检查 API 配额是否用完

**3. 函数超时**

- Vercel: 检查函数是否在 10 秒内完成
- 优化 API 调用，添加超时处理

**4. 内存不足**

- 减少同时处理的请求数量
- 优化模型选择

### 调试技巧

```bash
# 本地测试
npm run build
npm start

# 查看构建日志
# 在各平台的控制台查看详细错误信息
```

---

## 🎉 部署成功后

### 测试您的应用

1. 访问部署的 URL
2. 测试聊天功能
3. 尝试不同的 AI 模型
4. 检查响应速度

### 监控和维护

- 查看平台提供的监控面板
- 设置使用量警报
- 定期检查 API 配额

### 自定义域名（可选）

大多数平台都支持绑定自定义域名：

- Vercel: 项目设置 → Domains
- Railway: 项目设置 → Networking
- Render: 项目设置 → Custom Domains

---

## 💡 优化建议

### 性能优化

- 启用 CDN 和缓存
- 压缩前端资源
- 使用更快的 AI 模型

### 成本优化

- 监控 API 使用量
- 设置合理的限流
- 选择性价比高的模型

### 用户体验

- 添加加载状态
- 实现错误处理
- 支持移动端适配

---

**🎊 恭喜！您的 LangChain 聊天应用现在已经可以在全世界访问了！**
