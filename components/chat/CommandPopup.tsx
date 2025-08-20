"use client";

import React, { useState, useEffect, useRef } from "react";
import { mockCommands } from "@/lib/chat/mockData";

interface Command {
  id: string;
  command: string;
  description: string;
  icon: string;
  category: string;
}

interface CommandPopupProps {
  isOpen: boolean;
  query: string;
  position: { top: number; left: number };
  onSelect: (command: Command) => void;
  onClose: () => void;
  selectedIndex: number;
  onSelectedIndexChange: (index: number) => void;
}

export function CommandPopup({
  isOpen,
  query,
  position,
  onSelect,
  onClose,
  selectedIndex,
  onSelectedIndexChange,
}: CommandPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [groupedCommands, setGroupedCommands] = useState<
    Record<string, Command[]>
  >({});

  // 过滤和分组命令
  useEffect(() => {
    const filtered = mockCommands.filter(
      (command) =>
        command.command.toLowerCase().includes(query.toLowerCase()) ||
        command.description.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredCommands(filtered);

    // 按分类分组
    const grouped = filtered.reduce((acc, command) => {
      if (!acc[command.category]) {
        acc[command.category] = [];
      }
      acc[command.category].push(command);
      return acc;
    }, {} as Record<string, Command[]>);

    setGroupedCommands(grouped);
  }, [query]);

  // 重置选中索引
  useEffect(() => {
    onSelectedIndexChange(0);
  }, [filteredCommands, onSelectedIndexChange]);

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
            Math.min(filteredCommands.length - 1, selectedIndex + 1)
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelect(filteredCommands[selectedIndex]);
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
    filteredCommands,
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

  if (!isOpen || filteredCommands.length === 0) return null;

  // 获取当前选中命令的全局索引
  let currentIndex = 0;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        minWidth: "320px",
      }}
    >
      {/* 头部 */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            快捷命令
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({filteredCommands.length})
          </span>
        </div>
      </div>

      {/* 命令列表 */}
      <div className="py-1">
        {Object.entries(groupedCommands).map(([category, commands]) => (
          <div key={category}>
            {/* 分类标题 */}
            <div className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50">
              {category}
            </div>

            {/* 命令项 */}
            {commands.map((command) => {
              const isSelected = currentIndex === selectedIndex;
              currentIndex++;

              return (
                <button
                  key={command.id}
                  onClick={() => onSelect(command)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    isSelected
                      ? "bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{command.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                          {command.command}
                        </code>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {command.description}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* 底部提示 */}
      <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>↑↓ 选择</span>
          <span>Enter 执行</span>
          <span>Esc 取消</span>
        </div>
      </div>
    </div>
  );
}

// 命令执行函数
export const executeCommand = (
  command: Command,
  onAction?: (action: string, data?: unknown) => void
) => {
  switch (command.id) {
    case "help":
      onAction?.("showHelp");
      break;
    case "clear":
      if (confirm("确定要清空当前对话吗？")) {
        onAction?.("clearChat");
      }
      break;
    case "export":
      onAction?.("exportChat");
      break;
    case "settings":
      onAction?.("openSettings");
      break;
    case "translate":
      onAction?.("translate");
      break;
    case "summarize":
      onAction?.("summarize");
      break;
    case "code":
      onAction?.("formatCode");
      break;
    case "remind":
      onAction?.("setReminder");
      break;
    default:
      console.log("执行命令:", command.command);
  }
};
