"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  PromptTemplate,
  ChatPromptTemplate,
  StringPromptTemplate,
  TemplateContext,
  Message,
} from "@/lib/types";
import {
  renderStringTemplate,
  renderChatTemplate,
  extractVariables,
} from "@/lib/templates/manager";

interface TemplateApplicatorProps {
  template: PromptTemplate;
  context: TemplateContext;
  isOpen: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
}

export function TemplateApplicator({
  template,
  context,
  isOpen,
  onClose,
  onApply,
}: TemplateApplicatorProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string>("");

  // 初始化变量
  useEffect(() => {
    if (isOpen) {
      // 合并模板默认变量和上下文变量
      const initialVariables: Record<string, string> = {};

      // 添加模板默认变量
      Object.entries(template.variables).forEach(([key, value]) => {
        initialVariables[key] = String(value);
      });

      // 添加上下文变量
      if (context.variables) {
        Object.entries(context.variables).forEach(([key, value]) => {
          initialVariables[key] = String(value);
        });
      }

      // 如果有用户输入，设置到input变量
      if (context.input) {
        initialVariables.input = context.input;
      }

      setVariables(initialVariables);
    }
  }, [template, context, isOpen]);

  const updatePreview = useCallback(() => {
    try {
      const templateContext: TemplateContext = {
        ...context,
        variables,
      };

      if (template.type === "string") {
        const stringTemplate = template as StringPromptTemplate;
        const rendered = renderStringTemplate(
          stringTemplate.template,
          templateContext
        );
        setPreview(rendered);
      } else {
        const chatTemplate = template as ChatPromptTemplate;
        const renderedMessages = renderChatTemplate(
          chatTemplate,
          templateContext
        );
        const formatted = renderedMessages
          .map((msg) => `**${msg.role.toUpperCase()}**: ${msg.content}`)
          .join("\n\n");
        setPreview(formatted);
      }
    } catch (error) {
      setPreview(
        "预览生成失败: " + (error instanceof Error ? error.message : "未知错误")
      );
    }
  }, [template, context, variables]);

  // 更新预览
  useEffect(() => {
    if (isOpen) {
      updatePreview();
    }
  }, [variables, template, context, isOpen, updatePreview]);

  // 获取所有需要的变量
  const getAllVariables = (): string[] => {
    if (template.type === "string") {
      const stringTemplate = template as StringPromptTemplate;
      return extractVariables(stringTemplate.template);
    } else {
      const chatTemplate = template as ChatPromptTemplate;
      const allVariables = new Set<string>();
      chatTemplate.messages.forEach((msg) => {
        extractVariables(msg.content).forEach((v) => allVariables.add(v));
      });
      return Array.from(allVariables);
    }
  };

  const handleApply = () => {
    if (template.type === "string") {
      onApply(preview);
    } else {
      // 对于聊天模板，只应用最后一条用户消息或整个对话
      const chatTemplate = template as ChatPromptTemplate;
      const templateContext: TemplateContext = { ...context, variables };
      const renderedMessages = renderChatTemplate(
        chatTemplate,
        templateContext
      );

      // 找到最后一条用户消息
      const lastUserMessage = renderedMessages
        .slice()
        .reverse()
        .find((msg) => msg.role === "user");

      if (lastUserMessage) {
        onApply(lastUserMessage.content);
      } else {
        // 如果没有用户消息，应用整个对话的文本形式
        onApply(preview);
      }
    }
    onClose();
  };

  const requiredVariables = getAllVariables().filter(
    (v) => !["input", "history"].includes(v)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              应用模板: {template.name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {template.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 变量设置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                变量设置
              </h3>

              {requiredVariables.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  <div className="text-4xl mb-2">✨</div>
                  <p>此模板不需要额外的变量</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requiredVariables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {variable}
                        {template.variables[variable] && (
                          <span className="text-xs text-gray-500 ml-2">
                            (默认: {template.variables[variable]})
                          </span>
                        )}
                      </label>
                      <textarea
                        value={variables[variable] || ""}
                        onChange={(e) =>
                          setVariables({
                            ...variables,
                            [variable]: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`输入 ${variable} 的值`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 上下文信息 */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  上下文信息
                </h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  {context.input && (
                    <div>
                      <span className="font-medium">用户输入:</span>{" "}
                      {context.input.slice(0, 100)}
                      {context.input.length > 100 && "..."}
                    </div>
                  )}
                  {context.history && context.history.length > 0 && (
                    <div>
                      <span className="font-medium">对话历史:</span>{" "}
                      {context.history.length} 条消息
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 预览 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                预览
              </h3>

              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700 min-h-[300px]">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                  {preview || "正在生成预览..."}
                </pre>
              </div>

              {/* 模板信息 */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <div className="font-medium mb-1">模板信息:</div>
                  <div>
                    类型: {template.type === "chat" ? "聊天模板" : "字符串模板"}
                  </div>
                  <div>分类: {template.category}</div>
                  {template.tags.length > 0 && (
                    <div>标签: {template.tags.join(", ")}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            应用模板
          </button>
        </div>
      </div>
    </div>
  );
}
