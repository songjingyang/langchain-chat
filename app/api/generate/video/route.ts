import { NextRequest, NextResponse } from "next/server";

interface VideoGenerationRequest {
  prompt: string;
  model?: string;
  duration?: number;
  fps?: number;
  width?: number;
  height?: number;
}

interface HuggingFaceResponse {
  error?: string;
  estimated_time?: number;
}

// 免费视频生成服务配置
const FREE_VIDEO_SERVICES = {
  huggingface: {
    name: "Hugging Face",
    models: [
      "ali-vilab/text-to-video-ms-1.7b",
      "damo-vilab/text-to-video-ms-1.7b",
      "runwayml/stable-video-diffusion-img2vid-xt",
    ],
    baseUrl: "https://api-inference.huggingface.co/models/",
  },
  // 备用免费服务可以在这里添加
};

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      model = "ali-vilab/text-to-video-ms-1.7b",
      duration = 3,
      fps = 8,
      width = 512,
      height = 512,
    }: VideoGenerationRequest = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "请提供有效的视频描述" },
        { status: 400 }
      );
    }

    if (prompt.trim().length === 0) {
      return NextResponse.json({ error: "视频描述不能为空" }, { status: 400 });
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "视频描述长度不能超过500个字符" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Hugging Face API密钥未配置" },
        { status: 500 }
      );
    }

    console.log("开始生成视频:", {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      model,
      duration,
      dimensions: `${width}x${height}`,
    });

    // 定义fallback模型列表
    const fallbackModels = [
      model,
      ...FREE_VIDEO_SERVICES.huggingface.models.filter((m) => m !== model),
    ];

    let videoUrl = "";
    let usedModel = model;
    let lastError = "";

    // 尝试使用不同的模型
    for (const currentModel of fallbackModels) {
      try {
        console.log(`尝试使用视频模型: ${currentModel}`);

        const response = await fetch(
          `${FREE_VIDEO_SERVICES.huggingface.baseUrl}${currentModel}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                num_frames: duration * fps,
                width,
                height,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        // 检查是否返回JSON错误
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const jsonResponse: HuggingFaceResponse = await response.json();
          if (jsonResponse.error) {
            throw new Error(jsonResponse.error);
          }
          if (jsonResponse.estimated_time) {
            throw new Error(
              `模型正在加载中，预计等待时间: ${jsonResponse.estimated_time}秒`
            );
          }
        }

        // 获取视频数据
        const videoBlob = await response.blob();

        // 转换为base64用于返回
        const arrayBuffer = await videoBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        videoUrl = `data:${videoBlob.type};base64,${base64}`;

        usedModel = currentModel;
        console.log(`✅ ${currentModel} 视频生成成功`);
        break; // 成功则跳出循环
      } catch (error) {
        lastError = (error as Error).message;
        console.log(`❌ ${currentModel} 视频生成失败:`, lastError);

        // 如果不是最后一个模型，继续尝试下一个
        if (currentModel !== fallbackModels[fallbackModels.length - 1]) {
          console.log(`正在尝试备用视频模型...`);
          continue;
        }
      }
    }

    if (!videoUrl) {
      return NextResponse.json(
        {
          error: `所有视频生成模型都暂时不可用，最后错误: ${lastError}`,
          availableModels: fallbackModels,
          lastError,
          suggestion:
            "视频生成需要更多计算资源，建议稍后重试或使用图像生成功能",
        },
        { status: 500 }
      );
    }

    const result = {
      videoUrl,
      prompt,
      model: usedModel,
      requestedModel: model,
      duration,
      fps,
      dimensions: { width, height },
      timestamp: new Date().toISOString(),
    };

    console.log("视频生成完成:", {
      model: usedModel,
      duration,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("视频生成API错误:", error);

    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "Hugging Face API密钥配置错误" },
          { status: 503 }
        );
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { error: "请求过于频繁，请稍后重试" },
          { status: 429 }
        );
      }
      if (error.message.includes("model is currently loading")) {
        return NextResponse.json(
          { error: "视频模型正在加载中，请等待1-2分钟后重试" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "视频生成服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取可用视频模型列表
export async function GET() {
  return NextResponse.json({
    service: "video-generation",
    status: "available",
    provider: "huggingface",
    supportedModels: FREE_VIDEO_SERVICES.huggingface.models,
    maxPromptLength: 500,
    supportedDurations: [1, 2, 3, 4, 5], // 秒
    supportedFPS: [8, 12, 16, 24],
    supportedDimensions: ["256x256", "512x512", "768x768"],
    description: "基于Hugging Face的免费视频生成服务",
    note: "视频生成需要较长时间，首次使用模型可能需要等待模型加载",
  });
}
