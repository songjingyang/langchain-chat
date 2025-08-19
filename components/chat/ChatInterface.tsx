"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Session, ModelProvider } from "@/lib/types";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Sidebar } from "../sidebar/Sidebar";
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
        // 发送请求到API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: content,
            sessionId: currentSession.id,
            model: selectedModel,
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
        </div>

        {/* 消息列表 */}
        <MessageList
          messages={currentSession?.messages || []}
          streamingMessageId={streamingMessageId}
          className="flex-1"
        />

        {/* 消息输入 */}
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder={isLoading ? "AI正在思考中..." : "输入您的消息..."}
        />
      </div>
    </div>
  );
}
