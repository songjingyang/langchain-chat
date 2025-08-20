'use client';

import React, { useState, useEffect, useRef } from 'react';
import { mockEmojis } from '@/lib/chat/mockData';

interface EmojiPickerProps {
  isOpen: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function EmojiPicker({ isOpen, onSelect, onClose, position }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(mockEmojis.recent);
  const pickerRef = useRef<HTMLDivElement>(null);

  const categories = [
    { id: 'recent', name: '最近', icon: '🕒' },
    { id: 'smileys', name: '表情', icon: '😀' },
    { id: 'gestures', name: '手势', icon: '👋' },
    { id: 'hearts', name: '爱心', icon: '❤️' },
    { id: 'objects', name: '物品', icon: '🎉' },
  ];

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleEmojiSelect = (emoji: string) => {
    onSelect(emoji);
    
    // 更新最近使用的表情
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      return [emoji, ...filtered].slice(0, 8);
    });
    
    onClose();
  };

  const getCurrentEmojis = () => {
    switch (activeCategory) {
      case 'recent':
        return recentEmojis;
      case 'smileys':
        return mockEmojis.smileys;
      case 'gestures':
        return mockEmojis.gestures;
      case 'hearts':
        return mockEmojis.hearts;
      case 'objects':
        return mockEmojis.objects;
      default:
        return [];
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        width: '320px',
        height: '400px',
      }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-600">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          选择表情
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 分类标签 */}
      <div className="flex border-b border-gray-200 dark:border-gray-600">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-1 p-2 text-center transition-colors ${
              activeCategory === category.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={category.name}
          >
            <span className="text-lg">{category.icon}</span>
          </button>
        ))}
      </div>

      {/* 表情网格 */}
      <div className="p-2 overflow-y-auto" style={{ height: 'calc(400px - 120px)' }}>
        {getCurrentEmojis().length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">😊</div>
              <p className="text-sm">暂无表情</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-8 gap-1">
            {getCurrentEmojis().map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleEmojiSelect(emoji)}
                className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          点击表情插入到输入框
        </div>
      </div>
    </div>
  );
}
