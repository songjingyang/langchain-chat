'use client';

import React, { useState, useEffect } from 'react';
import { 
  TYPEWRITER_PRESETS, 
  getUserPreferences, 
  saveUserPreferences,
  TypewriterPreferences 
} from '@/lib/ui/typewriter-config';

interface TypewriterSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (preferences: TypewriterPreferences) => void;
}

export function TypewriterSettings({ 
  isOpen, 
  onClose, 
  onSettingsChange 
}: TypewriterSettingsProps) {
  const [preferences, setPreferences] = useState<TypewriterPreferences>(getUserPreferences());
  const [previewText] = useState('这是一个打字机效果的预览文本。您可以看到不同速度设置的效果。');

  useEffect(() => {
    if (isOpen) {
      setPreferences(getUserPreferences());
    }
  }, [isOpen]);

  const handlePresetChange = (preset: keyof typeof TYPEWRITER_PRESETS) => {
    const newPreferences = { ...preferences, preset };
    setPreferences(newPreferences);
    saveUserPreferences(newPreferences);
    onSettingsChange?.(newPreferences);
  };

  const handleAutoAdjustChange = (autoAdjust: boolean) => {
    const newPreferences = { ...preferences, autoAdjust };
    setPreferences(newPreferences);
    saveUserPreferences(newPreferences);
    onSettingsChange?.(newPreferences);
  };

  const resetToDefaults = () => {
    const defaultPrefs: TypewriterPreferences = {
      preset: 'normal',
      autoAdjust: true,
    };
    setPreferences(defaultPrefs);
    saveUserPreferences(defaultPrefs);
    onSettingsChange?.(defaultPrefs);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            打字机效果设置
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 速度预设 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              速度预设
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(TYPEWRITER_PRESETS).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key as keyof typeof TYPEWRITER_PRESETS)}
                  className={`p-2 text-sm rounded border ${
                    preferences.preset === key
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">
                    {key === 'fast' && '快速'}
                    {key === 'normal' && '标准'}
                    {key === 'slow' && '慢速'}
                    {key === 'verySlow' && '极慢'}
                  </div>
                  <div className="text-xs opacity-75">
                    {config.speed}ms
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 自动调整 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={preferences.autoAdjust}
                onChange={(e) => handleAutoAdjustChange(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                根据内容自动调整速度
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              启用后，系统会根据文本长度和类型自动选择合适的速度
            </p>
          </div>

          {/* 预览区域 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              效果预览
            </label>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border min-h-[60px]">
              <TypewriterPreview 
                text={previewText}
                preferences={preferences}
              />
            </div>
          </div>

          {/* 详细配置信息 */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <div>当前配置：</div>
            <div>• 基础速度: {TYPEWRITER_PRESETS[preferences.preset].speed}ms</div>
            <div>• 标点延迟: {TYPEWRITER_PRESETS[preferences.preset].punctuationDelay}x</div>
            <div>• 句末延迟: {TYPEWRITER_PRESETS[preferences.preset].sentenceEndDelay}x</div>
            <div>• 换行延迟: {TYPEWRITER_PRESETS[preferences.preset].lineBreakDelay}x</div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            恢复默认
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}

// 预览组件
interface TypewriterPreviewProps {
  text: string;
  preferences: TypewriterPreferences;
}

function TypewriterPreview({ text, preferences }: TypewriterPreviewProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const startPreview = () => {
    setDisplayedText('');
    setIsPlaying(true);
    
    const config = TYPEWRITER_PRESETS[preferences.preset];
    let index = 0;
    
    const typeChar = () => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        
        const char = text[index - 1];
        let delay = config.speed;
        
        if (char === '.') delay *= config.sentenceEndDelay;
        else if (char === ',') delay *= config.punctuationDelay;
        
        setTimeout(typeChar, delay);
      } else {
        setIsPlaying(false);
      }
    };
    
    typeChar();
  };

  return (
    <div className="space-y-2">
      <div className="min-h-[40px] text-sm text-gray-700 dark:text-gray-300">
        {displayedText}
        {isPlaying && (
          <span className="inline-block w-0.5 h-4 bg-blue-500 ml-1 animate-pulse" />
        )}
      </div>
      <button
        onClick={startPreview}
        disabled={isPlaying}
        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPlaying ? '播放中...' : '预览效果'}
      </button>
    </div>
  );
}
