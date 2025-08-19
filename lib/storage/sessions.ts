import { Session, Message } from "../types";
import { v4 as uuidv4 } from "uuid";

const SESSIONS_KEY = "langchain-chat-sessions";
const CURRENT_SESSION_KEY = "langchain-chat-current-session";

// 获取所有会话
export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return [];

    const sessions = JSON.parse(stored);
    return sessions.map((session: Session) => ({
      ...session,
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
      messages: session.messages.map((msg: Message) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      })),
    }));
  } catch (error) {
    console.error("获取会话失败:", error);
    return [];
  }
}

// 保存会话
export function saveSessions(sessions: Session[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("保存会话失败:", error);
  }
}

// 创建新会话
export function createSession(model: string = "openai"): Session {
  const session: Session = {
    id: uuidv4(),
    title: "新对话",
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    model,
  };

  const sessions = getSessions();
  sessions.unshift(session);
  saveSessions(sessions);
  setCurrentSession(session.id);

  return session;
}

// 获取会话
export function getSession(sessionId: string): Session | null {
  const sessions = getSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

// 更新会话
export function updateSession(
  sessionId: string,
  updates: Partial<Session>
): void {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === sessionId);

  if (index !== -1) {
    sessions[index] = {
      ...sessions[index],
      ...updates,
      updatedAt: new Date(),
    };
    saveSessions(sessions);
  }
}

// 删除会话
export function deleteSession(sessionId: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  saveSessions(filtered);

  // 如果删除的是当前会话，清除当前会话
  if (getCurrentSessionId() === sessionId) {
    clearCurrentSession();
  }
}

// 添加消息到会话
export function addMessageToSession(sessionId: string, message: Message): void {
  const sessions = getSessions();
  const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

  if (sessionIndex !== -1) {
    sessions[sessionIndex].messages.push(message);
    sessions[sessionIndex].updatedAt = new Date();

    // 如果是第一条用户消息，更新会话标题
    if (
      sessions[sessionIndex].messages.length === 1 &&
      message.role === "user"
    ) {
      sessions[sessionIndex].title =
        message.content.slice(0, 50) +
        (message.content.length > 50 ? "..." : "");
    }

    saveSessions(sessions);
  }
}

// 获取当前会话ID
export function getCurrentSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

// 设置当前会话
export function setCurrentSession(sessionId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

// 清除当前会话
export function clearCurrentSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CURRENT_SESSION_KEY);
}

// 搜索会话
export function searchSessions(query: string): Session[] {
  const sessions = getSessions();
  const lowerQuery = query.toLowerCase();

  return sessions.filter(
    (session) =>
      session.title.toLowerCase().includes(lowerQuery) ||
      session.messages.some((msg) =>
        msg.content.toLowerCase().includes(lowerQuery)
      )
  );
}
