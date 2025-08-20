"use client";

import React, { useState, useEffect, useRef } from "react";
import { mockUsers, mockTopics } from "@/lib/chat/mockData";

interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
}

interface Topic {
  id: string;
  name: string;
  description: string;
  color: string;
  messageCount: number;
  participants: number;
}

interface MentionPopupProps {
  isOpen: boolean;
  type: "@" | "#";
  query: string;
  position: { top: number; left: number };
  onSelect: (item: User | Topic) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function MentionPopup({
  isOpen,
  type,
  query,
  position,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
}: MentionPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [filteredItems, setFilteredItems] = useState<(User | Topic)[]>([]);

  // 过滤数据
  useEffect(() => {
    if (type === "@") {
      const filtered = mockUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.role.toLowerCase().includes(query.toLowerCase())
      ) as (User | Topic)[];
      setFilteredItems(filtered);
    } else if (type === "#") {
      const filtered = mockTopics.filter(
        (topic) =>
          topic.name.toLowerCase().includes(query.toLowerCase()) ||
          topic.description.toLowerCase().includes(query.toLowerCase())
      ) as (User | Topic)[];
      setFilteredItems(filtered);
    }
  }, [type, query]);

  // 重置选中索引
  useEffect(() => {
    onSelectedIndexChange(0);
  }, [filteredItems, onSelectedIndexChange]);

  // 处理键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          onSelectedIndexChange(Math.max(0, selectedIndex - 1));
          break;
        case "ArrowDown":
          e.preventDefault();
          onSelectedIndexChange(
            Math.min(filteredItems.length - 1, selectedIndex + 1)
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            onSelect(filteredItems[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    selectedIndex,
    filteredItems,
    onSelect,
    onClose,
    onSelectedIndexChange,
  ]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen || filteredItems.length === 0) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "offline":
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        minWidth: "280px",
      }}
    >
      {/* 头部 */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{type === "@" ? "👥" : "#️⃣"}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {type === "@" ? "选择用户" : "选择话题"}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({filteredItems.length})
          </span>
        </div>
      </div>

      {/* 列表 */}
      <div className="py-1">
        {filteredItems.map((item, index) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
              index === selectedIndex
                ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                : ""
            }`}
          >
            {type === "@" ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={(item as User).avatar}
                    alt={(item as User).name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      (
                        e.target as HTMLImageElement
                      ).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        (item as User).name
                      )}&size=32&background=random`;
                    }}
                  />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(
                      (item as User).status
                    )}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {(item as User).name}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded">
                      {(item as User).role}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {(item as User).email}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: (item as Topic).color }}
                >
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {(item as Topic).name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(item as Topic).messageCount} 条消息
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {(item as Topic).description}
                  </div>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>↑↓ 选择</span>
          <span>Enter 确认</span>
          <span>Esc 取消</span>
        </div>
      </div>
    </div>
  );
}
