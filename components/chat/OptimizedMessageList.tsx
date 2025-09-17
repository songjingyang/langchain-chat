"use client";

import React from 'react';
import { Message } from '@/lib/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  streamingMessageId?: string | null;
  className?: string;
}

// React Compiler 会自动优化此组件，无需手动 React.memo
export function OptimizedMessageList({
  messages,
  streamingMessageId,
  className = '',
}: MessageListProps) {
  
  // React Compiler 会自动缓存这些计算，无需手动 useMemo
  const processedMessages = messages.map((message, index) => ({
    ...message,
    isLast: index === messages.length - 1,
    isStreaming: message.id === streamingMessageId,
  }));

  // React Compiler 会自动优化函数引用
  const scrollToBottom = () => {
    const container = document.querySelector('[data-message-list]');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // 当有新消息时自动滚动到底部
  React.useEffect(() => {
    if (messages.length > 0) {
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages.length]);

  return (
    <div 
      data-message-list
      className={`h-full overflow-y-auto p-4 space-y-4 ${className}`}
    >
      {processedMessages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg font-medium mb-2">开始新的对话</p>
            <p className="text-sm">输入消息开始与AI助手交流</p>
          </div>
        </div>
      ) : (
        processedMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isStreaming={message.isStreaming}
          />
        ))
      )}
    </div>
  );
}

// 为了向后兼容，导出原名称
export { OptimizedMessageList as MessageList };
