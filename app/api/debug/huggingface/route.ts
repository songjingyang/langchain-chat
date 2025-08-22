import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. 检查环境变量
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log("🔍 调试信息:");
    console.log("API Key 存在:", !!apiKey);
    console.log(
      "API Key 格式:",
      apiKey ? `${apiKey.substring(0, 10)}...` : "未设置"
    );

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "HUGGINGFACE_API_KEY 环境变量未设置",
        debug: {
          envKeyExists: false,
          keyFormat: null,
        },
      });
    }

    if (!apiKey.startsWith("hf_")) {
      return NextResponse.json({
        success: false,
        error: "API Key 格式错误，应该以 'hf_' 开头",
        debug: {
          envKeyExists: true,
          keyFormat: "invalid",
          keyPrefix: apiKey.substring(0, 3),
        },
      });
    }

    // 2. 测试网络连接
    console.log("🌐 测试网络连接到 Hugging Face...");

    const testModel = "runwayml/stable-diffusion-v1-5";
    const testPrompt = "a simple test image";

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${testModel}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: testPrompt,
          parameters: {
            width: 512,
            height: 512,
          },
        }),
      }
    );

    console.log("📡 响应状态:", response.status);
    console.log("📡 响应头:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ 错误响应:", errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { raw: errorText };
      }

      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        debug: {
          envKeyExists: true,
          keyFormat: "valid",
          networkStatus: response.status,
          responseHeaders: Object.fromEntries(response.headers.entries()),
          errorData,
        },
      });
    }

    // 3. 检查响应类型
    const contentType = response.headers.get("content-type");
    console.log("📄 内容类型:", contentType);

    if (contentType?.includes("application/json")) {
      const jsonResponse = await response.json();
      console.log("📄 JSON响应:", jsonResponse);

      return NextResponse.json({
        success: true,
        message: "Hugging Face API 连接成功",
        debug: {
          envKeyExists: true,
          keyFormat: "valid",
          networkStatus: response.status,
          responseType: "json",
          responseData: jsonResponse,
        },
      });
    } else {
      // 图像响应
      const blob = await response.blob();
      console.log("🖼️ 图像响应大小:", blob.size);

      return NextResponse.json({
        success: true,
        message: "Hugging Face API 连接成功，成功生成测试图像",
        debug: {
          envKeyExists: true,
          keyFormat: "valid",
          networkStatus: response.status,
          responseType: "image",
          imageSize: blob.size,
        },
      });
    }
  } catch (error) {
    console.error("🚨 调试错误:", error);

    return NextResponse.json({
      success: false,
      error: `调试过程中发生错误: ${(error as Error).message}`,
      debug: {
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        errorMessage: (error as Error).message,
        stack: (error as Error).stack,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt = "a beautiful sunset" } = await request.json();

    // 快速测试指定提示词
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "API Key 未配置",
      });
    }

    console.log(`🧪 测试生成图像: "${prompt}"`);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 512,
            height: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        success: false,
        error: `测试失败: ${errorData.error || response.statusText}`,
        status: response.status,
      });
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const jsonResponse = await response.json();
      return NextResponse.json({
        success: false,
        error: "模型返回JSON而非图像",
        data: jsonResponse,
      });
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const imageUrl = `data:${blob.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      message: "测试生成成功",
      imageUrl,
      imageSize: blob.size,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `测试错误: ${(error as Error).message}`,
    });
  }
}
