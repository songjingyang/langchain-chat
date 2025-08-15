# LangChain 智能对话助手

基于 LangChain.js 和 Element Plus X 构建的现代化智能对话应用，类似豆包的交互体验。

## ✨ 功能特性

### 🤖 智能对话
- 支持多种大语言模型（OpenAI、Anthropic、Groq、Google Gemini 等）
- 流式响应，实时显示AI回复过程
- 对话历史管理，支持多轮对话
- 自定义系统提示和参数调节

### 📚 文档问答
- 支持多种文档格式（PDF、TXT、CSV、Markdown）
- 智能文档分割和向量化
- 基于文档内容的精准问答
- 语义搜索和相关性排序

### 🛠️ 工具调用
- 内置多种实用工具（计算器、时间、文本处理等）
- 支持自定义工具创建
- AI代理自动选择和调用工具
- 复杂任务的自动化处理

### 🎨 现代化界面
- 基于 Element Plus X 的专业AI交互组件
- 响应式设计，支持移动端
- 打字机效果、思考状态等丰富动效
- 暗色主题支持

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装所有子项目依赖
npm run install:all
```

### 配置环境变量
```bash
# 复制后端环境变量模板
cp backend/.env.example backend/.env

# 编辑环境变量文件，添加您的API密钥
nano backend/.env
```

### API 密钥获取

| 服务商 | 注册地址 | 说明 |
|--------|----------|------|
| OpenAI | https://platform.openai.com/ | GPT-4, GPT-3.5 等模型 |
| Anthropic | https://console.anthropic.com/ | Claude 系列模型 |
| Groq | https://console.groq.com/ | 高速推理服务 |
| Google AI | https://makersuite.google.com/ | Gemini 系列模型 |
| LangSmith | https://smith.langchain.com/ | 调试和追踪服务 |

### 启动应用
```bash
# 同时启动前端和后端
npm run dev

# 或分别启动
npm run dev:backend  # 后端服务 (http://localhost:3000)
npm run dev:frontend # 前端服务 (http://localhost:5173)
```

## 📁 项目结构

```
langchain-chat-app/
├── backend/                 # Node.js 后端
│   ├── src/
│   │   ├── routes/         # API 路由
│   │   ├── config/         # 配置文件
│   │   └── server.js       # 服务器入口
│   ├── uploads/            # 文件上传目录
│   └── package.json
├── frontend/               # Vue3 前端
│   ├── src/
│   │   ├── views/          # 页面组件
│   │   ├── stores/         # 状态管理
│   │   ├── api/            # API 接口
│   │   ├── styles/         # 样式文件
│   │   └── main.js         # 应用入口
│   └── package.json
└── package.json            # 根配置文件
```

## 🔧 核心技术栈

### 后端
- **Node.js + Express** - 服务器框架
- **LangChain.js** - LLM 应用开发框架
- **WebSocket** - 实时通信
- **Multer** - 文件上传处理

### 前端
- **Vue 3** - 渐进式前端框架
- **Element Plus X** - AI 交互组件库
- **Pinia** - 状态管理
- **Vite** - 构建工具

## 📖 使用指南

### 1. 智能对话
1. 访问 `/chat` 页面
2. 选择合适的AI模型
3. 输入您的问题开始对话
4. 支持流式输出和历史记录

### 2. 文档问答
1. 访问 `/documents` 页面
2. 上传您的文档文件
3. 等待文档处理完成
4. 基于文档内容提问

### 3. 工具调用
1. 访问 `/tools` 页面
2. 选择需要的工具
3. 让AI自动调用工具完成任务
4. 支持创建自定义工具

### 4. 模型管理
1. 访问 `/models` 页面
2. 查看所有可用模型
3. 测试模型连接状态
4. 切换默认模型

## 🛠️ 开发指南

### 添加新的AI模型
1. 在 `backend/src/config/models.js` 中添加模型配置
2. 安装对应的 LangChain 集成包
3. 更新环境变量模板

### 创建自定义工具
1. 在 `backend/src/routes/tools.js` 中定义工具
2. 实现工具的执行逻辑
3. 添加工具描述和参数验证

### 扩展文档类型支持
1. 安装对应的文档解析库
2. 在 `backend/src/routes/documents.js` 中添加加载器
3. 更新文件类型过滤器

## 🔍 API 文档

### 聊天接口
- `POST /api/chat/basic` - 基础聊天
- `POST /api/chat/stream` - 流式聊天
- `POST /api/chat/conversation` - 对话聊天

### 模型接口
- `GET /api/models` - 获取所有模型
- `POST /api/models/:name/test` - 测试模型

### 文档接口
- `POST /api/documents/upload` - 上传文档
- `POST /api/documents/qa` - 文档问答

### 工具接口
- `GET /api/tools` - 获取所有工具
- `POST /api/tools/execute` - 执行工具

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [LangChain.js](https://js.langchain.com/) - 强大的LLM应用开发框架
- [Element Plus X](https://element-plus-x.com/) - 专业的AI交互组件库
- [Vue.js](https://vuejs.org/) - 渐进式前端框架

## 📞 支持

如果您在使用过程中遇到问题，请：

1. 查看 [常见问题](docs/FAQ.md)
2. 搜索 [Issues](https://github.com/your-repo/issues)
3. 创建新的 Issue 描述问题

---

⭐ 如果这个项目对您有帮助，请给我们一个星标！
