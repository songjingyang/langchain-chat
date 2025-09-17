"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ModelProvider } from "@/lib/types";

// 用户信息接口
interface User {
  id: string;
  name: string;
  avatar?: string;
}

// 话题信息接口
interface Topic {
  id: string;
  name: string;
  description?: string;
}

// 提及建议接口
interface MentionSuggestion {
  type: "user" | "topic";
  data: User | Topic;
  trigger: "@" | "#";
}

interface EnhancedMessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  selectedModel: ModelProvider;
  onModelChange: (model: ModelProvider) => void;
  className?: string;
  users?: User[];
  topics?: Topic[];
}

export function EnhancedMessageInput({
  onSendMessage,
  isLoading,
  selectedModel,
  onModelChange,
  className = "",
  users = [],
  topics = [],
}: EnhancedMessageInputProps) {
  const [content, setContent] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = useState(56); // 初始高度

  // 提及功能状态
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionTrigger, setMentionTrigger] = useState<"@" | "#" | null>(null);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // 自动调整文本框高度 - 需要在useEffect中使用，保留useCallback
  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // 重置高度以获取正确的scrollHeight
    textarea.style.height = "56px";
    const scrollHeight = textarea.scrollHeight;

    // 设置最小高度56px，最大高度200px
    const newHeight = Math.min(Math.max(scrollHeight, 56), 200);
    setTextareaHeight(newHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // 处理发送消息 - React Compiler 会自动优化函数引用
  const handleSendMessage = () => {
    if (!content.trim() || isLoading || isComposing) return;

    onSendMessage(content.trim());
    setContent("");

    // 重置文本框高度
    setTimeout(() => {
      setTextareaHeight(56);
      if (textareaRef.current) {
        textareaRef.current.style.height = "56px";
      }
    }, 0);
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey || e.ctrlKey) {
        // Shift+Enter 或 Ctrl+Enter 换行
        return;
      } else {
        // Enter 发送消息
        e.preventDefault();
        handleSendMessage();
      }
    }
  };

  // 处理输入法状态
  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  // 处理焦点状态
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  // 监听内容变化以调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [content, adjustTextareaHeight]);

  // 模型选项
  const modelOptions = [
    { value: "openai" as ModelProvider, label: "OpenAI", icon: "🤖" },
    { value: "groq" as ModelProvider, label: "Groq", icon: "⚡" },
    { value: "google" as ModelProvider, label: "Google", icon: "🔍" },
  ];

  return (
    <div
      className={`bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}
    >
      {/* 模型选择器 */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            模型:
          </span>
          <div className="flex gap-1">
            {modelOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onModelChange(option.value)}
                className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                  selectedModel === option.value
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="p-4">
        <div
          className={`relative bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 transition-all duration-200 ${
            isFocused
              ? "border-blue-500 shadow-lg shadow-blue-500/20"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          {/* 文本输入区域 */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}
              onFocus={handleFocus}
              onBlur={handleBlur}
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
            <div className="absolute right-2 bottom-2">
              <button
                onClick={handleSendMessage}
                disabled={!content.trim() || isLoading || isComposing}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                  content.trim() && !isLoading && !isComposing
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg
                    className="w-5 h-5"
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

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-600">
            {/* 左侧工具 */}
            <div className="flex items-center gap-2">
              {/* 表情按钮 */}
              <button
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="表情"
              >
                <svg
                  className="w-5 h-5"
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

              {/* 附件按钮 */}
              <button
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="附件"
              >
                <svg
                  className="w-5 h-5"
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
            </div>

            {/* 右侧信息 */}
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>{content.length}/2000</span>
              <span>•</span>
              <span>Enter发送</span>
            </div>
          </div>
        </div>

        {/* 快捷提示 */}
        {isFocused && content.length === 0 && (
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Enter 发送
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Shift+Enter 换行
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                @ 提及
              </span>
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                # 话题
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
