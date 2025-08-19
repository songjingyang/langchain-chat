"use client";

import React, { useState } from "react";
import { Message } from "@/lib/types";
import { formatMessageTime } from "@/lib/storage/messages";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { TypewriterText } from "./TypewriterText";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export function MessageItem({
  message,
  isStreaming = false,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("复制失败:", error);
    }
  };

  return (
    <div
      className={`flex gap-4 p-4 ${
        isUser ? "bg-blue-50 dark:bg-blue-900/20" : "bg-white dark:bg-gray-800"
      }`}
    >
      {/* 头像 */}
      <div className="flex-shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
            isUser ? "bg-blue-500" : "bg-green-500"
          }`}
        >
          {isUser ? "👤" : "🤖"}
        </div>
      </div>

      {/* 消息内容 */}
      <div className="flex-1 min-w-0">
        {/* 消息头部 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {isUser ? "用户" : "助手"}
          </span>
          {message.model && (
            <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
              {message.model}
            </span>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatMessageTime(message.timestamp)}
          </span>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">
                正在输入...
              </span>
            </div>
          )}
        </div>

        {/* 消息文本 */}
        <div className="max-w-none">
          {isUser ? (
            // 用户消息使用简单文本显示
            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
              {message.content}
            </div>
          ) : // AI消息使用Markdown渲染和打字机效果
          isStreaming ? (
            <TypewriterText
              text={message.content}
              speed={20}
              isStreaming={true}
            />
          ) : (
            <MarkdownRenderer content={message.content} isStreaming={false} />
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={copyToClipboard}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="复制消息"
          >
            {copied ? (
              <>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                复制
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
