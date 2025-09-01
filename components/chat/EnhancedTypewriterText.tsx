"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "@/lib/utils/performance";
import {
  getFinalConfig,
  getCachedCharacterDelay,
  TypewriterConfig,
} from "@/lib/ui/typewriter-config";

interface EnhancedTypewriterTextProps {
  text: string;
  isStreaming?: boolean;
  onComplete?: () => void;
  className?: string;
  preset?: "fast" | "normal" | "slow" | "verySlow";
  autoAdjust?: boolean; // 是否根据内容自动调整速度
}

export function EnhancedTypewriterText({
  text,
  isStreaming = false,
  onComplete,
  className = "",
  preset = "normal",
  autoAdjust = true,
}: EnhancedTypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<TypewriterConfig | null>(
    null
  );

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const displayedLengthRef = useRef(0);
  const configRef = useRef<TypewriterConfig | null>(null);

  // 清理定时器
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 初始化配置
  useEffect(() => {
    const config = autoAdjust ? getFinalConfig(text) : getFinalConfig("");
    setCurrentConfig(config);
    configRef.current = config;
  }, [text, autoAdjust, preset]);

  // 打字机核心逻辑 - 性能优化版本
  const typeNextCharacter = useCallback(() => {
    const currentLength = displayedLengthRef.current;
    const config = configRef.current;

    if (!config || currentLength >= text.length) {
      setIsTyping(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const nextChar = text[currentLength];
    setDisplayedText((prev) => prev + nextChar);
    displayedLengthRef.current = currentLength + 1;
    setIsTyping(true);

    // 使用缓存的字符延迟计算
    const charDelay = getCachedCharacterDelay(nextChar, config);

    timerRef.current = setTimeout(typeNextCharacter, charDelay);
  }, [text, onComplete]);

  // 性能优化：防抖的状态更新
  const debouncedSetDisplayedText = useCallback(
    debounce((text: string) => setDisplayedText(text), 16), // 约60fps
    []
  );

  // 重置打字机状态
  const resetTypewriter = useCallback(() => {
    clearTimer();
    setDisplayedText("");
    displayedLengthRef.current = 0;
    setIsTyping(false);
  }, [clearTimer]);

  // 主要效果控制
  useEffect(() => {
    if (!currentConfig) return;

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
  }, [
    text,
    isStreaming,
    currentConfig,
    resetTypewriter,
    typeNextCharacter,
    clearTimer,
  ]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  if (!currentConfig) {
    return <span className={className}>{isStreaming ? "" : text}</span>;
  }

  return (
    <span className={`inline ${className}`}>
      <span className="whitespace-pre-wrap">{displayedText}</span>
      {isStreaming && (
        <EnhancedTypewriterCursor
          isVisible={isTyping || displayedLengthRef.current < text.length}
          isBlinking={!isTyping}
          blinkSpeed={currentConfig.cursorBlinkSpeed}
        />
      )}
    </span>
  );
}

// 增强的光标组件
interface EnhancedTypewriterCursorProps {
  isVisible: boolean;
  isBlinking: boolean;
  blinkSpeed: number;
}

function EnhancedTypewriterCursor({
  isVisible,
  isBlinking,
  blinkSpeed,
}: EnhancedTypewriterCursorProps) {
  const [cursorVisible, setCursorVisible] = useState(true);
  const blinkTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible) {
      setCursorVisible(false);
      return;
    }

    if (!isBlinking) {
      setCursorVisible(true);
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
      return;
    }

    // 自定义闪烁逻辑
    setCursorVisible(true);
    blinkTimerRef.current = setInterval(() => {
      setCursorVisible((prev) => !prev);
    }, blinkSpeed / 2);

    return () => {
      if (blinkTimerRef.current) {
        clearInterval(blinkTimerRef.current);
        blinkTimerRef.current = null;
      }
    };
  }, [isVisible, isBlinking, blinkSpeed]);

  if (!isVisible) return null;

  return (
    <span
      className={`inline-block w-0.5 h-5 bg-blue-500 ml-1 transition-opacity duration-100 ${
        cursorVisible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

// 打字机效果的性能监控组件（开发环境使用）
export function TypewriterPerformanceMonitor({
  text,
  displayedLength,
}: {
  text: string;
  displayedLength: number;
}) {
  const [stats, setStats] = useState({
    totalChars: 0,
    typedChars: 0,
    progress: 0,
    estimatedTimeLeft: 0,
  });

  useEffect(() => {
    const totalChars = text.length;
    const typedChars = displayedLength;
    const progress = totalChars > 0 ? (typedChars / totalChars) * 100 : 0;

    // 估算剩余时间（基于平均速度）
    const avgSpeed = 60; // 毫秒
    const remainingChars = totalChars - typedChars;
    const estimatedTimeLeft = remainingChars * avgSpeed;

    setStats({
      totalChars,
      typedChars,
      progress,
      estimatedTimeLeft,
    });
  }, [text, displayedLength]);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
      <div>进度: {stats.progress.toFixed(1)}%</div>
      <div>
        字符: {stats.typedChars}/{stats.totalChars}
      </div>
      <div>预计剩余: {(stats.estimatedTimeLeft / 1000).toFixed(1)}s</div>
    </div>
  );
}
