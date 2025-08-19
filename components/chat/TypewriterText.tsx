'use client';

import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // 打字速度（毫秒）
  isStreaming?: boolean;
  onComplete?: () => void;
}

export function TypewriterText({ 
  text, 
  speed = 30, 
  isStreaming = false,
  onComplete 
}: TypewriterTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 如果不是流式模式，直接显示全部文本
    if (!isStreaming) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      return;
    }

    // 重置状态当文本改变时
    if (text.length < displayedText.length) {
      setDisplayedText('');
      setCurrentIndex(0);
    }

    // 打字机效果
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [text, currentIndex, speed, isStreaming, displayedText.length, onComplete]);

  // 当文本更新时，继续从当前位置打字
  useEffect(() => {
    if (isStreaming && text.length > displayedText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
        setCurrentIndex(displayedText.length + 1);
      }, speed);

      return () => clearTimeout(timer);
    }
  }, [text, displayedText.length, speed, isStreaming]);

  return (
    <span className="inline">
      {displayedText}
      {isStreaming && currentIndex < text.length && (
        <span className="inline-block w-0.5 h-4 bg-blue-500 ml-0.5 animate-pulse" />
      )}
    </span>
  );
}
