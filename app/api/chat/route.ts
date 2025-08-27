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

// 媒体生成请求类型
interface MediaGenerationRequest {
  type: "image" | "video";
  description: string;
  confidence: number;
}

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

    // 获取实际的模型名称
    const actualModelName = MODEL_CONFIGS[model as ModelProvider].name;

    // 检查是否是媒体生成请求
    console.log("🔍 开始检查媒体生成请求:", message);
    const mediaGenerationRequest = detectMediaGenerationRequest(message);
    console.log("🔍 媒体生成检测结果:", mediaGenerationRequest);
    if (mediaGenerationRequest) {
      console.log("🎬 检测到媒体生成请求:", mediaGenerationRequest);

      // 返回媒体生成指导响应
      const guidanceResponse = createMediaGenerationGuidance(
        mediaGenerationRequest
      );

      const readableStream = new ReadableStream({
        start(controller) {
          const encoder = new TextEncoder();
          controller.enqueue(encoder.encode(guidanceResponse));
          controller.close();
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // 调试多模态支持
    debugMultimodalSupport(actualModelName);

    // 添加当前用户消息（支持多模态）
    console.log("🔍 处理多模态消息:", {
      provider: model,
      actualModelName,
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
      actualModelName // 传递实际的模型名称而不是provider
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

// 检测媒体生成请求
function detectMediaGenerationRequest(
  message: string
): MediaGenerationRequest | null {
  const lowerMessage = message.toLowerCase();

  // 视频生成关键词
  const videoKeywords = [
    "生成视频",
    "制作视频",
    "创建视频",
    "视频生成",
    "做个视频",
    "做一个视频",
    "生成一个",
    "生成一段",
    "制作一个",
    "制作一段",
    "帮我生成一个视频",
    "帮我做个视频",
    "生成一段视频",
    "制作一段视频",
    "video",
    "generate video",
    "create video",
    "make video",
  ];

  // 图片生成关键词
  const imageKeywords = [
    "生成图片",
    "生成图像",
    "制作图片",
    "创建图片",
    "画一个",
    "画个",
    "帮我生成一张图",
    "帮我画个",
    "生成一张图",
    "制作一张图",
    "image",
    "generate image",
    "create image",
    "draw",
    "paint",
  ];

  // 检查视频生成请求
  for (const keyword of videoKeywords) {
    if (lowerMessage.includes(keyword)) {
      // 提取描述内容
      const description = extractMediaDescription(message, keyword);
      console.log("🎬 视频生成关键词匹配:", { keyword, message, description });
      return {
        type: "video",
        description,
        confidence: 0.9,
      };
    }
  }

  // 特殊检查：包含"视频"且有描述性内容的请求
  if (
    lowerMessage.includes("视频") &&
    (lowerMessage.includes("生成") ||
      lowerMessage.includes("制作") ||
      lowerMessage.includes("创建") ||
      lowerMessage.includes("做"))
  ) {
    console.log("🎬 特殊视频生成请求匹配:", message);
    return {
      type: "video",
      description: message,
      confidence: 0.8,
    };
  }

  // 检查图片生成请求
  for (const keyword of imageKeywords) {
    if (lowerMessage.includes(keyword)) {
      // 提取描述内容
      const description = extractMediaDescription(message, keyword);
      return {
        type: "image",
        description,
        confidence: 0.8,
      };
    }
  }

  return null;
}

// 提取媒体描述
function extractMediaDescription(message: string, keyword: string): string {
  const lowerMessage = message.toLowerCase();
  const keywordIndex = lowerMessage.indexOf(keyword.toLowerCase());

  if (keywordIndex === -1) return message;

  // 尝试提取关键词后的描述
  const afterKeyword = message.substring(keywordIndex + keyword.length).trim();

  // 移除常见的连接词
  const cleanDescription = afterKeyword
    .replace(/^(的|：|:|\s)+/, "")
    .replace(/^(关于|about|of)\s+/, "")
    .trim();

  return cleanDescription || message;
}

// 创建媒体生成指导响应
function createMediaGenerationGuidance(
  request: MediaGenerationRequest
): string {
  const { type, description } = request;

  if (type === "video") {
    return `我理解您想要生成一个关于"${description}"的视频。

🎬 **视频生成指南**

为了帮您生成视频，请按以下步骤操作：

1. **使用输入框右侧的紫色视频按钮** 📹
   - 在输入框中输入您的视频描述："${description}"
   - 点击输入框右侧的紫色视频生成按钮

2. **视频描述建议**：
   - 保持描述简洁明了（500字符以内）
   - 包含具体的视觉元素和动作
   - 例如："一只可爱的小狗在草地上奔跑，阳光明媚"

3. **生成说明**：
   - 视频生成需要1-2分钟时间
   - 生成的是GIF格式的动画视频
   - 支持中文描述

**当前描述**："${description}"

请在输入框中输入完整的视频描述，然后点击紫色的视频生成按钮开始创作！`;
  } else {
    return `我理解您想要生成一张关于"${description}"的图片。

🎨 **图片生成指南**

为了帮您生成图片，请按以下步骤操作：

1. **使用输入框右侧的绿色图片按钮** 🖼️
   - 在输入框中输入您的图片描述："${description}"
   - 点击输入框右侧的绿色图片生成按钮

2. **图片描述建议**：
   - 保持描述详细具体（1000字符以内）
   - 包含风格、颜色、构图等细节
   - 例如："一只可爱的金毛小狗，坐在绿色草地上，背景是蓝天白云，卡通风格"

3. **生成说明**：
   - 图片生成通常需要10-30秒
   - 支持多种风格和尺寸
   - 完全免费使用

**当前描述**："${description}"

请在输入框中输入完整的图片描述，然后点击绿色的图片生成按钮开始创作！`;
  }
}
