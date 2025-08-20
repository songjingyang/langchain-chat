// 消息类型定义
export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  model?: string;
}

// 会话类型定义
export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  model: string;
}

// AI模型提供商类型
export type ModelProvider = "openai" | "groq" | "google";

// 模型配置类型
export interface ModelConfig {
  provider: ModelProvider;
  name: string;
  displayName: string;
  maxTokens: number;
  temperature: number;
  streaming: boolean;
}

// 聊天请求类型
export interface ChatRequest {
  message: string;
  sessionId: string;
  model: ModelProvider;
  messages?: Message[]; // 历史消息上下文
  temperature?: number;
  maxTokens?: number;
}

// 聊天响应类型
export interface ChatResponse {
  message: string;
  messageId: string;
  sessionId: string;
  model: string;
}

// 主题类型
export type Theme = "light" | "dark";

// 应用设置类型
export interface AppSettings {
  theme: Theme;
  defaultModel: ModelProvider;
  temperature: number;
  maxTokens: number;
  autoSave: boolean;
}

// 流式响应事件类型
export interface StreamEvent {
  type: "token" | "end" | "error";
  data: string;
  messageId?: string;
}

// 上下文管理配置
export interface ContextConfig {
  maxMessages: number; // 最大消息数量
  maxTokens: number; // 最大token数量
  strategy: "recent" | "sliding_window" | "summary"; // 截断策略
}

// 上下文统计信息
export interface ContextStats {
  messageCount: number;
  estimatedTokens: number;
  isLimited: boolean;
}

// 提示模板类型
export type PromptTemplateType = "chat" | "string" | "messages";

// 消息模板
export interface MessageTemplate {
  role: "system" | "user" | "assistant";
  content: string;
  variables?: string[]; // 模板中使用的变量
}

// 聊天提示模板
export interface ChatPromptTemplate {
  id: string;
  name: string;
  description: string;
  type: "chat";
  messages: MessageTemplate[];
  variables: Record<string, string>; // 变量默认值
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

// 字符串提示模板
export interface StringPromptTemplate {
  id: string;
  name: string;
  description: string;
  type: "string";
  template: string;
  variables: Record<string, string>; // 变量默认值
  category: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
}

// 统一的提示模板类型
export type PromptTemplate = ChatPromptTemplate | StringPromptTemplate;

// 模板变量
export interface TemplateVariable {
  name: string;
  description: string;
  defaultValue: string;
  required: boolean;
  type: "text" | "number" | "boolean" | "select";
  options?: string[]; // 用于select类型
}

// 模板渲染上下文
export interface TemplateContext {
  input?: string; // 用户输入
  history?: Message[]; // 对话历史
  variables?: Record<string, unknown>; // 自定义变量
}

// 模板分类
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}
