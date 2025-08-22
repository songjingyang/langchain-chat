"use client";

import React, { useState, useCallback } from "react";

interface MediaGeneratorProps {
  content: string;
  onGenerated: (mediaUrl: string, type: "image" | "video") => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface GenerationState {
  isGenerating: boolean;
  type: "image" | "video" | null;
  progress: string;
}

export function MediaGenerator({
  content,
  onGenerated,
  onError,
  disabled = false,
  className = "",
}: MediaGeneratorProps) {
  const [state, setState] = useState<GenerationState>({
    isGenerating: false,
    type: null,
    progress: "",
  });

  // 生成图像
  const generateImage = useCallback(async () => {
    if (!content.trim()) {
      onError?.("请先输入图像描述");
      return;
    }

    if (content.length > 1000) {
      onError?.("图像描述过长，请控制在1000字符以内");
      return;
    }

    setState({
      isGenerating: true,
      type: "image",
      progress: "正在生成图像...",
    });

    try {
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: content,
          width: 1024,
          height: 1024,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "图像生成失败");
      }

      const result = await response.json();
      onGenerated(result.imageUrl, "image");
      setState({
        isGenerating: false,
        type: null,
        progress: "",
      });
    } catch (error) {
      console.error("图像生成错误:", error);
      setState({
        isGenerating: false,
        type: null,
        progress: "",
      });
      onError?.((error as Error).message);
    }
  }, [content, onGenerated, onError]);

  // 生成视频
  const generateVideo = useCallback(async () => {
    if (!content.trim()) {
      onError?.("请先输入视频描述");
      return;
    }

    if (content.length > 500) {
      onError?.("视频描述过长，请控制在500字符以内");
      return;
    }

    setState({
      isGenerating: true,
      type: "video",
      progress: "正在生成视频（可能需要1-2分钟）...",
    });

    try {
      const response = await fetch("/api/generate/video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: content,
          duration: 3,
          fps: 8,
          width: 512,
          height: 512,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "视频生成失败");
      }

      const result = await response.json();
      onGenerated(result.videoUrl, "video");
      setState({
        isGenerating: false,
        type: null,
        progress: "",
      });
    } catch (error) {
      console.error("视频生成错误:", error);
      setState({
        isGenerating: false,
        type: null,
        progress: "",
      });
      onError?.((error as Error).message);
    }
  }, [content, onGenerated, onError]);

  // 是否可以生成
  const canGenerateImage = content.trim().length > 0 && content.length <= 1000;
  const canGenerateVideo = content.trim().length > 0 && content.length <= 500;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {/* 图像生成按钮 */}
      <button
        onClick={generateImage}
        disabled={disabled || !canGenerateImage || state.isGenerating}
        className={`p-1.5 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          !canGenerateImage
            ? content.length === 0
              ? "请先输入图像描述"
              : "图像描述过长，请控制在1000字符以内"
            : state.isGenerating && state.type === "image"
            ? "正在生成图像..."
            : "生成图像"
        }
      >
        {state.isGenerating && state.type === "image" ? (
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>

      {/* 视频生成按钮 */}
      <button
        onClick={generateVideo}
        disabled={disabled || !canGenerateVideo || state.isGenerating}
        className={`p-1.5 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          !canGenerateVideo
            ? content.length === 0
              ? "请先输入视频描述"
              : "视频描述过长，请控制在500字符以内"
            : state.isGenerating && state.type === "video"
            ? "正在生成视频..."
            : "生成视频"
        }
      >
        {state.isGenerating && state.type === "video" ? (
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>

      {/* 生成状态提示 */}
      {state.isGenerating && (
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {state.progress}
        </span>
      )}
    </div>
  );
}
