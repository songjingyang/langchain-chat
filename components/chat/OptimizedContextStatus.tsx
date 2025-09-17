"use client";

import React from "react";
import { Message, ModelProvider } from "@/lib/types";
import {
  DEFAULT_CONTEXT_CONFIGS,
  getContextStats,
} from "@/lib/context/manager";

interface ContextStatusProps {
  messages: Message[];
  model: ModelProvider;
  onClearContext: () => void;
  className?: string;
}

// React Compiler 会自动优化此组件，无需手动 React.memo
export function OptimizedContextStatus({
  messages,
  model,
  onClearContext,
  className = "",
}: ContextStatusProps) {
  const config = DEFAULT_CONTEXT_CONFIGS[model];

  // React Compiler 会自动缓存这些计算，无需手动 useMemo
  const stats = getContextStats(messages, config);

  // React Compiler 会自动优化这些值的计算
  const statusColor = stats.isLimited 
    ? "text-orange-600 dark:text-orange-400"
    : stats.messageCount > config.maxMessages * 0.8
    ? "text-yellow-600 dark:text-yellow-400"
    : "text-green-600 dark:text-green-400";

  const statusIcon = stats.isLimited 
    ? "⚠️"
    : stats.messageCount > config.maxMessages * 0.8 
    ? "⚡"
    : "✅";

  if (messages.length === 0) return null;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-sm ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex items-center gap-1 ${statusColor}`}>
          <span>{statusIcon}</span>
          <span>
            上下文: {stats.messageCount}/{config.maxMessages} 条消息
          </span>
        </span>

        <span className="text-gray-500 dark:text-gray-400">
          约 {Math.round(stats.estimatedTokens).toLocaleString()} tokens
        </span>

        {stats.isLimited && (
          <span className="text-orange-600 dark:text-orange-400 text-xs">
            已达上限，将自动截断
          </span>
        )}
      </div>

      <button
        onClick={onClearContext}
        className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        title="清除上下文"
      >
        清除上下文
      </button>
    </div>
  );
}

// 为了向后兼容，导出原名称
export { OptimizedContextStatus as ContextStatus };
