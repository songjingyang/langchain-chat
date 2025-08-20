'use client';

import React, { useState, useEffect } from 'react';
import { SpeechRecognitionService } from '@/lib/speech/recognition';

interface VoiceSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh-CN', name: '中文（简体）', nativeName: '中文（简体）', flag: '🇨🇳' },
  { code: 'zh-TW', name: '中文（繁体）', nativeName: '中文（繁體）', flag: '🇹🇼' },
  { code: 'en-US', name: '英语（美国）', nativeName: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: '英语（英国）', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'ja-JP', name: '日语', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '韩语', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'fr-FR', name: '法语', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: '德语', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es-ES', name: '西班牙语', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it-IT', name: '意大利语', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt-BR', name: '葡萄牙语（巴西）', nativeName: 'Português (BR)', flag: '🇧🇷' },
  { code: 'ru-RU', name: '俄语', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ar-SA', name: '阿拉伯语', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi-IN', name: '印地语', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

export function VoiceSettings({
  isOpen,
  onClose,
  currentLanguage,
  onLanguageChange
}: VoiceSettingsProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isSupported, setIsSupported] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setIsSupported(SpeechRecognitionService.isSupported());
    setSelectedLanguage(currentLanguage);
  }, [isOpen, currentLanguage]);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleSave = () => {
    onLanguageChange(selectedLanguage);
    onClose();
  };

  const handleTest = async () => {
    if (!isSupported) return;

    setIsTesting(true);
    setTestResult('');

    try {
      const recognition = new SpeechRecognitionService(
        {
          language: selectedLanguage,
          continuous: false,
          interimResults: false,
        },
        {
          onResult: (result) => {
            if (result.isFinal) {
              setTestResult(result.transcript);
              setIsTesting(false);
            }
          },
          onError: (error) => {
            setTestResult(`测试失败: ${error}`);
            setIsTesting(false);
          },
        }
      );

      recognition.start();

      // 10秒后自动停止测试
      setTimeout(() => {
        recognition.stop();
        if (isTesting) {
          setTestResult('测试超时，请重试');
          setIsTesting(false);
        }
      }, 10000);

    } catch (error) {
      setTestResult(`测试失败: ${(error as Error).message}`);
      setIsTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            语音输入设置
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

        {!isSupported ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              不支持语音输入
            </h4>
            <p className="text-gray-600 dark:text-gray-400">
              您的浏览器不支持语音识别功能。请使用支持Web Speech API的现代浏览器。
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 语言选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                识别语言
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      selectedLanguage === lang.code
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className="font-medium">{lang.name}</div>
                      <div className="text-sm opacity-75">{lang.nativeName}</div>
                    </div>
                    {selectedLanguage === lang.code && (
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 测试区域 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                语音识别测试
              </label>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={handleTest}
                  disabled={isTesting}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isTesting
                      ? 'bg-yellow-500 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isTesting ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      正在测试...请说话
                    </div>
                  ) : (
                    '🎤 测试语音识别'
                  )}
                </button>
                
                {testResult && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">识别结果:</div>
                    <div className="text-gray-900 dark:text-gray-100">{testResult}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 使用提示 */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                💡 使用提示
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• 点击麦克风按钮开始语音输入</li>
                <li>• 说话时保持清晰的发音</li>
                <li>• 在安静的环境中使用效果更佳</li>
                <li>• 首次使用需要授权麦克风权限</li>
              </ul>
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            取消
          </button>
          {isSupported && (
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              保存设置
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
