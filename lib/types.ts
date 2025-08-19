// 消息类型定义
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
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
export type ModelProvider = 'openai' | 'groq' | 'google';

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
export type Theme = 'light' | 'dark';

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
  type: 'token' | 'end' | 'error';
  data: string;
  messageId?: string;
}
