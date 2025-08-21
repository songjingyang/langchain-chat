import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { createChatModel } from "@/lib/langchain/models";
import { ModelProvider } from "@/lib/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIRequestOptions {
  provider: ModelProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * 调用AI模型获取响应
 */
export async function getAIResponse(
  messages: ChatMessage[],
  options: AIRequestOptions
): Promise<string> {
  try {
    // 创建聊天模型
    const chatModel = createChatModel(options.provider, {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      streaming: false, // 对于提示词优化，我们不需要流式响应
    });

    // 转换消息格式为LangChain格式
    const langchainMessages = messages.map((msg) => {
      switch (msg.role) {
        case "system":
          return new SystemMessage(msg.content);
        case "user":
          return new HumanMessage(msg.content);
        case "assistant":
          return new AIMessage(msg.content);
        default:
          throw new Error(`不支持的消息角色: ${msg.role}`);
      }
    });

    console.log(`调用${options.provider}模型:`, {
      messagesCount: messages.length,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    });

    // 调用模型
    const response = await chatModel.invoke(langchainMessages);

    if (!response || !response.content) {
      throw new Error("AI模型返回空响应");
    }

    const content =
      typeof response.content === "string"
        ? response.content
        : response.content.toString();

    console.log(`${options.provider}模型响应:`, {
      responseLength: content.length,
      preview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
    });

    return content;
  } catch (error) {
    console.error(`AI客户端错误 (${options.provider}):`, error);

    // 根据错误类型抛出更具体的错误
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        throw new Error(`${options.provider} API密钥未配置或无效`);
      }
      if (error.message.includes("rate limit")) {
        throw new Error("API调用频率超限，请稍后重试");
      }
      if (error.message.includes("timeout")) {
        throw new Error("AI服务响应超时，请稍后重试");
      }
    }

    throw new Error(`AI服务调用失败: ${(error as Error).message}`);
  }
}

/**
 * 批量调用AI模型（用于需要多次调用的场景）
 */
export async function batchAIResponse(
  requestsWithMessages: { messages: ChatMessage[]; options: AIRequestOptions }[]
): Promise<string[]> {
  const results: string[] = [];

  for (const { messages, options } of requestsWithMessages) {
    try {
      const response = await getAIResponse(messages, options);
      results.push(response);
    } catch (error) {
      console.error("批量AI调用中的错误:", error);
      results.push(""); // 失败时返回空字符串
    }
  }

  return results;
}

/**
 * 检查AI服务是否可用
 */
export async function checkAIServiceHealth(
  provider: ModelProvider
): Promise<boolean> {
  try {
    const testMessages: ChatMessage[] = [{ role: "user", content: "Hello" }];

    const response = await getAIResponse(testMessages, {
      provider,
      temperature: 0.1,
      maxTokens: 10,
    });

    return response.length > 0;
  } catch (error) {
    console.error(`AI服务健康检查失败 (${provider}):`, error);
    return false;
  }
}
