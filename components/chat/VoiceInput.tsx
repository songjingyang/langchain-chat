"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AudioRecorder } from "@/lib/speech/recorder";
import {
  SpeechRecognitionService,
  RecognitionResult,
  RecognitionState,
} from "@/lib/speech/recognition";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onInterimTranscript?: (text: string) => void; // 实时临时结果回调
  onTranscriptUpdate?: (interim: string, final: string) => void; // 统一的转录更新回调
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
  language?: string;
}

type VoiceInputState = "idle" | "recording" | "processing" | "error";

export function VoiceInput({
  onTranscript,
  onInterimTranscript,
  onTranscriptUpdate,
  onError,
  className = "",
  disabled = false,
  language = "zh-CN",
}: VoiceInputProps) {
  const [state, setState] = useState<VoiceInputState>("idle");
  const [, setRecognitionState] = useState<RecognitionState>({
    isListening: false,
    isProcessing: false,
  });
  const [interimTranscript, setInterimTranscript] = useState(""); // 临时识别结果
  const [finalTranscript, setFinalTranscript] = useState(""); // 最终确认结果
  const [isSupported, setIsSupported] = useState(true);
  const [pendingFinalText, setPendingFinalText] = useState(""); // 待处理的最终文本

  const recognitionRef = useRef<SpeechRecognitionService | null>(null);

  // 处理最终文本的回调
  useEffect(() => {
    if (pendingFinalText) {
      onTranscript(pendingFinalText);
      onTranscriptUpdate?.(interimTranscript, finalTranscript);
      setPendingFinalText(""); // 清空待处理文本
    }
  }, [
    pendingFinalText,
    onTranscript,
    onTranscriptUpdate,
    interimTranscript,
    finalTranscript,
  ]);

  // 处理临时文本的回调
  useEffect(() => {
    if (interimTranscript) {
      onInterimTranscript?.(interimTranscript);
      onTranscriptUpdate?.(interimTranscript, finalTranscript);
    }
  }, [
    interimTranscript,
    onInterimTranscript,
    onTranscriptUpdate,
    finalTranscript,
  ]);

  // 处理识别结果
  const handleRecognitionResult = useCallback((result: RecognitionResult) => {
    if (result.isFinal) {
      // 最终结果：添加到最终转录中
      const newFinalText = result.transcript.trim();
      if (newFinalText) {
        setFinalTranscript((prev) => {
          const updatedFinal = prev ? `${prev} ${newFinalText}` : newFinalText;
          return updatedFinal;
        });
        // 设置待处理的最终文本，由useEffect处理回调
        setPendingFinalText(newFinalText);
      }
      // 清空临时结果
      setInterimTranscript("");
    } else {
      // 临时结果：更新临时转录
      const newInterimText = result.transcript;
      setInterimTranscript(newInterimText);
      // 临时结果的回调由useEffect处理
    }
  }, []);

  // 处理识别错误
  const handleRecognitionError = useCallback(
    (error: string) => {
      setState("error");
      onError?.(error);
      setTimeout(() => setState("idle"), 3000);
    },
    [onError]
  );

  // 检查浏览器支持
  useEffect(() => {
    const supported =
      AudioRecorder.isSupported() && SpeechRecognitionService.isSupported();
    setIsSupported(supported);

    if (!supported) {
      onError?.("您的浏览器不支持语音输入功能");
    }
  }, [onError]);

  // 初始化语音识别
  useEffect(() => {
    if (!isSupported) return;

    recognitionRef.current = new SpeechRecognitionService(
      {
        language,
        continuous: true,
        interimResults: true,
      },
      {
        onResult: handleRecognitionResult,
        onStateChange: setRecognitionState,
        onError: handleRecognitionError,
      }
    );

    return () => {
      recognitionRef.current?.cleanup();
    };
  }, [language, isSupported, handleRecognitionResult, handleRecognitionError]);

  // 重置转录状态
  const resetTranscription = useCallback(() => {
    setInterimTranscript("");
    setFinalTranscript("");
  }, []);

  // 开始语音输入
  const startVoiceInput = useCallback(async () => {
    if (!isSupported || disabled || state !== "idle") return;

    try {
      setState("recording");

      // 重置之前的转录结果
      resetTranscription();

      // 开始语音识别
      recognitionRef.current?.start();
    } catch (error) {
      setState("error");
      onError?.("无法开始语音输入: " + (error as Error).message);
      setTimeout(() => setState("idle"), 3000);
    }
  }, [isSupported, disabled, state, onError, resetTranscription]);

  // 停止语音输入
  const stopVoiceInput = useCallback(() => {
    if (state === "recording") {
      setState("processing");
      recognitionRef.current?.stop();

      setTimeout(() => {
        setState("idle");
      }, 1000);
    }
  }, [state]);

  // 获取按钮样式
  const getButtonStyle = () => {
    const baseStyle =
      "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";

    switch (state) {
      case "recording":
        return `${baseStyle} bg-red-500 hover:bg-red-600 text-white shadow-lg animate-pulse focus:ring-red-500`;
      case "processing":
        return `${baseStyle} bg-yellow-500 text-white shadow-lg focus:ring-yellow-500`;
      case "error":
        return `${baseStyle} bg-red-600 text-white shadow-lg focus:ring-red-500`;
      default:
        return `${baseStyle} bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 focus:ring-blue-500 ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`;
    }
  };

  // 获取按钮图标
  const getButtonIcon = () => {
    switch (state) {
      case "recording":
        return (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h12v12H6z" />
          </svg>
        );
      case "processing":
        return (
          <svg
            className="w-6 h-6 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        );
      case "error":
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      default:
        return (
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
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        );
    }
  };

  // 获取提示文本
  const getTooltipText = () => {
    switch (state) {
      case "recording":
        return "点击停止录音";
      case "processing":
        return "正在处理...";
      case "error":
        return "发生错误，点击重试";
      default:
        return "点击开始语音输入";
    }
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
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
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"
          />
        </svg>
        <span className="text-sm">不支持语音输入</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={state === "recording" ? stopVoiceInput : startVoiceInput}
        disabled={disabled}
        className={getButtonStyle()}
        title={getTooltipText()}
      >
        {getButtonIcon()}

        {/* 录音时的波纹效果 */}
        {state === "recording" && (
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
        )}
      </button>

      {/* 实时转录显示 */}
      {(interimTranscript || finalTranscript) && state === "recording" && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black bg-opacity-90 text-white text-sm rounded-lg max-w-sm">
          <div className="flex flex-col gap-1">
            {/* 最终确认的文字 */}
            {finalTranscript && (
              <div className="text-green-300 font-medium">
                {finalTranscript}
              </div>
            )}
            {/* 临时识别的文字 */}
            {interimTranscript && (
              <div className="text-gray-300 italic">
                {interimTranscript}
                <span className="inline-block w-1 h-4 bg-white ml-1 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 状态指示器 */}
      {state === "recording" && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
      )}
    </div>
  );
}

// 语音波形可视化组件
interface VoiceVisualizerProps {
  volume: number;
  isActive: boolean;
  className?: string;
}

export function VoiceVisualizer({
  volume,
  isActive,
  className = "",
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    if (!isActive) return;

    // 绘制波形
    const barCount = 20;
    const barWidth = width / barCount;

    ctx.fillStyle = volume > 0.1 ? "#3B82F6" : "#9CA3AF";

    for (let i = 0; i < barCount; i++) {
      const barHeight = Math.random() * volume * height * 0.8 + height * 0.1;
      const x = i * barWidth;
      const y = (height - barHeight) / 2;

      ctx.fillRect(x, y, barWidth - 2, barHeight);
    }
  }, [volume, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className={`border rounded ${className}`}
    />
  );
}
