"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Session,
  ModelProvider,
  PromptTemplate,
  TemplateContext,
} from "@/lib/types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChatAreaInput } from "./ChatAreaInput";
import { ContextStatus } from "./ContextStatus";
import { Sidebar } from "../sidebar/Sidebar";
import { TemplateSelector } from "../templates/TemplateSelector";
import { TemplateApplicator } from "../templates/TemplateApplicator";
import { TemplateManager } from "../templates/TemplateManager";
import {
  getSessions,
  createSession,
  getSession,
  updateSession,
  deleteSession,
  addMessageToSession,
  getCurrentSessionId,
  setCurrentSession,
} from "@/lib/storage/sessions";
import {
  createUserMessage,
  createAssistantMessage,
} from "@/lib/storage/messages";

export function ChatInterface() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSessionState] = useState<Session | null>(
    null
  );
  const [selectedModel, setSelectedModel] = useState<ModelProvider>("openai");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 模板相关状态
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);
  const [showTemplateApplicator, setShowTemplateApplicator] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateContext, setTemplateContext] = useState<TemplateContext>({});

  // 创建新会话
  const handleNewSession = useCallback(() => {
    const newSession = createSession(selectedModel);
    setSessions(getSessions());
    setCurrentSessionState(newSession);
  }, [selectedModel]);

  // 初始化
  useEffect(() => {
    const loadedSessions = getSessions();
    setSessions(loadedSessions);

    const currentSessionId = getCurrentSessionId();
    if (currentSessionId) {
      const session = getSession(currentSessionId);
      if (session) {
        setCurrentSessionState(session);
        setSelectedModel(session.model as ModelProvider);
      }
    }

    // 如果没有会话，创建一个新的
    if (loadedSessions.length === 0) {
      handleNewSession();
    }
  }, [handleNewSession]);

  // 选择会话
  const handleSessionSelect = useCallback((sessionId: string) => {
    const session = getSession(sessionId);
    if (session) {
      setCurrentSessionState(session);
      setCurrentSession(sessionId);
      setSelectedModel(session.model as ModelProvider);
    }
  }, []);

  // 删除会话
  const handleSessionDelete = useCallback(
    (sessionId: string) => {
      deleteSession(sessionId);
      setSessions(getSessions());

      if (currentSession?.id === sessionId) {
        const remainingSessions = getSessions();
        if (remainingSessions.length > 0) {
          handleSessionSelect(remainingSessions[0].id);
        } else {
          handleNewSession();
        }
      }
    },
    [currentSession, handleSessionSelect, handleNewSession]
  );

  // 重命名会话
  const handleSessionRename = useCallback(
    (sessionId: string, newTitle: string) => {
      updateSession(sessionId, { title: newTitle });
      setSessions(getSessions());

      if (currentSession?.id === sessionId) {
        setCurrentSessionState((prev) =>
          prev ? { ...prev, title: newTitle } : null
        );
      }
    },
    [currentSession]
  );

  // 模型变更
  const handleModelChange = useCallback(
    (model: ModelProvider) => {
      setSelectedModel(model);
      if (currentSession) {
        updateSession(currentSession.id, { model });
        setCurrentSessionState((prev) => (prev ? { ...prev, model } : null));
      }
    },
    [currentSession]
  );

  // 发送消息
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!currentSession || isLoading) return;

      setIsLoading(true);

      // 创建用户消息
      const userMessage = createUserMessage(content);
      addMessageToSession(currentSession.id, userMessage);

      // 更新UI
      const updatedSession = getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSessionState(updatedSession);
      }

      // 创建助手消息占位符
      const assistantMessage = createAssistantMessage("", selectedModel);
      setStreamingMessageId(assistantMessage.id);

      try {
        // 发送请求到API，包含历史消息上下文
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            sessionId: currentSession.id,
            model: selectedModel,
            messages: currentSession.messages, // 发送历史消息作为上下文
          }),
        });

        if (!response.ok) {
          throw new Error("请求失败");
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("无法读取响应流");
        }

        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));

                if (data.type === "token") {
                  assistantContent += data.data;
                  // 更新流式消息
                  const updatedMessage = {
                    ...assistantMessage,
                    content: assistantContent,
                  };
                  setCurrentSessionState((prev) => {
                    if (!prev) return null;
                    const messages = [...prev.messages];
                    const lastIndex = messages.length - 1;
                    if (
                      lastIndex >= 0 &&
                      messages[lastIndex].id === assistantMessage.id
                    ) {
                      messages[lastIndex] = updatedMessage;
                    } else {
                      messages.push(updatedMessage);
                    }
                    return { ...prev, messages };
                  });
                } else if (data.type === "end") {
                  // 保存完整的助手消息
                  const finalMessage = {
                    ...assistantMessage,
                    content: assistantContent,
                  };
                  addMessageToSession(currentSession.id, finalMessage);
                  break;
                } else if (data.type === "error") {
                  throw new Error(data.data);
                }
              } catch (e) {
                console.error("解析SSE数据失败:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("发送消息失败:", error);
        const errorMessage = createAssistantMessage(
          `抱歉，发生了错误: ${
            error instanceof Error ? error.message : "未知错误"
          }`,
          selectedModel
        );
        addMessageToSession(currentSession.id, errorMessage);
      } finally {
        setIsLoading(false);
        setStreamingMessageId(null);

        // 刷新会话数据
        const refreshedSession = getSession(currentSession.id);
        if (refreshedSession) {
          setCurrentSessionState(refreshedSession);
        }
        setSessions(getSessions());
      }
    },
    [currentSession, selectedModel, isLoading]
  );

  // 清除当前会话的上下文（保留当前会话但清空消息）
  const handleClearContext = useCallback(() => {
    if (!currentSession) return;

    if (confirm("确定要清除当前对话的上下文吗？这将删除所有历史消息。")) {
      // 清空当前会话的消息
      updateSession(currentSession.id, { messages: [] });

      // 更新UI状态
      setCurrentSessionState((prev) =>
        prev ? { ...prev, messages: [] } : null
      );
      setSessions(getSessions());
    }
  }, [currentSession]);

  // 处理模板选择
  const handleSelectTemplate = useCallback(
    (template: PromptTemplate) => {
      setSelectedTemplate(template);
      setTemplateContext({
        history: currentSession?.messages || [],
        variables: {},
      });
      setShowTemplateApplicator(true);
    },
    [currentSession]
  );

  // 处理模板应用
  const handleApplyTemplate = useCallback(
    (content: string) => {
      // 直接发送模板生成的内容
      handleSendMessage(content);
      setShowTemplateApplicator(false);
      setSelectedTemplate(null);
    },
    [handleSendMessage]
  );

  // 处理创建新模板
  const handleCreateTemplate = useCallback(() => {
    setShowTemplateManager(true);
  }, []);

  // 导出会话
  const handleExportSessions = useCallback(() => {
    if (sessions.length === 0) return;

    const exportData = {
      exportTime: new Date().toISOString(),
      sessions: sessions,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `langchain-chat-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sessions]);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* 侧边栏 */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden`}
      >
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSession?.id || null}
          selectedModel={selectedModel}
          onNewSession={handleNewSession}
          onSessionSelect={handleSessionSelect}
          onSessionDelete={handleSessionDelete}
          onSessionRename={handleSessionRename}
          onModelChange={handleModelChange}
          onExportSessions={handleExportSessions}
        />
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {currentSession && (
              <div>
                <h2 className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSession.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {currentSession.messages.length} 条消息 · {selectedModel}
                </p>
              </div>
            )}
          </div>

          {/* 模板工具 */}
          <div className="flex items-center gap-2">
            <TemplateSelector
              onSelectTemplate={handleSelectTemplate}
              onCreateTemplate={handleCreateTemplate}
            />
            <button
              onClick={() => setShowTemplateManager(true)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="管理模板"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 上下文状态 */}
        {currentSession && (
          <ContextStatus
            messages={currentSession.messages}
            model={selectedModel}
            onClearContext={handleClearContext}
          />
        )}

        {/* 消息列表 */}
        <MessageList
          messages={currentSession?.messages || []}
          streamingMessageId={streamingMessageId}
          className="flex-1"
        />

        {/* 消息输入 */}
        <ChatAreaInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
      </div>

      {/* 模板应用器 */}
      {selectedTemplate && (
        <TemplateApplicator
          template={selectedTemplate}
          context={{
            ...templateContext,
            input: "", // 可以从输入框获取当前输入
          }}
          isOpen={showTemplateApplicator}
          onClose={() => {
            setShowTemplateApplicator(false);
            setSelectedTemplate(null);
          }}
          onApply={handleApplyTemplate}
        />
      )}

      {/* 模板管理器 */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
      />
    </div>
  );
}
