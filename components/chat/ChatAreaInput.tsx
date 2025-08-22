"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ModelProvider } from "@/lib/types";
import { MentionPopup } from "./MentionPopup";
import { CommandPopup, executeCommand } from "./CommandPopup";
import { EmojiPicker } from "./EmojiPicker";
import { FileUpload } from "./FileUpload";
import { UnifiedUploadResult } from "@/lib/upload/service";
import { createEnhancedMessageAttachment } from "@/lib/file/content-extractor";
import { MessageAttachment } from "@/lib/types";
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

  // 命令功能状态
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);

  // 表情选择器状态
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  // 文件上传状态
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

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

    // 检测提及和命令
    detectMentionsAndCommands(newContent, e.target.selectionStart);
  };

  // 检测提及和命令
  const detectMentionsAndCommands = (text: string, cursorPosition: number) => {
    const beforeCursor = text.slice(0, cursorPosition);
    const words = beforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    // 检测@提及
    if (lastWord.startsWith("@")) {
      const query = lastWord.slice(1);
      setMentionType("@");
      setMentionQuery(query);
      setShowMentions(true);
      setShowCommands(false);
      updateMentionPosition();
    }
    // 检测#话题
    else if (lastWord.startsWith("#")) {
      const query = lastWord.slice(1);
      setMentionType("#");
      setMentionQuery(query);
      setShowMentions(true);
      setShowCommands(false);
      updateMentionPosition();
    }
    // 检测/命令
    else if (lastWord.startsWith("/")) {
      const query = lastWord.slice(1);
      setCommandQuery(query);
      setShowCommands(true);
      setShowMentions(false);
      updateCommandPosition();
    }
    // 隐藏所有弹窗
    else {
      setShowMentions(false);
      setShowCommands(false);
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

  // 更新命令弹窗位置
  const updateCommandPosition = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const rect = textarea.getBoundingClientRect();
    setCommandPosition({
      top: rect.top - 350,
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

  // 处理命令选择
  const handleCommandSelect = (command: {
    id: string;
    command: string;
    description: string;
    icon: string;
    category: string;
  }) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeCursor = content.slice(0, cursorPosition);
    const afterCursor = content.slice(cursorPosition);

    // 找到最后一个/的位置
    const commandIndex = beforeCursor.lastIndexOf("/");
    if (commandIndex === -1) return;

    const beforeCommand = content.slice(0, commandIndex);
    const newContent = beforeCommand + afterCursor;

    setContent(newContent);
    setShowCommands(false);

    // 执行命令
    executeCommand(command, (action, data) => {
      console.log("执行命令:", action, data);
      // 这里可以添加具体的命令执行逻辑
    });

    setTimeout(() => {
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
  const handleSendMessage = useCallback(() => {
    if (!content.trim() || isLoading || isComposing) return;

    onSendMessage(content.trim());
    setContent("");
    setUploadedFiles([]);

    setTimeout(() => {
      setTextareaHeight(56);
      if (textareaRef.current) {
        textareaRef.current.style.height = "56px";
      }
    }, 0);
  }, [content, isLoading, isComposing, onSendMessage]);

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 如果有弹窗打开，不处理Enter键
    if (showMentions || showCommands) {
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
      // 构建消息内容
      const mediaMessage = `我生成了一个${
        type === "image" ? "图片" : "视频"
      }：\n${content}`;

      // 创建媒体附件对象
      const mediaAttachment: MessageAttachment = {
        id: `generated-${type}-${Date.now()}`,
        type: type === "image" ? "image" : "video",
        name: `generated-${type}.${type === "image" ? "png" : "mp4"}`,
        size: 0, // 无法确定base64大小
        url: mediaUrl,
        mimeType: type === "image" ? "image/png" : "video/mp4",
        content: "", // base64数据已包含在url中
      };

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
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
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
              placeholder="输入消息... (Enter发送，Shift+Enter换行)"
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
                disabled={!content.trim() || isLoading || isComposing}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  content.trim() && !isLoading && !isComposing
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
        </div>

        {/* 快捷提示 */}
        {isFocused && content.length === 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { key: "Enter", desc: "发送消息" },
              { key: "Shift+Enter", desc: "换行" },
              { key: "@", desc: "提及用户" },
              { key: "#", desc: "添加话题" },
              { key: "/", desc: "快捷命令" },
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

      {/* 命令弹窗 */}
      <CommandPopup
        isOpen={showCommands}
        query={commandQuery}
        position={commandPosition}
        onSelect={handleCommandSelect}
        onClose={() => setShowCommands(false)}
        selectedIndex={selectedCommandIndex}
        onSelectedIndexChange={setSelectedCommandIndex}
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
