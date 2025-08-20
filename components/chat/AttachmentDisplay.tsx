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
          {attachment.type === "image" && attachment.content?.base64 && (
            <div className="p-3">
              <div className="relative">
                <img
                  src={`data:${attachment.mimeType};base64,${attachment.content.base64}`}
                  alt={attachment.name}
                  className={`rounded-lg transition-all duration-200 cursor-pointer ${
                    expandedImages.has(attachment.id)
                      ? "max-w-full max-h-none"
                      : "max-w-sm max-h-64 object-cover"
                  }`}
                  onClick={() => toggleImageExpansion(attachment.id)}
                />
                {!expandedImages.has(attachment.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-lg">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                      <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                        点击查看大图
                      </div>
                    </div>
                  </div>
                )}
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

          {/* 其他文件类型的占位符 */}
          {attachment.type !== "image" && attachment.type !== "document" && (
            <div className="p-3">
              <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                <div className="text-2xl mb-2">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="text-sm">
                  {attachment.type === "video" && "视频文件"}
                  {attachment.type === "audio" && "音频文件"}
                  {!["video", "audio"].includes(attachment.type) && "文件"}
                </div>
                <div className="text-xs mt-1">点击上方链接查看文件内容</div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
