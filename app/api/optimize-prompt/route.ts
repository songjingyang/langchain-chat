import { NextRequest, NextResponse } from "next/server";
import { getAIResponse } from "@/lib/ai/client";
import { ModelProvider } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { prompt, provider = "openai" } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "请提供有效的提示词内容" },
        { status: 400 }
      );
    }

    if (prompt.trim().length === 0) {
      return NextResponse.json({ error: "提示词不能为空" }, { status: 400 });
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "提示词长度不能超过2000个字符" },
        { status: 400 }
      );
    }

    // 构建优化提示词的系统提示
    const systemPrompt = `你是一个专业的提示词优化专家。你的任务是优化用户提供的提示词，使其更加清晰、具体、有效。

优化原则：
1. 保持原意不变，但使表达更加清晰和具体
2. 添加必要的上下文信息，使AI更好理解用户意图
3. 使用更精确的词汇和描述
4. 确保逻辑结构清晰
5. 如果是技术问题，添加相关的技术细节要求
6. 如果是创作类问题，添加风格、语调等要求
7. 保持简洁，避免冗余

请直接返回优化后的提示词，不要添加任何解释或前缀。`;

    const userMessage = `请优化以下提示词：

原始提示词：
${prompt}

请返回优化后的提示词：`;

    console.log("开始优化提示词:", {
      originalLength: prompt.length,
      provider,
      preview: prompt.substring(0, 100) + (prompt.length > 100 ? "..." : ""),
    });

    // 定义fallback提供商顺序
    const fallbackProviders: ModelProvider[] = [
      provider as ModelProvider,
      ...(provider !== "groq" ? ["groq" as ModelProvider] : []),
      ...(provider !== "google" ? ["google" as ModelProvider] : []),
    ];

    let optimizedPrompt = "";
    let usedProvider = provider;
    let lastError = "";

    // 尝试使用不同的AI提供商
    for (const currentProvider of fallbackProviders) {
      try {
        console.log(`尝试使用 ${currentProvider} 提供商...`);

        optimizedPrompt = await getAIResponse(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          {
            provider: currentProvider,
            model:
              currentProvider === "openai"
                ? "gpt-3.5-turbo"
                : currentProvider === "groq"
                ? "llama3-8b-8192"
                : "gemini-pro",
            temperature: 0.3,
            maxTokens: 1000,
          }
        );

        usedProvider = currentProvider;
        console.log(`✅ ${currentProvider} 提供商调用成功`);
        break; // 成功则跳出循环
      } catch (error) {
        lastError = (error as Error).message;
        console.log(`❌ ${currentProvider} 提供商失败:`, lastError);

        // 如果不是最后一个提供商，继续尝试下一个
        if (
          currentProvider !== fallbackProviders[fallbackProviders.length - 1]
        ) {
          console.log(`正在尝试备用提供商...`);
          continue;
        }
      }
    }

    if (!optimizedPrompt || optimizedPrompt.trim().length === 0) {
      return NextResponse.json(
        {
          error: `所有AI服务都暂时不可用，最后错误: ${lastError}`,
          availableProviders: fallbackProviders,
          lastError,
        },
        { status: 500 }
      );
    }

    const result = {
      original: prompt,
      optimized: optimizedPrompt.trim(),
      improvements: generateImprovements(prompt, optimizedPrompt.trim()),
      provider: usedProvider, // 使用实际成功的提供商
      requestedProvider: provider, // 用户请求的提供商
      timestamp: new Date().toISOString(),
    };

    console.log("提示词优化完成:", {
      originalLength: prompt.length,
      optimizedLength: result.optimized.length,
      improvementsCount: result.improvements.length,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("提示词优化API错误:", error);

    // 根据错误类型返回不同的错误信息
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "AI服务配置错误，请检查API密钥设置" },
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
      { error: "提示词优化服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}

// 分析优化改进点
function generateImprovements(original: string, optimized: string): string[] {
  const improvements: string[] = [];

  // 长度比较
  if (optimized.length > original.length * 1.2) {
    improvements.push("添加了更多具体细节和上下文信息");
  }

  // 结构化检测
  if (optimized.includes("：") || optimized.includes(":")) {
    improvements.push("改善了内容结构和逻辑层次");
  }

  // 专业术语检测
  const technicalTerms = [
    "具体",
    "详细",
    "明确",
    "要求",
    "标准",
    "格式",
    "风格",
  ];
  const hasMoreTerms = technicalTerms.some(
    (term) =>
      (optimized.match(new RegExp(term, "g")) || []).length >
      (original.match(new RegExp(term, "g")) || []).length
  );

  if (hasMoreTerms) {
    improvements.push("使用了更精确和专业的表达方式");
  }

  // 问句检测
  if (optimized.includes("？") || optimized.includes("?")) {
    improvements.push("明确了问题的具体方向");
  }

  // 如果没有检测到明显改进，添加通用改进描述
  if (improvements.length === 0) {
    improvements.push("优化了表达的清晰度和准确性");
  }

  return improvements;
}

export async function GET() {
  return NextResponse.json({
    service: "prompt-optimization",
    status: "available",
    supportedProviders: ["openai", "groq", "google"],
    maxLength: 2000,
    description: "提示词优化服务，帮助用户改善提示词的质量和效果",
  });
}
