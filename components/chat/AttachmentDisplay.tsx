"use client";

import React, { useState } from "react";
import { MessageAttachment } from "@/lib/types";

interface AttachmentDisplayProps {
  attachments: MessageAttachment[];
  className?: string;
}

export function AttachmentDisplay({
  attachments,
  className = "",
}: AttachmentDisplayProps) {
  const [expandedImages, setExpandedImages] = useState<Set<string>>(new Set());

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const toggleImageExpansion = (attachmentId: string) => {
    const newExpanded = new Set(expandedImages);
    if (newExpanded.has(attachmentId)) {
      newExpanded.delete(attachmentId);
    } else {
      newExpanded.add(attachmentId);
    }
    setExpandedImages(newExpanded);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return "🖼️";
      case "document":
        return "📄";
      case "video":
        return "🎥";
      case "audio":
        return "🎵";
      default:
        return "📎";
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
        >
          {/* 附件头部信息 */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getFileIcon(attachment.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {attachment.name}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                    {attachment.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(attachment.size)}
                  </span>
                  {attachment.content?.metadata && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {(() => {
                        const metadata = attachment.content.metadata as {
                          width?: number;
                          height?: number;
                        };
                        return metadata.width && metadata.height
                          ? `${metadata.width}×${metadata.height}`
                          : null;
                      })()}
                    </span>
                  )}
                </div>
              </div>
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                查看原文件
              </a>
            </div>
          </div>

          {/* 附件内容预览 */}
          {attachment.type === "image" &&
            (attachment.content?.base64 ||
              attachment.url?.startsWith("data:image/")) && (
              <div className="p-3">
                <div className="relative">
                  <img
                    src={
                      attachment.content?.base64
                        ? `data:${attachment.mimeType};base64,${attachment.content.base64}`
                        : attachment.url || ""
                    }
                    alt={attachment.name}
                    className={`rounded-lg transition-all duration-200 cursor-pointer ${
                      expandedImages.has(attachment.id)
                        ? "max-w-full max-h-none"
                        : "max-w-sm max-h-64 object-cover"
                    }`}
                    onClick={() => toggleImageExpansion(attachment.id)}
                    onError={(e) => {
                      console.error("❌ 图像加载失败:", attachment.name, {
                        src: e.currentTarget.src.substring(0, 100) + "...",
                        hasBase64: !!attachment.content?.base64,
                        base64Length: attachment.content?.base64?.length || 0,
                        hasUrl: !!attachment.url,
                        mimeType: attachment.mimeType,
                        naturalWidth: e.currentTarget.naturalWidth,
                        naturalHeight: e.currentTarget.naturalHeight,
                      });
                    }}
                    onLoad={(e) => {
                      console.log("✅ 图像加载成功:", attachment.name, {
                        naturalWidth: e.currentTarget.naturalWidth,
                        naturalHeight: e.currentTarget.naturalHeight,
                        mimeType: attachment.mimeType,
                        base64Length: attachment.content?.base64?.length || 0,
                      });
                    }}
                  />
                  {/* {!expandedImages.has(attachment.id) && (
                    <div className="absolute inset-0 flex items-center justify-center hover:bg-white hover:bg-opacity-10 transition-all duration-200 rounded-lg pointer-events-none">
                      <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                        <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          点击查看大图
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              </div>
            )}

          {/* 文档内容预览 */}
          {attachment.type === "document" && attachment.content?.text && (
            <div className="p-3">
              <div className="bg-white dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-600 p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  文档内容预览：
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {attachment.content.text.length > 500
                    ? attachment.content.text.substring(0, 500) + "..."
                    : attachment.content.text}
                </div>
                {attachment.content.text.length > 500 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    内容已截断，查看完整内容请点击上方&ldquo;查看原文件&rdquo;链接
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 视频内容预览 */}
          {attachment.type === "video" && attachment.url && (
            <div className="p-3">
              <div className="relative">
                {/* 对于真实的视频文件使用video标签 */}
                {attachment.mimeType?.startsWith("video/") ? (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={attachment.url}
                      controls
                      preload="metadata"
                      className="w-full max-h-96 object-contain"
                      onError={(e) => {
                        console.error("❌ 视频加载失败:", attachment.name, {
                          src: e.currentTarget.src.substring(0, 100) + "...",
                          hasUrl: !!attachment.url,
                          mimeType: attachment.mimeType,
                        });
                      }}
                      onLoadedMetadata={(e) => {
                        console.log("✅ 视频元数据加载成功:", attachment.name, {
                          duration: e.currentTarget.duration,
                          videoWidth: e.currentTarget.videoWidth,
                          videoHeight: e.currentTarget.videoHeight,
                          mimeType: attachment.mimeType,
                        });
                      }}
                    >
                      您的浏览器不支持视频播放。
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        请点击此处查看视频
                      </a>
                    </video>

                    {/* 视频信息覆盖层 */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      🎥 视频文件
                    </div>
                  </div>
                ) : (
                  /* 对于GIF或被标记为video类型的图像，使用img标签 */
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={
                        attachment.content?.base64
                          ? `data:${attachment.mimeType};base64,${attachment.content.base64}`
                          : attachment.url || ""
                      }
                      alt={attachment.name}
                      className={`rounded-lg transition-all duration-200 cursor-pointer ${
                        expandedImages.has(attachment.id)
                          ? "max-w-full max-h-none"
                          : "max-w-sm max-h-64 object-cover"
                      }`}
                      onClick={() => toggleImageExpansion(attachment.id)}
                      onError={(e) => {
                        console.error("❌ 动画图像加载失败:", attachment.name, {
                          src: e.currentTarget.src.substring(0, 100) + "...",
                          hasBase64: !!attachment.content?.base64,
                          base64Length: attachment.content?.base64?.length || 0,
                          hasUrl: !!attachment.url,
                          mimeType: attachment.mimeType,
                        });
                      }}
                      onLoad={(e) => {
                        console.log("✅ 动画图像加载成功:", attachment.name, {
                          naturalWidth: e.currentTarget.naturalWidth,
                          naturalHeight: e.currentTarget.naturalHeight,
                          mimeType: attachment.mimeType,
                          base64Length: attachment.content?.base64?.length || 0,
                        });
                      }}
                    />

                    {/* 动画标识覆盖层 */}
                    <div className="absolute top-2 left-2 bg-blue-500 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                      🎬{" "}
                      {attachment.mimeType?.includes("gif")
                        ? "GIF动画"
                        : "动画图像"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 音频内容预览 */}
          {attachment.type === "audio" && attachment.url && (
            <div className="p-3">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                <audio
                  src={attachment.url}
                  controls
                  preload="metadata"
                  className="w-full"
                  onError={(e) => {
                    console.error("❌ 音频加载失败:", attachment.name, {
                      src: e.currentTarget.src.substring(0, 100) + "...",
                      hasUrl: !!attachment.url,
                      mimeType: attachment.mimeType,
                    });
                  }}
                >
                  您的浏览器不支持音频播放。
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    请点击此处查看音频文件
                  </a>
                </audio>
              </div>
            </div>
          )}

          {/* 其他文件类型的占位符 */}
          {!["image", "document", "video", "audio"].includes(
            attachment.type
          ) && (
            <div className="p-3">
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <div className="text-2xl mb-2">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="text-sm">文件</div>
                <div className="text-xs mt-1">点击上方链接查看文件内容</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
