// 文件内容提取工具

import { MessageAttachment } from "@/lib/types";

/**
 * 将文件转换为Base64编码
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // 移除data:image/jpeg;base64,前缀，只保留base64数据
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 提取文本文件内容
 */
export async function extractTextContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsText(file, "utf-8");
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * 检查文件类型
 */
export function getFileType(
  file: File
): "image" | "document" | "video" | "audio" {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "document";
}

/**
 * 检查文件是否支持内容提取
 */
export function isContentExtractable(file: File): boolean {
  const type = getFileType(file);

  // 图片文件支持base64编码
  if (type === "image") return true;

  // 文本文档支持内容提取
  if (type === "document") {
    const textTypes = [
      "text/plain",
      "text/markdown",
      "application/json",
      "text/csv",
      "text/html",
      "text/css",
      "text/javascript",
      "application/javascript",
    ];
    return textTypes.includes(file.type);
  }

  return false;
}

/**
 * 提取文件内容用于AI分析
 */
export async function extractFileContent(
  file: File
): Promise<MessageAttachment["content"]> {
  const type = getFileType(file);

  try {
    if (type === "image") {
      // 图片文件转换为base64
      const base64 = await fileToBase64(file);
      return {
        base64,
        metadata: {
          width: 0, // 可以通过Image对象获取实际尺寸
          height: 0,
          format: file.type,
        },
      };
    } else if (type === "document" && isContentExtractable(file)) {
      // 文本文档提取内容
      const text = await extractTextContent(file);
      return {
        text,
        metadata: {
          encoding: "utf-8",
          format: file.type,
          length: text.length,
        },
      };
    }
  } catch (error) {
    console.error("文件内容提取失败:", error);
  }

  return undefined;
}

/**
 * 创建消息附件对象
 */
export async function createMessageAttachment(
  file: File,
  url: string
): Promise<MessageAttachment> {
  const content = await extractFileContent(file);

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: file.name,
    type: getFileType(file),
    url,
    size: file.size,
    mimeType: file.type,
    content,
  };
}

/**
 * 获取图片尺寸
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("不是图片文件"));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法加载图片"));
    };

    img.src = url;
  });
}

/**
 * 增强的消息附件创建（包含图片尺寸）
 */
export async function createEnhancedMessageAttachment(
  file: File,
  url: string,
  uploadResult?: unknown
): Promise<MessageAttachment> {
  const content = await extractFileContent(file);
  const type = getFileType(file);

  // 如果是图片，获取尺寸信息
  if (type === "image" && content) {
    try {
      const dimensions = await getImageDimensions(file);
      if (content.metadata) {
        content.metadata.width = dimensions.width;
        content.metadata.height = dimensions.height;
      }
    } catch (error) {
      console.warn("获取图片尺寸失败:", error);
    }
  }

  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: file.name,
    type,
    url,
    size: file.size,
    mimeType: file.type,
    content,
  };
}
