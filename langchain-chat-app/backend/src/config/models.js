import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * 模型配置和初始化
 */
export class ModelManager {
  constructor() {
    this.models = new Map();
    this.initializeModels();
  }

  /**
   * 初始化所有可用的模型
   */
  initializeModels() {
    // OpenAI 模型
    if (process.env.OPENAI_API_KEY) {
      this.models.set(
        "gpt-4",
        new ChatOpenAI({
          modelName: "gpt-4",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );

      this.models.set(
        "gpt-3.5-turbo",
        new ChatOpenAI({
          modelName: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );
    }

    // Anthropic 模型
    if (process.env.ANTHROPIC_API_KEY) {
      this.models.set(
        "claude-3-sonnet",
        new ChatAnthropic({
          model: "claude-3-sonnet-20240229",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );

      this.models.set(
        "claude-3-haiku",
        new ChatAnthropic({
          model: "claude-3-haiku-20240307",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );
    }

    // Groq 模型
    if (process.env.GROQ_API_KEY) {
      this.models.set(
        "llama-3.3-70b",
        new ChatGroq({
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );

      this.models.set(
        "mixtral-8x7b",
        new ChatGroq({
          model: "mixtral-8x7b-32768",
          temperature: 0.7,
          maxTokens: 4000,
        })
      );
    }

    // Google 模型 - 使用最新的Gemini模型
    if (process.env.GOOGLE_API_KEY) {
      this.models.set(
        "gemini-2.5-flash",
        new ChatGoogleGenerativeAI({
          model: "gemini-2.5-flash",
          temperature: 0.7,
          maxOutputTokens: 4000,
        })
      );

      this.models.set(
        "gemini-2.5-pro",
        new ChatGoogleGenerativeAI({
          model: "gemini-2.5-pro",
          temperature: 0.7,
          maxOutputTokens: 4000,
        })
      );

      this.models.set(
        "gemini-2.0-flash",
        new ChatGoogleGenerativeAI({
          model: "gemini-2.0-flash",
          temperature: 0.7,
          maxOutputTokens: 4000,
        })
      );
    }

    console.log(`✅ 已初始化 ${this.models.size} 个模型`);
  }

  /**
   * 获取指定模型
   */
  getModel(modelName) {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`模型 ${modelName} 不可用`);
    }
    return model;
  }

  /**
   * 获取所有可用模型列表
   */
  getAvailableModels() {
    return Array.from(this.models.keys()).map((name) => ({
      id: name,
      name: this.getModelDisplayName(name),
      provider: this.getModelProvider(name),
      available: true,
    }));
  }

  /**
   * 获取模型显示名称
   */
  getModelDisplayName(modelName) {
    const displayNames = {
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
      "claude-3-sonnet": "Claude 3 Sonnet",
      "claude-3-haiku": "Claude 3 Haiku",
      "llama-3.3-70b": "Llama 3.3 70B",
      "mixtral-8x7b": "Mixtral 8x7B",
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
    };
    return displayNames[modelName] || modelName;
  }

  /**
   * 获取模型提供商
   */
  getModelProvider(modelName) {
    if (modelName.startsWith("gpt")) return "OpenAI";
    if (modelName.startsWith("claude")) return "Anthropic";
    if (modelName.includes("llama") || modelName.includes("mixtral"))
      return "Groq";
    if (modelName.startsWith("gemini")) return "Google";
    return "Unknown";
  }

  /**
   * 检查模型是否可用
   */
  isModelAvailable(modelName) {
    return this.models.has(modelName);
  }

  /**
   * 获取默认模型
   */
  getDefaultModel() {
    // 优先级：GPT-4 > Claude-3-Sonnet > Gemini-2.5-Flash > Llama-3.3-70B > 其他
    const priorities = [
      "gpt-4",
      "claude-3-sonnet",
      "gemini-2.5-flash",
      "llama-3.3-70b",
    ];

    for (const modelName of priorities) {
      if (this.isModelAvailable(modelName)) {
        return modelName;
      }
    }

    // 如果优先级模型都不可用，返回第一个可用模型
    const availableModels = Array.from(this.models.keys());
    return availableModels.length > 0 ? availableModels[0] : null;
  }
}

// 创建全局模型管理器实例
export const modelManager = new ModelManager();
