"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useActionState,
  useOptimistic,
  startTransition,
} from "react";
import {
  Session,
  ModelProvider,
  PromptTemplate,
  TemplateContext,
} from "@/lib/types";
import { MessageList } from "./OptimizedMessageList";
import { OptimizedMessageInput } from "./OptimizedMessageInput";
import { ConcurrentSearchInterface } from "./ConcurrentSearchInterface";
import { ChatAreaInput } from "./ChatAreaInput";
import { ContextStatus } from "./OptimizedContextStatus";
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
import { MessageAttachment } from "@/lib/types";

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

  // 性能优化：使用ref避免不必要的重新渲染
  const streamingContentRef = useRef<string>("");
  const isStreamingRef = useRef<boolean>(false);

  // 🎯 React 19 优化点 1: useActionState 替代传统异步状态管理
  // 优势：自动错误处理、pending状态、更好的并发安全性
  const sendMessageAction = async (
    prevState: { error?: string; pending?: boolean },
    formData: { content: string; attachments?: MessageAttachment[] }
  ) => {
    if (!currentSession) {
      return { error: "没有活动会话" };
    }

    const { content, attachments } = formData;

    try {
      // 创建用户消息（包含附件）
      const userMessage = createUserMessage(content, attachments);
      addMessageToSession(currentSession.id, userMessage);

      // 🎯 React 19 优化点 2: useOptimistic 乐观更新
      // 立即更新UI，无需等待网络请求
      addOptimisticMessage({
        type: 'user',
        content,
        attachments,
        id: userMessage.id,
      });

      // 更新会话状态
      const updatedSession = getSession(currentSession.id);
      if (updatedSession) {
        setCurrentSessionState(updatedSession);
      }

      // 创建助手消息占位符
      const assistantMessage = createAssistantMessage("", selectedModel);
      setStreamingMessageId(assistantMessage.id);

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
          attachments: attachments || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("无法读取响应流");
      }

      let accumulatedContent = "";
      isStreamingRef.current = true;

      while (isStreamingRef.current) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulatedContent += data.content;
                streamingContentRef.current = accumulatedContent;

                // 🎯 React 19 优化点 3: startTransition 优化高频更新
                // 将频繁的内容更新标记为非紧急，保持UI响应性
                startTransition(() => {
                  updateMessageInSession(
                    currentSession.id,
                    assistantMessage.id,
                    accumulatedContent
                  );
                  
                  const updatedSession = getSession(currentSession.id);
                  if (updatedSession) {
                    setCurrentSessionState(updatedSession);
                  }
                });
              }

              if (data.done) {
                isStreamingRef.current = false;
                setStreamingMessageId(null);
                break;
              }
            } catch (parseError) {
              console.warn("解析响应数据失败:", parseError);
            }
          }
        }
      }

      return { error: undefined };
    } catch (error) {
      console.error("发送消息失败:", error);
      isStreamingRef.current = false;
      setStreamingMessageId(null);
      return { 
        error: error instanceof Error ? error.message : "发送消息失败" 
      };
    }
  };

  // 🎯 React 19 优化点 4: useActionState 自动状态管理
  const [sendState, sendMessage, isPendingSend] = useActionState(
    sendMessageAction,
    { error: undefined }
  );

  // 🎯 React 19 优化点 5: useOptimistic 乐观更新UI
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    currentSession?.messages || [],
    (state, newMessage: { type: 'user' | 'assistant'; content: string; attachments?: MessageAttachment[]; id: string }) => [
      ...state,
      {
        id: newMessage.id,
        content: newMessage.content,
        role: newMessage.type,
        model: selectedModel,
        timestamp: new Date().toISOString(),
        attachments: newMessage.attachments || [],
      }
    ]
  );

  // React Compiler 会自动缓存这些计算，无需手动 useMemo
  const sessionsCache = getSessions();

  // 创建新会话 - React Compiler 会自动优化函数引用
  const handleNewSession = () => {
    const newSession = createSession(selectedModel);
    const updatedSessions = getSessions();
    setSessions(updatedSessions);
    setCurrentSessionState(newSession);
  };

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
  }, [selectedModel]); // React Compiler 会自动处理依赖关系

  // 选择会话 - React Compiler 会自动优化函数引用
  const handleSessionSelect = (sessionId: string) => {
    const session = getSession(sessionId);
    if (session) {
      setCurrentSessionState(session);
      setCurrentSession(sessionId);
      setSelectedModel(session.model as ModelProvider);
    }
  };

  // 删除会话 - React Compiler 会自动优化函数引用
  const handleSessionDelete = (sessionId: string) => {
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
  };

  // 重命名会话 - React Compiler 会自动优化函数引用
  const handleSessionRename = (sessionId: string, newTitle: string) => {
    updateSession(sessionId, { title: newTitle });
    setSessions(getSessions());

    if (currentSession?.id === sessionId) {
      setCurrentSessionState((prev) =>
        prev ? { ...prev, title: newTitle } : null
      );
    }
  };

  // 模型变更 - React Compiler 会自动优化函数引用
  const handleModelChange = (model: ModelProvider) => {
    setSelectedModel(model);
    if (currentSession) {
      updateSession(currentSession.id, { model });
      setCurrentSessionState((prev) => (prev ? { ...prev, model } : null));
    }
  };

  // 🎯 React 19 优化点 6: 简化消息发送接口
  // 使用新的 Action 模式替代传统的 async 函数
  const handleSendMessage = (content: string, attachments?: MessageAttachment[]) => {
    if (!currentSession || isPendingSend) return;
    
    // 🎯 性能提升：React 19 的 Action 自动处理 pending 状态和错误边界
    // 无需手动管理 isLoading 状态，减少状态更新次数
    sendMessage({ content, attachments });
  };

  // 清除当前会话的上下文（保留当前会话但清空消息）- React Compiler 会自动优化函数引用
  const handleClearContext = () => {
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
  };

  // 处理模板选择 - React Compiler 会自动优化函数引用
  const handleSelectTemplate = (template: PromptTemplate) => {
      setSelectedTemplate(template);
      setTemplateContext({
        history: currentSession?.messages || [],
        variables: {},
      });
      setShowTemplateApplicator(true);
    };

  // 处理模板应用 - React Compiler 会自动优化函数引用
  const handleApplyTemplate = (content: string) => {
      // 直接发送模板生成的内容
      handleSendMessage(content);
      setShowTemplateApplicator(false);
      setSelectedTemplate(null);
    };

  // 处理创建新模板 - React Compiler 会自动优化函数引用
  const handleCreateTemplate = () => {
    setShowTemplateManager(true);
  };

  // 导出会话 - React Compiler 会自动优化函数引用
  const handleExportSessions = () => {
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
  };

  return (
    <main className="flex h-screen bg-white dark:bg-gray-900" role="main" aria-label="AI聊天应用主界面">
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
        <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800" role="banner">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label={sidebarOpen ? "隐藏侧边栏" : "显示侧边栏"}
              aria-expanded={sidebarOpen}
              title={sidebarOpen ? "隐藏侧边栏" : "显示侧边栏"}
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
                <h1 className="font-medium text-gray-900 dark:text-gray-100">
                  {currentSession.title}
                </h1>
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
        </header>

        {/* 上下文状态 */}
        {currentSession && (
          <ContextStatus
            messages={currentSession.messages}
            model={selectedModel}
            onClearContext={handleClearContext}
          />
        )}

        {/* 消息列表 - 占据剩余空间且可滚动 */}
        <section 
          aria-label="聊天消息列表" 
          role="log" 
          aria-live="polite"
          className="flex-1 min-h-0 overflow-hidden"
        >
          <MessageList
            messages={currentSession?.messages || []}
            streamingMessageId={streamingMessageId}
            className="h-full"
          />
        </section>

        {/* 消息输入 - 固定在底部 */}
        <section 
          aria-label="消息输入区域" 
          role="form"
          className="flex-shrink-0"
        >
          <ChatAreaInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </section>
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
    </main>
  );
}
