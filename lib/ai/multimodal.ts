// 多模态AI消息处理

import { HumanMessage } from "@langchain/core/messages";
import { MessageAttachment } from "@/lib/types";

/**
 * 验证和清理base64数据
 */
function validateBase64(base64: string): string {
  // 移除可能的前缀
  const cleanBase64 = base64.replace(/^data:image\/[^;]+;base64,/, "");

  // 验证base64格式
  try {
    atob(cleanBase64);
    return cleanBase64;
  } catch (error) {
    console.error("❌ Base64数据无效:", error);
    throw new Error("无效的Base64图片数据");
  }
}

/**
 * 创建真正的多模态消息（支持图片内容）
 */
export function createTrueMultimodalMessage(
  text: string,
  attachments: MessageAttachment[],
  model?: string
): HumanMessage {
  const content: Array<{
    type: string;
    text?: string;
    image_url?: string | { url: string; detail?: string };
    mimeType?: string;
    data?: string;
  }> = [];

  console.log("🖼️ 创建多模态消息:", {
    model,
    textLength: text.length,
    attachmentCount: attachments.length,
    imageAttachments: attachments.filter((att) => att.type === "image").length,
  });

  // 添加文本内容
  if (text.trim()) {
    content.push({
      type: "text",
      text: text,
    });
  }

  // 添加图片内容
  for (const attachment of attachments) {
    if (attachment.type === "image" && attachment.content?.base64) {
      console.log("📸 添加图片到消息:", {
        name: attachment.name,
        mimeType: attachment.mimeType,
        base64Length: attachment.content.base64.length,
        hasMetadata: !!attachment.content.metadata,
      });

      try {
        // 验证和清理base64数据
        const cleanBase64 = validateBase64(attachment.content.base64);

        // 根据模型类型使用不同的格式
        if (model?.includes("gemini")) {
          // Google Gemini 格式 - 使用 media 类型
          const mediaContent = {
            type: "media",
            mimeType: attachment.mimeType,
            data: cleanBase64,
          };
          content.push(mediaContent);
        } else {
          // OpenAI 格式
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${attachment.mimeType};base64,${cleanBase64}`,
              detail: "high", // 使用高质量分析
            },
          });
        }
      } catch (error) {
        console.error("❌ 处理图片附件失败:", error);
        // 跳过这个附件，继续处理其他附件
        continue;
      }
    }
  }

  console.log("✅ 多模态消息构建完成:", {
    contentItems: content.length,
    contentTypes: content.map((item) => item.type),
  });

  // 如果只有文本，返回简单的文本消息
  if (content.length === 1 && content[0].type === "text") {
    return new HumanMessage(content[0].text || "");
  }

  // 如果没有内容，返回空文本消息
  if (content.length === 0) {
    console.warn("⚠️ 多模态消息内容为空，返回默认消息");
    return new HumanMessage("请分析这张图片");
  }

  // 返回多模态消息
  try {
    return new HumanMessage({
      content: content,
    });
  } catch (error) {
    console.error("❌ 创建多模态消息失败，降级到文本描述:", error);
    // 降级到文本描述
    const textDescription = createTextDescriptionForAttachments(
      text,
      attachments
    );
    return new HumanMessage(textDescription);
  }
}

/**
 * 创建包含附件信息的消息
 */
export function createMultimodalMessage(
  text: string,
  attachments?: MessageAttachment[]
): HumanMessage {
  if (!attachments || attachments.length === 0) {
    return new HumanMessage(text);
  }

  // 将所有附件信息作为文本描述添加到消息中
  let enhancedText = text;

  for (const attachment of attachments) {
    if (attachment.type === "image") {
      enhancedText += `\n\n[图片文件：${attachment.name}，大小：${Math.round(
        attachment.size / 1024
      )}KB`;

      if (attachment.content?.metadata) {
        const metadata = attachment.content.metadata as {
          width?: number;
          height?: number;
        };
        if (metadata.width && metadata.height) {
          enhancedText += `，尺寸：${metadata.width}x${metadata.height}`;
        }
      }

      enhancedText += `，链接：${attachment.url}]`;
      enhancedText += `\n请注意：我可以看到这张图片的相关信息。如果您需要我分析图片内容，请告诉我您希望了解什么。`;
    } else if (attachment.content?.text) {
      enhancedText += `\n\n文件：${attachment.name}\n内容：\n${attachment.content.text}`;
    } else {
      enhancedText += `\n\n[文件：${attachment.name}，类型：${
        attachment.type
      }，大小：${Math.round(attachment.size / 1024)}KB，链接：${
        attachment.url
      }]`;
    }
  }

  return new HumanMessage(enhancedText);
}

/**
 * 检查模型是否支持多模态输入
 */
export function supportsMultimodal(model: string): boolean {
  const multimodalModels = [
    // OpenAI 模型
    "gpt-4-vision-preview",
    "gpt-4-turbo",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-1106-vision-preview",
    "gpt-4-vision",

    // Claude 模型
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
    "claude-3.5-sonnet",

    // Google 模型
    "gemini-pro-vision",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro-vision",

    // Groq 模型（如果支持）
    "llava",
  ];

  const modelLower = model.toLowerCase();
  return multimodalModels.some((supportedModel) =>
    modelLower.includes(supportedModel.toLowerCase())
  );
}

/**
 * 为不支持多模态的模型创建文本描述
 */
export function createTextDescriptionForAttachments(
  text: string,
  attachments: MessageAttachment[]
): string {
  let description = text;

  for (const attachment of attachments) {
    if (attachment.type === "image") {
      // 检查是否是AI生成的图片
      const isGeneratedImage =
        attachment.name.startsWith("generated-") ||
        attachment.id.startsWith("generated-");

      if (isGeneratedImage) {
        // 对于AI生成的图片，使用简化的描述，避免混乱
        description += `\n\n[✅ 图片生成完成]`;
      } else {
        // 对于用户上传的图片，使用原有逻辑
        description += `\n\n[用户上传了一张图片：${
          attachment.name
        }，大小：${Math.round(attachment.size / 1024)}KB`;

        if (attachment.content?.metadata) {
          const { width, height } = attachment.content.metadata as {
            width?: number;
            height?: number;
          };
          if (width && height) {
            description += `，尺寸：${width}x${height}`;
          }
        }

        description += `，链接：${attachment.url}]`;

        // 根据是否有base64数据提供不同的提示
        if (attachment.content?.base64) {
          description += `\n✅ 图片内容已加载，我可以直接分析这张图片。`;
        } else {
          description += `\n⚠️ 图片内容未加载，我只能根据文件信息和您的描述来提供帮助。`;
        }
      }
    } else if (attachment.content?.text) {
      description += `\n\n文件：${attachment.name}\n内容：\n${attachment.content.text}`;
    } else {
      description += `\n\n[用户上传了文件：${attachment.name}，类型：${
        attachment.type
      }，大小：${Math.round(attachment.size / 1024)}KB，链接：${
        attachment.url
      }]`;
    }
  }

  return description;
}

/**
 * 智能处理消息和附件
 */
export function processMessageWithAttachments(
  text: string,
  attachments: MessageAttachment[] | undefined,
  model: string
): HumanMessage {
  if (!attachments || attachments.length === 0) {
    return new HumanMessage(text);
  }

  // 检查模型是否支持多模态
  if (supportsMultimodal(model)) {
    // 检查是否有图片附件且包含base64数据
    const hasImageWithBase64 = attachments.some(
      (att) => att.type === "image" && att.content?.base64
    );

    if (hasImageWithBase64) {
      console.log("🖼️ 使用真正的多模态消息处理");
      return createTrueMultimodalMessage(text, attachments, model);
    }
  }

  // 降级到文本描述模式
  console.log("📝 使用文本描述模式处理附件");
  const textWithDescription = createTextDescriptionForAttachments(
    text,
    attachments
  );
  return new HumanMessage(textWithDescription);
}

/**
 * 获取附件摘要信息
 */
export function getAttachmentsSummary(
  attachments: MessageAttachment[]
): string {
  if (attachments.length === 0) return "";

  const summary = attachments
    .map((att) => {
      const sizeKB = Math.round(att.size / 1024);
      const hasBase64 = !!att.content?.base64;
      return `${att.name} (${att.type}, ${sizeKB}KB${
        hasBase64 ? ", 已编码" : ", 未编码"
      })`;
    })
    .join(", ");

  return `附件：${summary}`;
}

/**
 * 调试多模态功能
 */
export function debugMultimodalSupport(model: string): void {
  console.log("🔍 多模态支持调试:", {
    model,
    supportsMultimodal: supportsMultimodal(model),
    isGemini: model.includes("gemini"),
    isOpenAI: model.includes("gpt"),
    supportedModels: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "gpt-4-vision",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-pro-vision",
      "claude-3-opus",
      "claude-3-sonnet",
      "claude-3-haiku",
    ],
  });
}
