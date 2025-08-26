import { NextRequest } from "next/server";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { createChatModel, MODEL_CONFIGS } from "@/lib/langchain/models";
import { ChatRequest, ModelProvider } from "@/lib/types";
import {
  prepareContextMessages,
  getContextStats,
  DEFAULT_CONTEXT_CONFIGS,
} from "@/lib/context/manager";
import {
  processMessageWithAttachments,
  getAttachmentsSummary,
  debugMultimodalSupport,
} from "@/lib/ai/multimodal";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const {
      message,
      model,
      messages: contextMessages = [],
      attachments = [],
      temperature,
      maxTokens,
    } = body;

    console.log("收到聊天请求:", {
      model,
      messageLength: message?.length,
      contextMessages: contextMessages.length,
      attachments: attachments.length,
      attachmentsSummary:
        attachments.length > 0 ? getAttachmentsSummary(attachments) : "none",
    });

    // 验证请求参数
    if (!message || !model) {
      console.error("请求参数验证失败:", { message: !!message, model });
      return new Response("缺少必要参数", { status: 400 });
    }

    // 验证模型是否支持
    const availableModels = Object.keys(MODEL_CONFIGS);
    if (!availableModels.includes(model)) {
      console.error("不支持的模型:", model);
      return new Response(`不支持的模型: ${model}`, { status: 400 });
    }

    // 创建聊天模型
    console.log("创建聊天模型:", model);
    const chatModel = createChatModel(model as ModelProvider, {
      temperature,
      maxTokens,
      streaming: true,
    });

    // 准备上下文消息
    const truncatedContext = prepareContextMessages(
      contextMessages,
      model as ModelProvider
    );
    const contextStats = getContextStats(
      truncatedContext,
      DEFAULT_CONTEXT_CONFIGS[model as ModelProvider]
    );

    console.log("上下文统计:", contextStats);

    // 转换消息格式为LangChain格式
    const langchainMessages = truncatedContext.map((msg) => {
      if (msg.role === "user") {
        return new HumanMessage(msg.content);
      } else {
        return new AIMessage(msg.content);
      }
    });

    // 调试多模态支持
    debugMultimodalSupport(model);

    // 添加当前用户消息（支持多模态）
    console.log("🔍 处理多模态消息:", {
      model,
      messageText: message,
      attachmentCount: attachments.length,
      attachmentDetails: attachments.map((att) => ({
        name: att.name,
        type: att.type,
        hasBase64: !!att.content?.base64,
        base64Length: att.content?.base64?.length || 0,
        mimeType: att.mimeType,
      })),
    });

    const currentMessage = processMessageWithAttachments(
      message,
      attachments,
      model
    );
    langchainMessages.push(currentMessage);

    console.log("📝 最终消息内容:", {
      totalMessages: langchainMessages.length,
      currentMessageType: typeof currentMessage.content,
      currentMessageContent:
        typeof currentMessage.content === "string"
          ? currentMessage.content.substring(0, 200) + "..."
          : `Array with ${
              Array.isArray(currentMessage.content)
                ? currentMessage.content.length
                : 0
            } items`,
    });

    // 创建流式响应
    const stream = await chatModel.stream(langchainMessages);

    // 创建可读流
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          let tokenCount = 0;
          for await (const chunk of stream) {
            if (chunk?.content) {
              tokenCount++;
              console.log(
                `接收到token ${tokenCount}:`,
                chunk.content.slice(0, 50)
              );

              // 发送SSE格式的数据
              const sseData = `data: ${JSON.stringify({
                type: "token",
                data: chunk.content,
              })}\n\n`;

              controller.enqueue(encoder.encode(sseData));
            }
          }

          console.log(`流式响应完成，共${tokenCount}个token`);

          // 发送结束信号
          const endData = `data: ${JSON.stringify({
            type: "end",
            data: "",
          })}\n\n`;

          controller.enqueue(encoder.encode(endData));
        } catch (error) {
          console.error("流式处理错误:", error);

          // 根据错误类型提供更详细的错误信息
          let errorMessage = "未知错误";
          if (error instanceof Error) {
            errorMessage = error.message;
            // 检查常见的API错误
            if (error.message.includes("API key")) {
              errorMessage = `${model} API密钥无效或未配置`;
            } else if (error.message.includes("rate limit")) {
              errorMessage = `${model} API调用频率限制，请稍后重试`;
            } else if (error.message.includes("timeout")) {
              errorMessage = `${model} API请求超时，请重试`;
            } else if (
              error.message.includes("multimodal") ||
              error.message.includes("image")
            ) {
              errorMessage = `${model} 图片处理失败，请检查图片格式或尝试其他模型`;
            } else if (error.message.includes("base64")) {
              errorMessage = "图片数据格式错误，请重新上传图片";
            }
          }

          const errorData = `data: ${JSON.stringify({
            type: "error",
            data: errorMessage,
          })}\n\n`;

          controller.enqueue(encoder.encode(errorData));
        } finally {
          controller.close();
        }
      },
    });

    // 返回SSE响应
    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("API错误:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "服务器内部错误",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
