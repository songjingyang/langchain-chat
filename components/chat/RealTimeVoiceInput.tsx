'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RealTimeSpeechRecognition } from '@/lib/speech/recognition';

interface RealTimeVoiceInputProps {
  onTranscriptUpdate: (interim: string, final: string) => void;
  onError?: (error: string) => void;
  language?: string;
  disabled?: boolean;
  className?: string;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'error';

export function RealTimeVoiceInput({
  onTranscriptUpdate,
  onError,
  language = 'zh-CN',
  disabled = false,
  className = ''
}: RealTimeVoiceInputProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<RealTimeSpeechRecognition | null>(null);

  // 检查浏览器支持
  useEffect(() => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(supported);
    
    if (!supported) {
      onError?.('您的浏览器不支持语音识别功能');
    }
  }, [onError]);

  // 初始化语音识别
  useEffect(() => {
    if (!isSupported) return;

    recognitionRef.current = new RealTimeSpeechRecognition(
      {
        language,
        continuous: true,
        interimResults: true,
      },
      handleTranscriptUpdate
    );

    return () => {
      recognitionRef.current?.stop();
    };
  }, [language, isSupported]);

  // 处理转录更新
  const handleTranscriptUpdate = useCallback((interim: string, final: string) => {
    setInterimText(interim);
    setFinalText(final);
    onTranscriptUpdate(interim, final);
  }, [onTranscriptUpdate]);

  // 开始语音识别
  const startListening = useCallback(() => {
    if (!isSupported || disabled || state === 'listening') return;

    try {
      setState('listening');
      setInterimText('');
      setFinalText('');
      recognitionRef.current?.start();
    } catch (error) {
      setState('error');
      onError?.('无法开始语音识别: ' + (error as Error).message);
      setTimeout(() => setState('idle'), 3000);
    }
  }, [isSupported, disabled, state, onError]);

  // 停止语音识别
  const stopListening = useCallback(() => {
    if (state === 'listening') {
      setState('processing');
      recognitionRef.current?.stop();
      
      // 获取最终结果
      setTimeout(() => {
        const finalTranscript = recognitionRef.current?.getFinalTranscript() || '';
        if (finalTranscript.trim()) {
          setFinalText(finalTranscript);
          onTranscriptUpdate('', finalTranscript);
        }
        setState('idle');
      }, 500);
    }
  }, [state, onTranscriptUpdate]);

  // 切换语音识别状态
  const toggleListening = useCallback(() => {
    if (state === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  }, [state, startListening, stopListening]);

  // 获取按钮样式
  const getButtonStyle = () => {
    const baseStyle = "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (state) {
      case 'listening':
        return `${baseStyle} bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse focus:ring-red-500`;
      case 'processing':
        return `${baseStyle} bg-yellow-500 text-white shadow-lg focus:ring-yellow-500`;
      case 'error':
        return `${baseStyle} bg-red-600 text-white shadow-lg focus:ring-red-500`;
      default:
        return `${baseStyle} bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`;
    }
  };

  // 获取按钮图标
  const getButtonIcon = () => {
    switch (state) {
      case 'listening':
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
    }
  };

  // 获取提示文本
  const getTooltipText = () => {
    switch (state) {
      case 'listening':
        return '正在监听，点击停止';
      case 'processing':
        return '正在处理...';
      case 'error':
        return '发生错误，点击重试';
      default:
        return '点击开始语音输入';
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
        </svg>
        <span className="text-sm">不支持语音输入</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleListening}
        disabled={disabled}
        className={getButtonStyle()}
        title={getTooltipText()}
      >
        {getButtonIcon()}
        
        {/* 监听时的波纹效果 */}
        {state === 'listening' && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
        )}
      </button>

      {/* 实时转录显示 */}
      {(interimText || finalText) && state === 'listening' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-black bg-opacity-90 text-white text-sm rounded-lg max-w-md shadow-lg">
          <div className="flex flex-col gap-2">
            {/* 最终确认的文字 */}
            {finalText && (
              <div className="text-green-300 font-medium leading-relaxed">
                {finalText}
              </div>
            )}
            {/* 临时识别的文字 */}
            {interimText && (
              <div className="text-gray-300 italic leading-relaxed">
                {interimText}
                <span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse" />
              </div>
            )}
          </div>
          
          {/* 状态指示器 */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">正在监听</span>
            </div>
            <span className="text-xs text-gray-400">{language}</span>
          </div>
        </div>
      )}

      {/* 状态指示器 */}
      {state === 'listening' && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// 语音状态指示器组件
interface VoiceStatusIndicatorProps {
  isListening: boolean;
  hasInterim: boolean;
  hasFinal: boolean;
  language: string;
}

export function VoiceStatusIndicator({
  isListening,
  hasInterim,
  hasFinal,
  language
}: VoiceStatusIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        isListening 
          ? 'bg-red-500 animate-pulse' 
          : hasFinal 
            ? 'bg-green-500'
            : 'bg-gray-400'
      }`} />
      <span className="text-gray-600 dark:text-gray-400">
        {isListening 
          ? `正在监听 (${language})`
          : hasFinal 
            ? '识别完成'
            : '语音就绪'
        }
      </span>
      {hasInterim && (
        <span className="text-blue-500 text-xs">识别中...</span>
      )}
    </div>
  );
}
