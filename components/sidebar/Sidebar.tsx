'use client';

import React from 'react';
import { Session, ModelProvider } from '@/lib/types';
import { SessionList } from './SessionList';
import { ModelSelector } from '../ui/ModelSelector';
import { ThemeToggle } from '../ui/ThemeToggle';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  selectedModel: ModelProvider;
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onModelChange: (model: ModelProvider) => void;
  onExportSessions: () => void;
  className?: string;
}

export function Sidebar({
  sessions,
  currentSessionId,
  selectedModel,
  onNewSession,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
  onModelChange,
  onExportSessions,
  className = ''
}: SidebarProps) {
  return (
    <div className={`flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${className}`}>
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            LangChain Chat
          </h1>
          <ThemeToggle />
        </div>
        
        {/* 新建对话按钮 */}
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建对话
        </button>
      </div>

      {/* 模型选择器 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          选择AI模型
        </label>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
      </div>

      {/* 会话列表 */}
      <div className="flex-1 min-h-0">
        <SessionList
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSessionSelect={onSessionSelect}
          onSessionDelete={onSessionDelete}
          onSessionRename={onSessionRename}
        />
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <button
            onClick={onExportSessions}
            disabled={sessions.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            导出对话
          </button>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            版本 1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}
