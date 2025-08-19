/*
 * @Author: songjingyang songjingyang@meishubao.com
 * @Date: 2025-08-19 15:29:47
 * @LastEditors: songjingyang songjingyang@meishubao.com
 * @LastEditTime: 2025-08-19 16:51:03
 * @FilePath: /LangChain/components/ui/ModelSelector.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client";

import React, { useState, useEffect } from "react";
import { ModelConfig, ModelProvider } from "@/lib/types";

interface ModelSelectorProps {
  selectedModel: ModelProvider;
  onModelChange: (model: ModelProvider) => void;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className = "",
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch("/api/models");
      const data = await response.json();
      setModels(data.models || []);
    } catch (error) {
      console.error("获取模型列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as ModelProvider)}
        className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-gray-100 appearance-none cursor-pointer"
      >
        {models.map((model) => (
          <option key={model.provider} value={model.provider}>
            {model.displayName}
          </option>
        ))}
      </select>

      {/* 自定义下拉箭头 */}
      {/* <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none  justify-center">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div> */}

      {/* 模型信息提示 */}
      {models.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {(() => {
            const currentModel = models.find(
              (m) => m.provider === selectedModel
            );
            return currentModel ? (
              <span>
                最大令牌: {currentModel.maxTokens.toLocaleString()} | 温度:{" "}
                {currentModel.temperature}
              </span>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
