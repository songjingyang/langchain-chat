import { NextRequest, NextResponse } from "next/server";

interface ImageGenerationRequest {
  prompt: string;
  model?: string;
  width?: number;
  height?: number;
  num_images?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
}

interface HuggingFaceResponse {
  error?: string;
  estimated_time?: number;
}

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      model = "stabilityai/stable-diffusion-xl-base-1.0",
      width = 1024,
      height = 1024,
      num_images = 1,
      guidance_scale = 7.5,
      num_inference_steps = 50,
    }: ImageGenerationRequest = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "请提供有效的图像描述" },
        { status: 400 }
      );
    }

    if (prompt.trim().length === 0) {
      return NextResponse.json({ error: "图像描述不能为空" }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "图像描述长度不能超过1000个字符" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log("🔑 API Key 检查:", {
      exists: !!apiKey,
      format: apiKey
        ? apiKey.startsWith("hf_")
          ? "valid"
          : "invalid"
        : "missing",
      length: apiKey?.length || 0,
    });

    if (!apiKey) {
      console.error("❌ HUGGINGFACE_API_KEY 环境变量未设置");
      return NextResponse.json(
        { error: "Hugging Face API密钥未配置" },
        { status: 500 }
      );
    }

    if (!apiKey.startsWith("hf_")) {
      console.error("❌ API Key 格式错误，应该以 'hf_' 开头");
      return NextResponse.json(
        { error: "Hugging Face API密钥格式错误" },
        { status: 500 }
      );
    }

    console.log("开始生成图像:", {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      model,
      dimensions: `${width}x${height}`,
    });

    // 定义fallback模型列表（都是免费的）
    const fallbackModels = [
      model,
      "runwayml/stable-diffusion-v1-5",
      "CompVis/stable-diffusion-v1-4",
      "stabilityai/stable-diffusion-2-1",
    ].filter((m, index, arr) => arr.indexOf(m) === index); // 去重

    let imageUrl = "";
    let usedModel = model;
    let lastError = "";

    // 尝试使用不同的模型
    for (const currentModel of fallbackModels) {
      try {
        console.log(`🚀 尝试使用模型: ${currentModel}`);
        console.log(
          `🌐 请求URL: https://api-inference.huggingface.co/models/${currentModel}`
        );
        console.log(`📝 请求参数:`, {
          inputs: prompt.substring(0, 50) + "...",
          parameters: {
            width,
            height,
            num_images_per_prompt: num_images,
            guidance_scale,
            num_inference_steps,
          },
        });

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${currentModel}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                width,
                height,
                num_images_per_prompt: num_images,
                guidance_scale,
                num_inference_steps,
              },
            }),
          }
        );

        console.log(`📡 响应状态: ${response.status} ${response.statusText}`);
        console.log(
          `📡 响应头:`,
          Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
          console.log(`❌ HTTP错误: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.log(`❌ 错误内容:`, errorText);

          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { raw: errorText };
          }

          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
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

        // 获取图像数据
        const imageBlob = await response.blob();

        // 转换为base64用于返回
        const arrayBuffer = await imageBlob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        imageUrl = `data:${imageBlob.type};base64,${base64}`;

        usedModel = currentModel;
        console.log(`✅ ${currentModel} 生成成功`);
        break; // 成功则跳出循环
      } catch (error) {
        lastError = (error as Error).message;
        console.error(`❌ ${currentModel} 生成失败:`, {
          error: lastError,
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          stack: (error as Error).stack?.split("\n").slice(0, 3).join("\n"),
        });

        // 如果不是最后一个模型，继续尝试下一个
        if (currentModel !== fallbackModels[fallbackModels.length - 1]) {
          console.log(`正在尝试备用模型...`);
          continue;
        }
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: `所有图像生成模型都暂时不可用，最后错误: ${lastError}`,
          availableModels: fallbackModels,
          lastError,
        },
        { status: 500 }
      );
    }

    const result = {
      imageUrl,
      prompt,
      model: usedModel,
      requestedModel: model,
      dimensions: { width, height },
      timestamp: new Date().toISOString(),
    };

    console.log("图像生成完成:", {
      model: usedModel,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("图像生成API错误:", error);

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
    }

    return NextResponse.json(
      { error: "图像生成服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}

// 获取可用模型列表
export async function GET() {
  return NextResponse.json({
    service: "image-generation",
    status: "available",
    provider: "huggingface",
    supportedModels: [
      "stabilityai/stable-diffusion-xl-base-1.0",
      "runwayml/stable-diffusion-v1-5",
      "CompVis/stable-diffusion-v1-4",
      "stabilityai/stable-diffusion-2-1",
    ],
    maxPromptLength: 1000,
    supportedDimensions: ["512x512", "768x768", "1024x1024"],
    description: "基于Hugging Face的免费图像生成服务",
  });
}
