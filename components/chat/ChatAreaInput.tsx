"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ModelProvider } from "@/lib/types";
import { MentionPopup } from "./MentionPopup";

import { EmojiPicker } from "./EmojiPicker";
import { FileUpload } from "./FileUpload";
import { UnifiedUploadResult, uploadService } from "@/lib/upload/service";
import { createEnhancedMessageAttachment } from "@/lib/file/content-extractor";
import { MessageAttachment } from "@/lib/types";
import { validateFile } from "@/lib/chat/mockData";
import { TypewriterSettings } from "../ui/TypewriterSettings";
import {
  getUserPreferences,
  TypewriterPreferences,
} from "@/lib/ui/typewriter-config";
import { PromptOptimizer } from "./PromptOptimizer";
import { MediaGenerator } from "./MediaGenerator";

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  preview?: string;
  uploadResult?: UnifiedUploadResult;
  url?: string; // 上传成功后的访问URL
}

interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
}

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  messageCount: number;
  participants: number;
}

interface ChatAreaInputProps {
  onSendMessage: (content: string, attachments?: MessageAttachment[]) => void;
  isLoading: boolean;
  selectedModel: ModelProvider;
  onModelChange: (model: ModelProvider) => void;
  className?: string;
}

export function ChatAreaInput({
  onSendMessage,
  isLoading,
  selectedModel,
  onModelChange,
  className = "",
}: ChatAreaInputProps) {
  const [content, setContent] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(56);

  // 提及功能状态
  const [showMentions, setShowMentions] = useState(false);
  const [mentionType, setMentionType] = useState<"@" | "#" | null>(null);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // 表情选择器状态
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  // 文件上传状态
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // 打字机设置状态
  const [showTypewriterSettings, setShowTypewriterSettings] = useState(false);
  const [typewriterPreferences, setTypewriterPreferences] =
    useState<TypewriterPreferences>(getUserPreferences());

  // 自动调整文本框高度
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "56px";
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, 56), 200);
    setTextareaHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // 检测提及
    detectMentions(newContent, e.target.selectionStart);
  };

  // 检测提及
  const detectMentions = (text: string, cursorPosition: number) => {
    const beforeCursor = text.slice(0, cursorPosition);
    const words = beforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    // 检测@提及
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1);
      setMentionType("@");
      setMentionQuery(query);
      setShowMentions(true);
      updateMentionPosition();
    }
    // 检测#话题
    else if (lastWord.startsWith("#")) {
      const query = lastWord.slice(1);
      setMentionType("#");
      setMentionQuery(query);
      setShowMentions(true);
      updateMentionPosition();
    }
    // 隐藏弹窗
    else {
      setShowMentions(false);
    }
  };

  // 更新提及弹窗位置
  const updateMentionPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    setMentionPosition({
      top: rect.top - 300,
      left: rect.left,
    });
  };

  // 处理提及选择
  const handleMentionSelect = (item: User | Topic) => {
    const textarea = textareaRef.current;
    if (!textarea || !mentionType) return;

    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    // 找到最后一个触发符的位置
    const triggerIndex = beforeCursor.lastIndexOf(mentionType);
    if (triggerIndex === -1) return;

    const beforeTrigger = content.slice(0, triggerIndex);
    const replacement =
      mentionType === "@" ? `@${item.name} ` : `#${item.name} `;
    const newContent = beforeTrigger + replacement + afterCursor;

    setContent(newContent);
    setShowMentions(false);

    // 设置光标位置
    setTimeout(() => {
      const newCursorPosition = triggerIndex + replacement.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  // 处理表情选择
  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    const newContent = beforeCursor + emoji + afterCursor;
    setContent(newContent);

    // 设置光标位置
    setTimeout(() => {
      const newCursorPosition = cursorPosition + emoji.length;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      textarea.focus();
    }, 0);
  };

  // 处理发送消息
  const handleSendMessage = useCallback(async () => {
    if (
      (!content.trim() && uploadedFiles.length === 0) ||
      isLoading ||
      isComposing
    )
      return;

    try {
      // 如果有上传的文件，需要转换为附件格式
      if (uploadedFiles.length > 0) {
        const attachments: MessageAttachment[] = [];

        for (const file of uploadedFiles) {
          if (file.status === "completed" && file.url) {
            // 创建附件对象
            const attachment = await createEnhancedMessageAttachment(
              file.file,
              file.url,
              file.uploadResult
            );
            attachments.push(attachment);
          }
        }

        // 发送带附件的消息
        const messageText = content.trim() || ""; // 允许空文本但有图片
        console.log("📤 发送带附件的消息:", {
          textLength: messageText.length,
          attachmentCount: attachments.length,
          attachments: attachments.map((att) => ({
            name: att.name,
            type: att.type,
            hasBase64: !!att.content?.base64,
            size: Math.round(att.size / 1024) + "KB",
          })),
        });
        onSendMessage(messageText, attachments);
      } else {
        // 普通文本消息
        onSendMessage(content.trim());
      }

      // 清空输入
      setContent("");
      setUploadedFiles([]);

      setTimeout(() => {
        setTextareaHeight(56);
        if (textareaRef.current) {
          textareaRef.current.style.height = "56px";
        }
      }, 0);
    } catch (error) {
      console.error("发送消息失败:", error);
      // TODO: 添加用户友好的错误提示
      alert("发送消息失败，请重试");
    }
  }, [content, uploadedFiles, isLoading, isComposing, onSendMessage]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果有弹窗打开，不处理Enter键
    if (showMentions) {
      return;
    }

    if (e.key === "Enter") {
      if (e.shiftKey || e.ctrlKey) {
        return; // 换行
      } else {
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  // 处理表情按钮点击
  const handleEmojiButtonClick = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    setEmojiPickerPosition({
      top: rect.top - 420,
      left: rect.left,
    });
    setShowEmojiPicker(!showEmojiPicker);
  };

  // 处理文件按钮点击
  const handleFileButtonClick = () => {
    setShowFileUpload(!showFileUpload);
  };

  // 拖拽处理函数
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev - 1);
    if (dragCounter <= 1) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    setDragCounter(0);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (files: File[]) => {
    for (const file of files) {
      // 验证文件
      const validation = validateFile(file, "image");
      if (!validation.valid) {
        console.error("文件验证失败:", validation.error);
        continue;
      }

      // 创建预览
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;

      const uploadedFile: UploadedFile = {
        id: `upload-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        status: "uploading",
        preview,
      };

      // 添加到上传列表
      setUploadedFiles((prev) => [...prev, uploadedFile]);

      try {
        // 开始上传
        const result = await uploadService.uploadFile(file, {
          onProgress: (progress) => {
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id
                  ? { ...f, progress: progress.percentage }
                  : f
              )
            );
          },
        });

        // 上传成功
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "completed" as const,
                  progress: 100,
                  uploadResult: result,
                  url: result.secure_url,
                }
              : f
          )
        );
      } catch (error) {
        console.error("文件上传失败:", error);
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === uploadedFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error instanceof Error ? error.message : "上传失败",
                }
              : f
          )
        );
      }
    }
  };

  // 处理打字机设置按钮点击
  const handleTypewriterSettingsClick = () => {
    setShowTypewriterSettings(true);
  };

  // 处理打字机设置变更
  const handleTypewriterSettingsChange = (
    preferences: TypewriterPreferences
  ) => {
    setTypewriterPreferences(preferences);
  };

  // 处理提示词优化
  const handlePromptOptimized = useCallback(
    (optimizedContent: string) => {
      setContent(optimizedContent);

      // 自动调整文本框高度
      setTimeout(() => {
        adjustTextareaHeight();
      }, 0);
    },
    [adjustTextareaHeight]
  );

  // 处理提示词优化错误
  const handlePromptOptimizeError = useCallback((error: string) => {
    console.error("提示词优化错误:", error);
    // 这里可以显示错误提示，暂时使用console.error
  }, []);

  // 处理媒体生成
  const handleMediaGenerated = useCallback(
    (mediaUrl: string, type: "image" | "video") => {
      // 构建消息内容 - 使用特殊格式避免触发不当的AI响应
      const mediaMessage = `[已完成] ${content}`;

      // 从 data URL 中提取 MIME 类型和 base64 数据
      let extractedMimeType = "image/png"; // 默认类型
      let base64Data = "";
      let fileExtension = "png";
      let actualType: "image" | "video" = "image"; // 根据实际MIME类型确定

      if (mediaUrl.startsWith("data:")) {
        const parts = mediaUrl.split(",");
        if (parts.length === 2) {
          const headerPart = parts[0]; // data:image/jpeg;base64 或 data:image/gif;base64
          base64Data = parts[1];

          // 提取 MIME 类型
          const mimeMatch = headerPart.match(/data:([^;]+)/);
          if (mimeMatch) {
            extractedMimeType = mimeMatch[1];

            // 根据实际MIME类型确定附件类型和文件扩展名
            if (extractedMimeType === "image/gif") {
              fileExtension = "gif";
              actualType = "video"; // GIF被视为视频类型进行播放
            } else if (extractedMimeType === "image/jpeg") {
              fileExtension = "jpg";
              actualType = "image";
            } else if (extractedMimeType === "image/png") {
              fileExtension = "png";
              actualType = "image";
            } else if (extractedMimeType === "video/mp4") {
              fileExtension = "mp4";
              actualType = "video";
            } else if (extractedMimeType === "video/webm") {
              fileExtension = "webm";
              actualType = "video";
            }
          }
        }
      }

      // 创建媒体附件对象
      const mediaAttachment: MessageAttachment = {
        id: `generated-${type}-${Date.now()}`,
        type: actualType, // 使用根据MIME类型确定的实际类型
        name: `generated-${type}.${fileExtension}`,
        size: base64Data ? Math.ceil(base64Data.length * 0.75) : 0, // 估算base64的实际大小
        url: mediaUrl,
        mimeType: extractedMimeType,
        content: {
          base64: base64Data || undefined,
          metadata: {
            generated: true,
            prompt: content,
            timestamp: new Date().toISOString(),
            format: extractedMimeType,
            originalRequestType: type, // 记录原始请求类型
          },
        },
      };

      // 调试信息
      console.log(`📸 生成的${type === "video" ? "视频" : "图像"}附件信息:`, {
        requestType: type,
        actualType: actualType,
        mimeType: extractedMimeType,
        fileName: mediaAttachment.name,
        hasBase64: !!base64Data,
        base64Length: base64Data.length,
        estimatedSize: mediaAttachment.size,
        urlPrefix: mediaUrl.substring(0, 50),
        attachmentId: mediaAttachment.id,
        isGif: extractedMimeType === "image/gif",
        willDisplayAs: actualType === "video" ? "视频播放器" : "图像",
      });

      // 发送消息和附件
      onSendMessage(mediaMessage, [mediaAttachment]);

      // 清空输入框
      setContent("");
      setTimeout(() => {
        setTextareaHeight(56);
        if (textareaRef.current) {
          textareaRef.current.style.height = "56px";
        }
      }, 0);
    },
    [content, onSendMessage]
  );

  // 处理媒体生成错误
  const handleMediaGenerateError = useCallback((error: string) => {
    console.error("媒体生成错误:", error);
    // 这里可以显示错误提示，暂时使用console.error
  }, []);

  // 处理文件发送到聊天
  const handleFileSend = async (file: UploadedFile) => {
    if (file.url) {
      try {
        // 创建包含文件内容的附件对象
        const attachment = await createEnhancedMessageAttachment(
          file.file,
          file.url
        );

        // 构建消息内容
        const fileMessage = `我上传了一个${
          attachment.type === "image" ? "图片" : "文件"
        }：${file.file.name}`;

        // 发送消息和附件
        onSendMessage(fileMessage, [attachment]);

        // 发送后从上传列表中移除
        setUploadedFiles((files) => files.filter((f) => f.id !== file.id));
      } catch (error) {
        console.error("处理文件发送失败:", error);
        // 降级处理：只发送文件链接
        const fileMessage = `[文件] ${file.file.name}\n${file.url}`;
        onSendMessage(fileMessage);
        setUploadedFiles((files) => files.filter((f) => f.id !== file.id));
      }
    }
  };

  // 监听内容变化以调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // 模型选项
  const modelOptions = [
    {
      value: "openai" as ModelProvider,
      label: "OpenAI",
      icon: "🤖",
      color: "bg-green-500",
    },
    {
      value: "groq" as ModelProvider,
      label: "Groq",
      icon: "⚡",
      color: "bg-orange-500",
    },
    {
      value: "google" as ModelProvider,
      label: "Google",
      icon: "🔍",
      color: "bg-blue-500",
    },
  ];

  const currentModel = modelOptions.find((m) => m.value === selectedModel);

  return (
    <div className={`bg-white dark:bg-gray-800 ${className}`}>
      {/* 主输入区域 */}
      <div className="p-4">
        <div
          className={`relative bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 transition-all duration-300 ${
            isFocused
              ? "border-blue-500 shadow-lg shadow-blue-500/10 bg-white dark:bg-gray-600"
              : isDraggingOver
              ? "border-blue-400 shadow-lg shadow-blue-400/20 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-600">
            {/* 模型选择器 */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) =>
                    onModelChange(e.target.value as ModelProvider)
                  }
                  className="appearance-none bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 pr-6 cursor-pointer focus:outline-none"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.icon} {option.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <div
                className={`w-2 h-2 rounded-full ${
                  currentModel?.color || "bg-gray-400"
                }`}
              />
            </div>

            {/* 右侧工具 */}
            <div className="flex items-center gap-2">
              {/* 媒体生成按钮 */}
              <MediaGenerator
                content={content}
                onGenerated={handleMediaGenerated}
                onError={handleMediaGenerateError}
                disabled={isLoading}
              />

              {/* 提示词优化按钮 */}
              <PromptOptimizer
                content={content}
                onOptimized={handlePromptOptimized}
                onError={handlePromptOptimizeError}
                disabled={isLoading}
              />

              <button
                onClick={handleEmojiButtonClick}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="表情"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              <button
                onClick={handleFileButtonClick}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="附件"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>

              <button
                onClick={handleTypewriterSettingsClick}
                className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="打字机效果设置"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* 图片预览区域 */}
          {uploadedFiles.length > 0 && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="relative group bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                  >
                    {/* 图片预览 */}
                    {file.preview && (
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-16 h-16 object-cover"
                      />
                    )}

                    {/* 文件信息覆盖层 */}
                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                      {/* 删除按钮 */}
                      <button
                        onClick={() => {
                          setUploadedFiles((files) =>
                            files.filter((f) => f.id !== file.id)
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>

                    {/* 上传状态指示器 */}
                    {file.status === "uploading" && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {file.status === "error" && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-80 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                    )}

                    {/* 文件名提示 */}
                    <div className="absolute -bottom-6 left-0 right-0 text-xs text-gray-500 dark:text-gray-400 truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {file.file.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 文本输入区域 */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                uploadedFiles.length > 0
                  ? "添加描述或直接发送图片..."
                  : "输入消息... (Enter发送，Shift+Enter换行)"
              }
              disabled={isLoading}
              className="w-full px-4 py-3 pr-16 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none border-none outline-none"
              style={{
                height: `${textareaHeight}px`,
                minHeight: "56px",
                maxHeight: "200px",
              }}
            />

            {/* 发送按钮 */}
            <div className="absolute right-3 bottom-3">
              <button
                onClick={handleSendMessage}
                disabled={
                  (!content.trim() && uploadedFiles.length === 0) ||
                  isLoading ||
                  isComposing
                }
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  (content.trim() || uploadedFiles.length > 0) &&
                  !isLoading &&
                  !isComposing
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5 transform rotate-45"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* 底部状态栏 */}
          <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span>@ 提及</span>
              <span># 话题</span>
              <span>/ 命令</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{content.length}/2000</span>
              {content.trim() && (
                <>
                  <span>•</span>
                  <span className="text-blue-500">Enter发送</span>
                </>
              )}
            </div>
          </div>

          {/* 拖拽覆盖层 */}
          {isDraggingOver && (
            <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-400 border-dashed rounded-2xl flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                  释放以上传图片
                </p>
                <p className="text-sm text-blue-500 dark:text-blue-300 mt-1">
                  支持 JPG、PNG、GIF 等格式
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 快捷提示 */}
        {isFocused && content.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: "Enter", desc: "发送消息" },
              { key: "Shift+Enter", desc: "换行" },
              { key: "@", desc: "提及用户" },
              { key: "#", desc: "添加话题" },
            ].map((tip) => (
              <div
                key={tip.key}
                className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md text-xs text-gray-600 dark:text-gray-400"
              >
                <kbd className="px-1 py-0.5 bg-white dark:bg-gray-600 rounded text-xs font-mono">
                  {tip.key}
                </kbd>
                <span>{tip.desc}</span>
              </div>
            ))}
          </div>
        )}

        {/* 文件上传区域 */}
        {showFileUpload && (
          <div className="mt-4">
            <FileUpload
              onFilesUploaded={setUploadedFiles}
              onFileRemove={(fileId) => {
                setUploadedFiles((files) =>
                  files.filter((f) => f.id !== fileId)
                );
              }}
              onFileSend={handleFileSend}
              uploadedFiles={uploadedFiles}
            />
          </div>
        )}
      </div>

      {/* 提及弹窗 */}
      <MentionPopup
        isOpen={showMentions}
        type={mentionType || "@"}
        query={mentionQuery}
        position={mentionPosition}
        onSelect={handleMentionSelect}
        onClose={() => setShowMentions(false)}
        selectedIndex={selectedMentionIndex}
        onSelectedIndexChange={setSelectedMentionIndex}
      />

      {/* 表情选择器 */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onSelect={handleEmojiSelect}
        onClose={() => setShowEmojiPicker(false)}
        position={emojiPickerPosition}
      />

      {/* 打字机设置 */}
      <TypewriterSettings
        isOpen={showTypewriterSettings}
        onClose={() => setShowTypewriterSettings(false)}
        onSettingsChange={handleTypewriterSettingsChange}
      />
    </div>
  );
}
