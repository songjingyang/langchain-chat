'use client';

import React from 'react';
import { Message, ModelProvider, ContextStats } from '@/lib/types';
import { getContextStats, DEFAULT_CONTEXT_CONFIGS, formatContextStats } from '@/lib/context/manager';

interface ContextStatusProps {
  messages: Message[];
  model: ModelProvider;
  onClearContext?: () => void;
  className?: string;
}

export function ContextStatus({ 
  messages, 
  model, 
  onClearContext, 
  className = '' 
}: ContextStatusProps) {
  const config = DEFAULT_CONTEXT_CONFIGS[model];
  const stats = getContextStats(messages, config);
  
  const getStatusColor = () => {
    if (stats.isLimited) return 'text-orange-600 dark:text-orange-400';
    if (stats.messageCount > config.maxMessages * 0.8) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusIcon = () => {
    if (stats.isLimited) return '⚠️';
    if (stats.messageCount > config.maxMessages * 0.8) return '⚡';
    return '✅';
  };

  if (messages.length === 0) return null;

  return (
    <div className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div className="text-sm">
          <span className="text-gray-600 dark:text-gray-400">上下文: </span>
          <span className={getStatusColor()}>
            {formatContextStats(stats)}
          </span>
        </div>
        
        {stats.isLimited && (
          <div className="text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded">
            已自动截断
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* 上下文限制信息 */}
        <div className="text-xs text-gray-500 dark:text-gray-400">
          最大: {config.maxMessages}条 / {config.maxTokens}tokens
        </div>
        
        {/* 清除上下文按钮 */}
        {onClearContext && messages.length > 0 && (
          <button
            onClick={onClearContext}
            className="text-xs px-2 py-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="清除对话上下文"
          >
            清除上下文
          </button>
        )}
      </div>
    </div>
  );
}

// 上下文详情弹窗组件
interface ContextDetailsProps {
  messages: Message[];
  model: ModelProvider;
  isOpen: boolean;
  onClose: () => void;
}

export function ContextDetails({ messages, model, isOpen, onClose }: ContextDetailsProps) {
  if (!isOpen) return null;

  const config = DEFAULT_CONTEXT_CONFIGS[model];
  const stats = getContextStats(messages, config);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            上下文详情
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">消息数量</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.messageCount} / {config.maxMessages}
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-600 dark:text-gray-400">估算Tokens</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stats.estimatedTokens} / {config.maxTokens}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">模型配置</div>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              <div>模型: {model}</div>
              <div>策略: {config.strategy}</div>
              <div>状态: {stats.isLimited ? '已限制' : '正常'}</div>
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            * Token数量为估算值，实际消耗可能有差异
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
