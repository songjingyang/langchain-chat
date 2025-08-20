"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface TypewriterTextProps {
  text: string;
  speed?: number; // 打字速度（毫秒）
  isStreaming?: boolean;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({
  text,
  speed = 60, // 增加默认速度，让效果更明显
  isStreaming = false,
  onComplete,
  className = "",
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const displayedLengthRef = useRef(0);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 打字机核心逻辑
  const typeNextCharacter = useCallback(() => {
    const currentLength = displayedLengthRef.current;

    if (currentLength < text.length) {
      const nextChar = text[currentLength];
      setDisplayedText((prev) => prev + nextChar);
      displayedLengthRef.current = currentLength + 1;
      setIsTyping(true);

      // 根据字符类型调整速度
      let charSpeed = speed;
      if (nextChar === "\n") {
        charSpeed = speed * 2; // 换行稍慢
      } else if ([".", "!", "?", "。", "！", "？"].includes(nextChar)) {
        charSpeed = speed * 3; // 句号停顿更长
      } else if ([",", "，", ";", "；", ":", "："].includes(nextChar)) {
        charSpeed = speed * 1.5; // 逗号稍慢
      }

      timerRef.current = setTimeout(typeNextCharacter, charSpeed);
    } else {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
    }
  }, [text, speed, onComplete]);

  // 重置打字机状态
  const resetTypewriter = useCallback(() => {
    clearTimer();
    setDisplayedText("");
    displayedLengthRef.current = 0;
    setIsTyping(false);
  }, [clearTimer]);

  // 主要效果控制
  useEffect(() => {
    if (!isStreaming) {
      // 非流式模式，直接显示全部文本
      clearTimer();
      setDisplayedText(text);
      displayedLengthRef.current = text.length;
      setIsTyping(false);
      return;
    }

    // 流式模式下的处理
    if (text.length === 0) {
      resetTypewriter();
      return;
    }

    // 如果新文本比当前显示的短，重置（新消息开始）
    if (text.length < displayedLengthRef.current) {
      resetTypewriter();
    }

    // 如果有新内容需要显示，且当前没在打字，开始打字
    if (text.length > displayedLengthRef.current && !timerRef.current) {
      typeNextCharacter();
    }

    // 清理函数
    return () => {
      clearTimer();
    };
  }, [text, isStreaming, resetTypewriter, typeNextCharacter, clearTimer]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return (
    <span className={`inline ${className}`}>
      <span className="whitespace-pre-wrap">{displayedText}</span>
      {isStreaming && (
        <TypewriterCursor
          isVisible={isTyping || displayedLengthRef.current < text.length}
          isBlinking={!isTyping}
        />
      )}
    </span>
  );
}

// 独立的光标组件，提供更好的视觉效果
interface TypewriterCursorProps {
  isVisible: boolean;
  isBlinking: boolean;
}

function TypewriterCursor({ isVisible, isBlinking }: TypewriterCursorProps) {
  if (!isVisible) return null;

  return (
    <span
      className={`inline-block w-0.5 h-5 bg-blue-500 ml-1 ${
        isBlinking ? "animate-pulse" : ""
      }`}
      style={{
        animation: isBlinking
          ? "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          : "none",
      }}
    />
  );
}
