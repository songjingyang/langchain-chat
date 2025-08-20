'use client';

import React, { useState, useRef } from 'react';
import { fileTypeConfig, formatFileSize, getFileIcon, validateFile } from '@/lib/chat/mockData';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  preview?: string;
}

interface FileUploadProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onFileRemove: (fileId: string) => void;
  uploadedFiles: UploadedFile[];
  className?: string;
}

export function FileUpload({ onFilesUploaded, onFileRemove, uploadedFiles, className = '' }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 模拟文件上传
  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // 验证文件
      const imageValidation = validateFile(file, 'image');
      const documentValidation = validateFile(file, 'document');
      
      if (!imageValidation.valid && !documentValidation.valid) {
        reject(new Error('不支持的文件类型或文件过大'));
        return;
      }

      // 创建文件预览
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }

      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'uploading',
        preview,
      };

      // 添加到上传列表
      onFilesUploaded([...uploadedFiles, uploadedFile]);

      // 模拟上传进度
      const interval = setInterval(() => {
        uploadedFile.progress += Math.random() * 30;
        
        if (uploadedFile.progress >= 100) {
          uploadedFile.progress = 100;
          uploadedFile.status = 'completed';
          clearInterval(interval);
          resolve();
        }
        
        // 更新状态
        onFilesUploaded(uploadedFiles.map(f => f.id === fileId ? uploadedFile : f));
      }, 200);

      // 模拟可能的错误
      if (Math.random() < 0.1) { // 10% 概率失败
        setTimeout(() => {
          uploadedFile.status = 'error';
          uploadedFile.error = '上传失败，请重试';
          clearInterval(interval);
          reject(new Error('上传失败'));
        }, 1000);
      }
    });
  };

  const handleFileSelect = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      try {
        await simulateUpload(file);
      } catch (error) {
        console.error('文件上传失败:', error);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
    // 重置input值，允许重复选择同一文件
    e.target.value = '';
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={className}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={`${fileTypeConfig.image.accept},${fileTypeConfig.document.accept}`}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* 拖拽上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg
            className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {isDragging ? '释放文件以上传' : '点击或拖拽文件到此处'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              支持图片、文档等格式，单个文件最大50MB
            </p>
          </div>
        </div>
      </div>

      {/* 上传文件列表 */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {/* 文件图标/预览 */}
              <div className="flex-shrink-0">
                {uploadedFile.preview ? (
                  <img
                    src={uploadedFile.preview}
                    alt={uploadedFile.file.name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-lg">
                    {getFileIcon(uploadedFile.file.name)}
                  </div>
                )}
              </div>

              {/* 文件信息 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {uploadedFile.file.name}
                  </p>
                  <button
                    onClick={() => onFileRemove(uploadedFile.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(uploadedFile.file.size)}
                  </span>
                  
                  {uploadedFile.status === 'uploading' && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {Math.round(uploadedFile.progress)}%
                      </span>
                    </>
                  )}
                  
                  {uploadedFile.status === 'completed' && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-green-600 dark:text-green-400">
                        上传完成
                      </span>
                    </>
                  )}
                  
                  {uploadedFile.status === 'error' && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-red-600 dark:text-red-400">
                        {uploadedFile.error || '上传失败'}
                      </span>
                    </>
                  )}
                </div>

                {/* 进度条 */}
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${uploadedFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
