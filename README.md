# LangChain 翻译应用

基于 [LangChain.js 官方教程](https://js.langchain.com/docs/tutorials/llm_chain) 构建的简单翻译应用。

## 功能特性

- 🌍 支持多语言翻译（英文翻译为其他语言）
- 🚀 使用 Groq 的 Llama 模型进行快速推理
- 📝 支持提示模板和直接消息两种方式
- 🔄 支持流式输出，实时显示翻译结果
- 📦 模块化设计，可导入到其他项目

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并填入您的 API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加您的 Groq API 密钥：

```
GROQ_API_KEY=your-groq-api-key-here
```

### 3. 运行应用

```bash
# 运行示例
npm start

# 开发模式（自动重启）
npm run dev
```

## 使用方法

### 作为模块导入

```javascript
import { translateText, translateTextStream } from './index.js';

// 基本翻译
const result = await translateText("Hello world!", "Chinese");
console.log(result); // 你好世界！

// 流式翻译
await translateTextStream("Good morning!", "Spanish");
```

### 可用函数

- `translateText(text, language)` - 基本翻译功能
- `translateTextStream(text, language)` - 流式翻译，实时输出
- `translateWithMessages(text, language)` - 使用消息直接翻译

## 项目结构

```
├── index.js          # 主应用文件
├── package.json      # 项目配置
├── .env.example      # 环境变量示例
└── README.md         # 项目说明
```

## 技术栈

- **LangChain.js** - LLM 应用开发框架
- **Groq** - 快速 LLM 推理服务
- **Node.js** - JavaScript 运行时

## 获取 API 密钥

1. 访问 [Groq Console](https://console.groq.com/)
2. 注册账户并创建 API 密钥
3. 将密钥添加到 `.env` 文件中

## 许可证

MIT License
