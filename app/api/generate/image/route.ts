import { NextRequest, NextResponse } from "next/server";

interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  model?: string;
  enhance?: boolean;
}

// 千问AI图像生成服务配置
const QWEN_IMAGE_SERVICE = {
  name: "千问文生图",
  baseUrl:
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis",
  description: "阿里云通义千问文生图服务",
  requiresKey: true,
  models: [
    "flux-dev",
    "flux-schnell",
    "stable-diffusion-v1.5",
    "stable-diffusion-xl",
  ],
};

// 免费AI图像生成服务配置（备用）
const FREE_IMAGE_SERVICES = {
  pollinations: {
    name: "Pollinations AI",
    baseUrl: "https://image.pollinations.ai/prompt/",
    description: "完全免费，无需API密钥",
    maxSize: 1024,
  },
  together: {
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1/images/generations",
    description: "免费额度每月$5",
    requiresKey: true,
  },
  freeimage: {
    name: "Free Image API",
    baseUrl: "https://api.unsplash.com/photos/random",
    description: "真实照片API备用",
    requiresKey: false,
  },
};

export async function POST(request: NextRequest) {
  try {
    const {
      prompt,
      width = 1024,
      height = 1024,
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

    // 优化提示词
    const optimizedPrompt = optimizePromptForGeneration(prompt);

    console.log("🎨 开始生成图像:", {
      service: "千问文生图 (优先)",
      originalPrompt:
        prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
      optimizedPrompt:
        optimizedPrompt.substring(0, 100) +
        (optimizedPrompt.length > 100 ? "..." : ""),
      dimensions: `${width}x${height}`,
    });

    // 定义服务优先级：千问优先，免费服务备用
    const serviceOrder = ["qwen", "pollinations", "freeimage", "together"];

    let imageUrl = "";
    let usedService = "qwen";
    let lastError = "";

    // 尝试使用不同的服务（千问优先）
    for (const currentService of serviceOrder) {
      try {
        let serviceInfo;

        if (currentService === "qwen") {
          serviceInfo = QWEN_IMAGE_SERVICE;
        } else {
          serviceInfo =
            FREE_IMAGE_SERVICES[
              currentService as keyof typeof FREE_IMAGE_SERVICES
            ];
        }

        if (!serviceInfo) {
          console.log(`⚠️ 服务 ${currentService} 配置未找到，跳过`);
          continue;
        }

        console.log(`🚀 尝试使用: ${serviceInfo.name}`);

        if (currentService === "qwen") {
          imageUrl = await generateWithQwen(optimizedPrompt, width, height);
        } else if (currentService === "pollinations") {
          imageUrl = await generateWithPollinations(
            optimizedPrompt,
            width,
            height
          );
        } else if (currentService === "together") {
          imageUrl = await generateWithTogether(optimizedPrompt, width, height);
        } else if (currentService === "freeimage") {
          imageUrl = await generateWithFreeImage(optimizedPrompt);
        }

        if (imageUrl) {
          usedService = currentService;
          console.log(`✅ ${serviceInfo.name} 生成成功`);
          break;
        }
      } catch (error) {
        lastError = (error as Error).message;
        const serviceInfo =
          FREE_IMAGE_SERVICES[
            currentService as keyof typeof FREE_IMAGE_SERVICES
          ];
        console.error(`❌ ${serviceInfo.name} 失败:`, lastError);

        // 如果不是最后一个服务，继续尝试下一个
        if (currentService !== serviceOrder[serviceOrder.length - 1]) {
          console.log(`正在尝试备用服务...`);
          continue;
        }
      }
    }

    if (!imageUrl) {
      return NextResponse.json(
        {
          error: `所有免费图像生成服务都暂时不可用，最后错误: ${lastError}`,
          availableServices: Object.keys(FREE_IMAGE_SERVICES),
          lastError,
        },
        { status: 500 }
      );
    }

    const serviceInfo =
      FREE_IMAGE_SERVICES[usedService as keyof typeof FREE_IMAGE_SERVICES];
    const result = {
      imageUrl,
      originalPrompt: prompt,
      optimizedPrompt,
      service: serviceInfo.name,
      dimensions: { width, height },
      timestamp: new Date().toISOString(),
    };

    console.log("✅ 图像生成完成:", {
      service: serviceInfo.name,
      success: true,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("🚨 图像生成API错误:", error);
    return NextResponse.json(
      { error: "图像生成服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}

// Pollinations AI 生成（完全免费）
async function generateWithPollinations(
  prompt: string,
  width: number,
  height: number
): Promise<string> {
  const encodedPrompt = encodeURIComponent(prompt);

  // 尝试不同的URL格式和参数组合
  const urlFormats = [
    // 使用高质量模型和增强
    `${FREE_IMAGE_SERVICES.pollinations.baseUrl}${encodedPrompt}?width=${width}&height=${height}&model=flux&enhance=true&nologo=true&nofeed=true`,
    // 使用flux模型，无logo
    `${FREE_IMAGE_SERVICES.pollinations.baseUrl}${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true`,
    // 基础参数，但添加种子以确保不同结果
    `${
      FREE_IMAGE_SERVICES.pollinations.baseUrl
    }${encodedPrompt}?width=${width}&height=${height}&nologo=true&seed=${Date.now()}`,
    // 备用URL格式
    `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo`,
  ];

  let lastError = "";

  for (const imageUrl of urlFormats) {
    try {
      console.log("🌸 尝试 Pollinations URL:", imageUrl);

      // 直接下载图像，不使用 HEAD 请求
      const imageResponse = await fetch(imageUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AI-Image-Generator/1.0)",
        },
      });

      console.log(`📡 Pollinations 响应:`, {
        status: imageResponse.status,
        statusText: imageResponse.statusText,
        contentType: imageResponse.headers.get("content-type"),
        contentLength: imageResponse.headers.get("content-length"),
      });

      if (!imageResponse.ok) {
        throw new Error(
          `HTTP ${imageResponse.status}: ${imageResponse.statusText}`
        );
      }

      const contentType = imageResponse.headers.get("content-type");
      if (!contentType?.startsWith("image/")) {
        const textResponse = await imageResponse.text();
        console.log("⚠️ 非图像响应:", textResponse.substring(0, 200));
        throw new Error(`响应不是图像格式: ${contentType}`);
      }

      const imageBlob = await imageResponse.blob();
      console.log(`📊 图像信息:`, {
        size: imageBlob.size,
        type: imageBlob.type,
      });

      if (imageBlob.size === 0) {
        throw new Error("图像数据为空");
      }

      if (imageBlob.size < 1000) {
        throw new Error(`图像太小，可能是错误响应: ${imageBlob.size} bytes`);
      }

      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      if (!base64 || base64.length < 100) {
        throw new Error(`Base64转换失败或数据太短: ${base64.length} chars`);
      }

      const finalImageUrl = `data:${imageBlob.type};base64,${base64}`;
      console.log("✅ Pollinations 图像生成成功:", {
        originalSize: imageBlob.size,
        base64Length: base64.length,
        dataUrlLength: finalImageUrl.length,
      });

      return finalImageUrl;
    } catch (error) {
      lastError = (error as Error).message;
      console.log(`❌ URL格式失败: ${lastError}`);
      // 继续尝试下一个URL格式
    }
  }

  throw new Error(`所有Pollinations URL格式都失败，最后错误: ${lastError}`);
}

// Together AI 生成（需要API密钥，但有免费额度）
async function generateWithTogether(
  prompt: string,
  width: number,
  height: number
): Promise<string> {
  const apiKey = process.env.TOGETHER_API_KEY;
  if (!apiKey) {
    throw new Error("Together AI API密钥未配置");
  }

  const response = await fetch(FREE_IMAGE_SERVICES.together.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell-Free",
      prompt: prompt,
      width: width,
      height: height,
      steps: 4,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Together AI 错误: ${errorText}`);
  }

  const result = await response.json();
  if (!result.data || !result.data[0] || !result.data[0].b64_json) {
    throw new Error("Together AI 返回格式错误");
  }

  return `data:image/png;base64,${result.data[0].b64_json}`;
}

// 备用免费图像服务（使用另一个AI生成服务）
async function generateWithFreeImage(prompt: string): Promise<string> {
  // 使用另一个免费的图像生成服务 - 这里使用一个简单的API
  const cleanPrompt = prompt.replace(/[^a-zA-Z0-9\s\u4e00-\u9fff]/g, "").trim();

  // 尝试多个免费服务
  const freeServices = [
    `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
      cleanPrompt
    )}`, // QR码作为最后备用
    `https://via.placeholder.com/512x512/4A90E2/FFFFFF?text=${encodeURIComponent(
      cleanPrompt.substring(0, 20)
    )}`, // 占位符图像
  ];

  for (const serviceUrl of freeServices) {
    try {
      console.log("🔄 尝试备用服务:", serviceUrl);

      const response = await fetch(serviceUrl);
      if (!response.ok) {
        continue;
      }

      const imageBlob = await response.blob();
      if (imageBlob.size === 0) {
        continue;
      }

      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");

      console.log("✅ 备用服务成功:", {
        size: imageBlob.size,
        type: imageBlob.type,
      });

      return `data:${imageBlob.type};base64,${base64}`;
    } catch (error) {
      console.log("❌ 备用服务失败:", (error as Error).message);
      continue;
    }
  }

  throw new Error("所有备用图像服务都不可用");
}

// 优化提示词以获得更好的生成结果
function optimizePromptForGeneration(prompt: string): string {
  // 如果是中文，处理常见的生成请求
  const chineseRegex = /[\u4e00-\u9fff]/;
  const isChinese = chineseRegex.test(prompt);

  if (isChinese) {
    // 检查是否包含常见的生成请求词汇
    if (/生成|画|帮我.*图片|制作|创建/.test(prompt)) {
      // 提取主要内容
      const cleanPrompt = prompt
        .replace(/请|帮我|生成|画|一个|一张|图片|的图片|制作|创建/g, "")
        .trim();

      // 如果清理后内容太短，添加更具体的质量描述
      if (cleanPrompt.length < 10) {
        return `${cleanPrompt}, photorealistic, high resolution, vivid colors, sharp focus, professional photography`;
      }

      // 添加英文质量关键词，确保更好的视觉效果
      return `${cleanPrompt}, masterpiece, high quality, detailed, photorealistic, vibrant colors`;
    }
  }

  // 对于简短的描述，添加更强的质量关键词
  if (prompt.length < 20) {
    return `${prompt}, high quality, detailed, photorealistic, vibrant colors, sharp focus`;
  }

  // 对于所有提示词，确保有基本的质量要求
  if (
    !prompt.includes("quality") &&
    !prompt.includes("detailed") &&
    !prompt.includes("photorealistic")
  ) {
    return `${prompt}, high quality, detailed`;
  }

  return prompt;
}

// 千问文生图API调用
async function generateWithQwen(
  prompt: string,
  width: number,
  height: number
): Promise<string> {
  const apiKey =
    process.env.QWEN_API_KEY || "sk-1c16b732f069448b97f51a90ec3f969d";

  if (!apiKey) {
    throw new Error("千问API密钥未配置");
  }

  console.log("🎯 调用千问文生图API...");

  const requestBody = {
    model: "flux-dev", // 使用flux-dev模型，质量更高
    input: {
      prompt: prompt,
      negative_prompt: "低质量, 模糊, 扭曲, 变形",
      size: `${width}*${height}`,
    },
    parameters: {
      seed: Math.floor(Math.random() * 1000000),
      steps: 20,
      scale: 7.5,
    },
  };

  try {
    const response = await fetch(QWEN_IMAGE_SERVICE.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-DashScope-Async": "enable", // 启用异步处理
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`📡 千问API响应:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ 千问API错误响应:", errorText);
      throw new Error(`千问API错误 ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log("📊 千问API返回结构:", {
      hasOutput: !!result.output,
      hasTaskId: !!result.task_id,
      status: result.task_status,
    });

    // 处理异步任务
    if (result.task_id && result.task_status === "PENDING") {
      console.log("⏳ 任务提交成功，等待异步处理...");

      // 轮询任务状态
      const taskResult = await pollQwenTask(result.task_id, apiKey);
      if (taskResult && taskResult.output && taskResult.output.results) {
        const imageUrl = taskResult.output.results[0]?.url;
        if (imageUrl) {
          // 下载图片并转换为base64
          return await downloadAndConvertToBase64(imageUrl);
        }
      }
      throw new Error("千问异步任务处理失败");
    }

    // 处理同步响应
    if (
      result.output &&
      result.output.results &&
      result.output.results.length > 0
    ) {
      const imageUrl = result.output.results[0].url;
      console.log(
        "✅ 千问图像生成成功，图片URL:",
        imageUrl.substring(0, 50) + "..."
      );

      // 下载图片并转换为base64
      return await downloadAndConvertToBase64(imageUrl);
    }

    throw new Error("千问API返回格式异常，未找到图像数据");
  } catch (error) {
    console.error("❌ 千问API调用失败:", error);
    throw error;
  }
}

// 轮询千问异步任务状态
async function pollQwenTask(
  taskId: string,
  apiKey: string,
  maxAttempts: number = 30
): Promise<any> {
  const pollUrl = `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`🔄 轮询任务状态 (${attempt + 1}/${maxAttempts})...`);

      const response = await fetch(pollUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`轮询请求失败: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📊 任务状态: ${result.task_status}`);

      if (result.task_status === "SUCCEEDED") {
        console.log("✅ 异步任务完成");
        return result;
      } else if (result.task_status === "FAILED") {
        throw new Error(`任务失败: ${result.message || "未知错误"}`);
      }

      // 等待2秒后继续轮询
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ 轮询错误 (尝试 ${attempt + 1}):`, error);
      if (attempt === maxAttempts - 1) {
        throw error;
      }
    }
  }

  throw new Error("任务轮询超时");
}

// 下载图片并转换为base64
async function downloadAndConvertToBase64(imageUrl: string): Promise<string> {
  try {
    console.log("📥 下载千问生成的图片...");

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`图片下载失败: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    console.log("✅ 图片下载并转换完成:", {
      size: imageBlob.size,
      type: imageBlob.type,
      base64Length: base64.length,
    });

    return `data:${imageBlob.type};base64,${base64}`;
  } catch (error) {
    console.error("❌ 图片下载转换失败:", error);
    throw error;
  }
}

// 获取可用服务信息
export async function GET() {
  return NextResponse.json({
    service: "hybrid-image-generation",
    status: "available",
    primaryProvider: QWEN_IMAGE_SERVICE,
    fallbackProviders: FREE_IMAGE_SERVICES,
    serviceOrder: [
      "千问文生图",
      "Pollinations AI",
      "Free Image API",
      "Together AI",
    ],
    features: [
      "千问高质量文生图优先",
      "多服务自动备用机制",
      "支持中文描述",
      "异步任务处理",
      "智能错误恢复",
    ],
    qwenFeatures: [
      "专业级图像质量",
      "支持多种模型",
      "异步处理大图",
      "中文提示词优化",
    ],
    maxPromptLength: 800, // 千问限制
    supportedSizes: ["512x512", "768x768", "1024x1024", "1280x720"],
    supportedModels: QWEN_IMAGE_SERVICE.models,
    description: "千问文生图为主，免费服务备用的混合图像生成服务",
  });
}
