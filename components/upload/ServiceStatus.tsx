'use client';

import React, { useState, useEffect } from 'react';
import { uploadService } from '@/lib/upload/service';

export function UploadServiceStatus() {
  const [serviceInfo, setServiceInfo] = useState<{
    available: boolean;
    service: string;
    features: string[];
  } | null>(null);

  useEffect(() => {
    try {
      const info = uploadService.getServiceInfo();
      setServiceInfo(info);
    } catch (error) {
      console.error('Failed to get service info:', error);
    }
  }, []);

  if (!serviceInfo || !serviceInfo.available) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
              ImgBB服务未配置
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              请配置 ImgBB API Key 以启用图片上传功能
            </p>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <strong>配置步骤：</strong>
            <br />
            1. 访问 https://imgbb.com/api 获取API Key
            <br />
            2. 在 .env.local 中配置 NEXT_PUBLIC_IMGBB_API_KEY
            <br />
            3. 重启应用即可使用
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <h3 className="font-medium text-green-800 dark:text-green-200">
            图片上传服务已配置
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
            当前使用: {serviceInfo.service}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
          支持的功能:
        </h4>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          {serviceInfo.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          💡 ImgBB专注于图片上传，配置简单，完全免费，无限制使用。
        </p>
      </div>
    </div>
  );
}
