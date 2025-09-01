"use client";

import React, { useMemo } from 'react';
import { Message } from '@/lib/types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: Message[];
  streamingMessageId?: string | null;
  className?: string;
}

// 性能优化：使用React.memo防止不必要的重新渲染
export const OptimizedMessageList = React.memo(function MessageList({
  messages,
  streamingMessageId,
  className = '',
}: MessageListProps) {
  
  // 性能优化：使用useMemo缓存消息列表处理
  const processedMessages = useMemo(() => {
    return messages.map((message, index) => ({
      ...message,
      isLast: index === messages.length - 1,
      isStreaming: message.id === streamingMessageId,
    }));
  }, [messages, streamingMessageId]);

  // 性能优化：缓存滚动到底部的逻辑
  const scrollToBottom = useMemo(() => {
    return () => {
      const container = document.querySelector('[data-message-list]');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    };
  }, []);

  // 当有新消息时自动滚动到底部
  React.useEffect(() => {
    if (messages.length > 0) {
      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages.length, scrollToBottom]);

  return (
    <div 
      data-message-list
      className={`flex-1 overflow-y-auto p-4 space-y-4 ${className}`}
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
});

// 为了向后兼容，导出原名称
export { OptimizedMessageList as MessageList };
