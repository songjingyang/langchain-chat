"use client";

import React, { useEffect, useRef } from "react";
import { Message } from "@/lib/types";
import { MessageItem } from "./MessageItem";

interface MessageListProps {
  messages: Message[];
  streamingMessageId?: string | null;
  className?: string;
}

export function MessageList({
  messages,
  streamingMessageId,
  className = "",
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessageId]);

  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium mb-2">开始新对话</h3>
          <p className="text-sm">选择一个AI模型，然后输入您的问题</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <div key={message.id} className="group">
            <MessageItem
              message={message}
              isStreaming={streamingMessageId === message.id}
            />
          </div>
        ))}

        {/* 滚动锚点 */}
        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
