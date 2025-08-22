// 多模态AI消息处理

import { HumanMessage } from "@langchain/core/messages";
import { MessageAttachment } from "@/lib/types";

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
    "gpt-4-vision-preview",
    "gpt-4-turbo",
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3-opus",
    "claude-3-sonnet",
    "claude-3-haiku",
    "gemini-pro-vision",
    "gemini-1.5-pro",
  ];

  return multimodalModels.some((supportedModel) =>
    model.toLowerCase().includes(supportedModel.toLowerCase())
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
        description += `\n请注意：我无法直接查看图片内容，但可以根据文件名和您的描述来提供帮助。如果您需要我分析图片内容，请描述一下图片中的内容。`;
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

  // 目前简化处理，直接使用文本描述
  // 未来可以根据模型支持情况启用真正的多模态
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
      return `${att.name} (${att.type}, ${sizeKB}KB)`;
    })
    .join(", ");

  return `附件：${summary}`;
}
