"use client";

import React, { useState, useEffect } from "react";
import {
  PromptTemplate,
  ChatPromptTemplate,
  StringPromptTemplate,
  MessageTemplate,
} from "@/lib/types";
import {
  createTemplate,
  updateTemplate,
  validateTemplate,
  extractVariables,
} from "@/lib/templates/manager";
import { getAllCategories } from "@/lib/templates/categories";

interface TemplateEditorProps {
  template?: PromptTemplate;
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: PromptTemplate) => void;
}

export function TemplateEditor({
  template,
  isOpen,
  onClose,
  onSave,
}: TemplateEditorProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "custom",
    tags: [] as string[],
    type: "chat" as "chat" | "string",
  });

  const [chatMessages, setChatMessages] = useState<MessageTemplate[]>([
    { role: "system", content: "", variables: [] },
  ]);

  const [stringTemplate, setStringTemplate] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const categories = getAllCategories();

  // 初始化表单数据
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        description: template.description,
        category: template.category,
        tags: template.tags,
        type: template.type,
      });

      setVariables(template.variables);

      if (template.type === "chat") {
        const chatTemplate = template as ChatPromptTemplate;
        setChatMessages(chatTemplate.messages);
      } else {
        const strTemplate = template as StringPromptTemplate;
        setStringTemplate(strTemplate.template);
      }
    } else {
      // 重置为默认值
      setFormData({
        name: "",
        description: "",
        category: "custom",
        tags: [],
        type: "chat",
      });
      setChatMessages([{ role: "system", content: "", variables: [] }]);
      setStringTemplate("");
      setVariables({});
    }
  }, [template, isOpen]);

  // 验证模板
  const validateCurrentTemplate = () => {
    const newErrors: string[] = [];

    if (!formData.name.trim()) {
      newErrors.push("模板名称不能为空");
    }

    if (formData.type === "string") {
      const validation = validateTemplate(stringTemplate);
      if (!validation.valid) {
        newErrors.push(...validation.errors);
      }
    } else {
      chatMessages.forEach((msg, index) => {
        if (!msg.content.trim()) {
          newErrors.push(`第${index + 1}条消息内容不能为空`);
        }
        const validation = validateTemplate(msg.content);
        if (!validation.valid) {
          newErrors.push(
            `第${index + 1}条消息: ${validation.errors.join(", ")}`
          );
        }
      });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // 保存模板
  const handleSave = () => {
    if (!validateCurrentTemplate()) return;

    let savedTemplate: PromptTemplate;

    if (template) {
      // 更新现有模板
      const updates: Partial<PromptTemplate> = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
        variables,
      };

      if (formData.type === "chat") {
        (updates as Partial<ChatPromptTemplate>).messages = chatMessages;
      } else {
        (updates as Partial<StringPromptTemplate>).template = stringTemplate;
      }

      updateTemplate(template.id, updates);
      savedTemplate = { ...template, ...updates } as PromptTemplate;
    } else {
      // 创建新模板
      savedTemplate = createTemplate(
        formData.type,
        formData.name,
        formData.description,
        formData.category
      );

      if (formData.type === "chat") {
        (savedTemplate as ChatPromptTemplate).messages = chatMessages;
      } else {
        (savedTemplate as StringPromptTemplate).template = stringTemplate;
      }

      savedTemplate.tags = formData.tags;
      savedTemplate.variables = variables;

      updateTemplate(savedTemplate.id, savedTemplate);
    }

    onSave(savedTemplate);
    onClose();
  };

  // 添加聊天消息
  const addChatMessage = () => {
    setChatMessages([
      ...chatMessages,
      { role: "user", content: "", variables: [] },
    ]);
  };

  // 删除聊天消息
  const removeChatMessage = (index: number) => {
    if (chatMessages.length > 1) {
      setChatMessages(chatMessages.filter((_, i) => i !== index));
    }
  };

  // 更新聊天消息
  const updateChatMessage = (
    index: number,
    updates: Partial<MessageTemplate>
  ) => {
    const newMessages = [...chatMessages];
    newMessages[index] = { ...newMessages[index], ...updates };

    // 自动提取变量
    if (updates.content !== undefined) {
      newMessages[index].variables = extractVariables(updates.content);
    }

    setChatMessages(newMessages);
  };

  // 添加标签
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  // 删除标签
  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {template ? "编辑模板" : "创建新模板"}
          </h2>
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
          <div className="space-y-6">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模板名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入模板名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="描述模板的用途和特点"
              />
            </div>

            {/* 模板类型 */}
            {!template && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模板类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="chat"
                      checked={formData.type === "chat"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "chat" | "string",
                        })
                      }
                      className="mr-2"
                    />
                    聊天模板
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="string"
                      checked={formData.type === "string"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as "chat" | "string",
                        })
                      }
                      className="mr-2"
                    />
                    字符串模板
                  </label>
                </div>
              </div>
            )}

            {/* 模板内容 */}
            {formData.type === "chat" ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    聊天消息
                  </label>
                  <button
                    onClick={addChatMessage}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  >
                    添加消息
                  </button>
                </div>

                <div className="space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className="border border-gray-300 dark:border-gray-600 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <select
                          value={message.role}
                          onChange={(e) =>
                            updateChatMessage(index, {
                              role: e.target.value as
                                | "system"
                                | "user"
                                | "assistant",
                            })
                          }
                          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        >
                          <option value="system">系统</option>
                          <option value="user">用户</option>
                          <option value="assistant">助手</option>
                        </select>

                        {chatMessages.length > 1 && (
                          <button
                            onClick={() => removeChatMessage(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </div>

                      <textarea
                        value={message.content}
                        onChange={(e) =>
                          updateChatMessage(index, { content: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="输入消息内容，使用 {变量名} 来定义变量"
                      />

                      {message.variables && message.variables.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          变量: {message.variables.join(", ")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模板内容
                </label>
                <textarea
                  value={stringTemplate}
                  onChange={(e) => setStringTemplate(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入模板内容，使用 {变量名} 来定义变量"
                />

                {stringTemplate && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    检测到的变量:{" "}
                    {extractVariables(stringTemplate).join(", ") || "无"}
                  </div>
                )}
              </div>
            )}

            {/* 标签 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addTag())
                  }
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入标签后按回车"
                />
                <button
                  onClick={addTag}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 错误信息 */}
            {errors.length > 0 && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="text-sm text-red-800 dark:text-red-300">
                  <div className="font-medium mb-1">请修复以下错误：</div>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
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
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            保存模板
          </button>
        </div>
      </div>
    </div>
  );
}
