'use client';

import React, { useState } from 'react';
import { Session } from '@/lib/types';
import { SessionItem } from './SessionItem';

interface SessionListProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  className?: string;
}

export function SessionList({
  sessions,
  currentSessionId,
  onSessionSelect,
  onSessionDelete,
  onSessionRename,
  className = ''
}: SessionListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤会话
  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(msg => 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 搜索框 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredSessions.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            {searchQuery ? (
              <div>
                <div className="text-4xl mb-2">🔍</div>
                <p className="text-sm">未找到匹配的对话</p>
              </div>
            ) : (
              <div>
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">暂无对话历史</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                onClick={() => onSessionSelect(session.id)}
                onDelete={() => onSessionDelete(session.id)}
                onRename={(newTitle) => onSessionRename(session.id, newTitle)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      {sessions.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            共 {sessions.length} 个对话
            {searchQuery && filteredSessions.length !== sessions.length && (
              <span> · 显示 {filteredSessions.length} 个</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
