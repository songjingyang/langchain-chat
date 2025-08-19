# LangChain Chat - 企业级 AI 聊天应用

基于 Next.js 14 和 LangChain.js 构建的现代化 AI 聊天应用，支持多种 AI 模型和 SSE 流式响应。

## ✨ 功能特性

- 🤖 **多 AI 模型支持**: OpenAI GPT、Groq Llama、Google Gemini
- 💬 **实时流式对话**: 基于 SSE 的流式响应体验
- 📱 **响应式设计**: 完美适配桌面端和移动端
- 🌙 **深色模式**: 支持浅色/深色主题切换
- 💾 **会话管理**: 本地存储聊天历史，支持多会话
- 🔍 **智能搜索**: 快速搜索历史对话内容
- 📤 **数据导出**: 支持导出聊天记录为 JSON 格式
- ⚡ **高性能**: Edge Runtime 优化，快速响应

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装步骤

1. **安装依赖**

```bash
npm install
```

2. **配置环境变量**

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，添加您的 API 密钥：

```env
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
```

3. **启动开发服务器**

```bash
npm run dev
```

4. **访问应用**
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🛠 技术栈

- **前端框架**: Next.js 14 (App Router)
- **AI 框架**: LangChain.js
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **部署**: Vercel
- **AI 模型**:
  - OpenAI GPT-4o Mini
  - Groq Llama 3.1 8B
  - Google Gemini 1.5 Flash

## 🚀 部署到 Vercel

1. **推送代码到 GitHub**

2. **连接 Vercel**

   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 导入 GitHub 仓库

3. **配置环境变量**
   在 Vercel 项目设置中添加环境变量：

   - `OPENAI_API_KEY`
   - `GROQ_API_KEY`
   - `GOOGLE_API_KEY`

4. **部署**
   Vercel 会自动构建和部署您的应用

## 📝 使用说明

1. **选择 AI 模型**: 在侧边栏选择您想要使用的 AI 模型
2. **开始对话**: 在输入框中输入您的问题
3. **查看响应**: AI 会以流式方式实时回复
4. **管理会话**: 可以创建新会话、重命名或删除会话
5. **搜索历史**: 使用搜索功能快速找到历史对话
6. **导出数据**: 点击导出按钮下载聊天记录
