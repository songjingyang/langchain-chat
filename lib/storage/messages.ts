import { Message, MessageAttachment } from "../types";
import { v4 as uuidv4 } from "uuid";

// 创建用户消息
export function createUserMessage(
  content: string,
  attachments?: MessageAttachment[]
): Message {
  return {
    id: uuidv4(),
    content,
    role: "user",
    timestamp: new Date(),
    attachments,
  };
}

// 创建助手消息
export function createAssistantMessage(
  content: string,
  model?: string
): Message {
  return {
    id: uuidv4(),
    content,
    role: "assistant",
    timestamp: new Date(),
    model,
  };
}

// 格式化消息时间
export function formatMessageTime(timestamp: Date): string {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return timestamp.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// 导出消息为文本
export function exportMessagesToText(messages: Message[]): string {
  return messages
    .map((msg) => {
      const time = formatMessageTime(msg.timestamp);
      const role = msg.role === "user" ? "用户" : "助手";
      const model = msg.model ? ` (${msg.model})` : "";

      return `[${time}] ${role}${model}:\n${msg.content}\n`;
    })
    .join("\n");
}

// 导出消息为JSON
export function exportMessagesToJSON(messages: Message[]): string {
  return JSON.stringify(messages, null, 2);
}

// 导出消息为Markdown
export function exportMessagesToMarkdown(messages: Message[]): string {
  return messages
    .map((msg) => {
      const time = formatMessageTime(msg.timestamp);
      const role = msg.role === "user" ? "👤 用户" : "🤖 助手";
      const model = msg.model ? ` (${msg.model})` : "";

      return `## ${role}${model}\n*${time}*\n\n${msg.content}\n`;
    })
    .join("\n---\n\n");
}

// 计算消息统计
export function getMessageStats(messages: Message[]) {
  const userMessages = messages.filter((m) => m.role === "user");
  const assistantMessages = messages.filter((m) => m.role === "assistant");

  const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
  const avgMessageLength =
    messages.length > 0 ? Math.round(totalChars / messages.length) : 0;

  return {
    total: messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    totalChars,
    avgMessageLength,
  };
}
