"use client";

import React, { useState } from "react";

interface PromptOptimizerProps {
  content: string;
  onOptimized: (optimizedContent: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface OptimizationResult {
  original: string;
  optimized: string;
  improvements: string[];
  provider: string;
  requestedProvider?: string;
  timestamp: string;
}

export function PromptOptimizer({
  content,
  onOptimized,
  onError,
  disabled = false,
  className = "",
}: PromptOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 优化提示词 - React Compiler 会自动优化函数引用
  const optimizePrompt = async () => {
    if (!content.trim()) {
      onError?.("请先输入内容再进行优化");
      return;
    }

    if (content.length > 2000) {
      onError?.("内容过长，请控制在2000字符以内");
      return;
    }

    setIsOptimizing(true);

    try {
      const response = await fetch("/api/optimize-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: content,
          provider: "openai", // 可以根据用户设置选择
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "优化失败");
      }

      const result: OptimizationResult = await response.json();

      // 直接应用优化结果到输入框
      onOptimized(result.optimized);
      setIsOptimizing(false);
    } catch (error) {
      console.error("提示词优化错误:", error);
      setIsOptimizing(false);
      onError?.((error as Error).message);
    }
  };

  // 是否可以优化
  const canOptimize = content.trim().length > 0 && content.length <= 2000;

  return (
    <button
      onClick={optimizePrompt}
      disabled={disabled || !canOptimize || isOptimizing}
      className={`p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={
        !canOptimize
          ? content.length === 0
            ? "请先输入内容"
            : "内容过长，请控制在2000字符以内"
          : isOptimizing
          ? "正在优化中..."
          : "优化提示词"
      }
    >
      {isOptimizing ? (
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
    </button>
  );
}
