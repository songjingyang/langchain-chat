import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ModelProvider, ModelConfig } from "../types";

// 模型配置映射
export const MODEL_CONFIGS: Record<ModelProvider, ModelConfig> = {
  openai: {
    provider: "openai",
    name: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    maxTokens: 4096,
    temperature: 0.7,
    streaming: true,
  },
  groq: {
    provider: "groq",
    name: "llama-3.1-8b-instant",
    displayName: "Llama 3.1 8B",
    maxTokens: 8000, // Groq有token限制，调整为更安全的值
    temperature: 0.7,
    streaming: true,
  },
  google: {
    provider: "google",
    name: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    maxTokens: 8192,
    temperature: 0.7,
    streaming: true,
  },
};

// 创建聊天模型实例
export function createChatModel(
  provider: ModelProvider,
  options?: {
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
  }
): BaseChatModel {
  const config = MODEL_CONFIGS[provider];
  const temperature = options?.temperature ?? config.temperature;
  const maxTokens = options?.maxTokens ?? config.maxTokens;
  const streaming = options?.streaming ?? config.streaming;

  // 验证API密钥
  const apiKeys = validateApiKeys();
  if (!apiKeys[provider]) {
    throw new Error(`${provider} API密钥未配置或无效`);
  }

  console.log(`创建${provider}模型实例:`, {
    model: config.name,
    temperature,
    maxTokens,
    streaming,
  });

  try {
    switch (provider) {
      case "openai":
        return new ChatOpenAI({
          model: config.name,
          temperature,
          maxTokens,
          streaming,
          openAIApiKey: process.env.OPENAI_API_KEY,
          // 添加超时和重试配置
          timeout: 60000,
          maxRetries: 2,
        });

      case "groq":
        return new ChatGroq({
          model: config.name,
          temperature,
          maxTokens,
          streaming,
          apiKey: process.env.GROQ_API_KEY,
          // Groq特定配置
          timeout: 30000,
          maxRetries: 1,
        });

      case "google":
        return new ChatGoogleGenerativeAI({
          model: config.name,
          temperature,
          maxOutputTokens: maxTokens,
          streaming,
          apiKey: process.env.GOOGLE_API_KEY,
        });

      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  } catch (error) {
    console.error(`创建${provider}模型失败:`, error);
    throw new Error(
      `创建${provider}模型失败: ${
        error instanceof Error ? error.message : "未知错误"
      }`
    );
  }
}

// 获取所有可用模型
export function getAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}

// 验证API密钥是否配置
export function validateApiKeys(): Record<ModelProvider, boolean> {
  return {
    openai: !!process.env.OPENAI_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    google: !!process.env.GOOGLE_API_KEY,
  };
}
