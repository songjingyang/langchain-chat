import { NextRequest } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { createChatModel, MODEL_CONFIGS } from "@/lib/langchain/models";
import { ChatRequest, ModelProvider } from "@/lib/types";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, model, temperature, maxTokens } = body;

    console.log("收到聊天请求:", { model, messageLength: message?.length });

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

    // 创建消息
    const messages = [new HumanMessage(message)];
    console.log("开始流式响应...");

    // 创建流式响应
    const stream = await chatModel.stream(messages);

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
