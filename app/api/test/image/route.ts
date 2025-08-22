import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const testResults = [];

  // 测试 Pollinations AI
  try {
    console.log("🧪 测试 Pollinations AI...");
    const testPrompt = "a cute cat";
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      testPrompt
    )}?width=512&height=512&enhance=true&model=flux`;

    const response = await fetch(pollinationsUrl, { method: "HEAD" });

    testResults.push({
      service: "Pollinations AI",
      status: response.ok ? "✅ 可用" : "❌ 不可用",
      url: pollinationsUrl,
      responseStatus: response.status,
      error: response.ok ? null : response.statusText,
    });
  } catch (error) {
    testResults.push({
      service: "Pollinations AI",
      status: "❌ 网络错误",
      error: (error as Error).message,
    });
  }

  // 测试完整生成流程
  try {
    console.log("🧪 测试完整图像生成流程...");
    const testResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/generate/image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "a simple test image",
          width: 512,
          height: 512,
        }),
      }
    );

    testResults.push({
      service: "完整生成流程",
      status: testResponse.ok ? "✅ 成功" : "❌ 失败",
      responseStatus: testResponse.status,
      data: testResponse.ok ? "图像生成成功" : await testResponse.text(),
    });
  } catch (error) {
    testResults.push({
      service: "完整生成流程",
      status: "❌ 错误",
      error: (error as Error).message,
    });
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    summary: `测试完成: ${
      testResults.filter((r) => r.status.includes("✅")).length
    }/${testResults.length} 个服务可用`,
    results: testResults,
    recommendation: testResults.some(
      (r) => r.service === "Pollinations AI" && r.status.includes("✅")
    )
      ? "🎉 Pollinations AI 可用，图像生成功能正常"
      : "⚠️  需要检查网络连接或使用备用服务",
  });
}

export async function POST(request: NextRequest) {
  const { prompt = "a beautiful sunset" } = await request.json();

  try {
    console.log(`🧪 测试生成图像: "${prompt}"`);

    // 直接测试 Pollinations API
    const encodedPrompt = encodeURIComponent(prompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&enhance=true&model=flux`;

    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `Pollinations API 错误: ${response.status} ${response.statusText}`,
        url: imageUrl,
      });
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const base64ImageUrl = `data:${imageBlob.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      message: "✅ 图像生成测试成功",
      imageUrl: base64ImageUrl,
      imageSize: imageBlob.size,
      service: "Pollinations AI",
      prompt,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `测试失败: ${(error as Error).message}`,
    });
  }
}
