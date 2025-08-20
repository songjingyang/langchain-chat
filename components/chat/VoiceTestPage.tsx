'use client';

import React, { useState } from 'react';
import { VoiceInput, VoiceVisualizer } from './VoiceInput';
import { VoiceSettings } from '../ui/VoiceSettings';
import { SpeechRecognitionService } from '@/lib/speech/recognition';
import { AudioRecorder } from '@/lib/speech/recorder';

export function VoiceTestPage() {
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [currentLanguage, setCurrentLanguage] = useState('zh-CN');
  const [showSettings, setShowSettings] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [volume, setVolume] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  React.useEffect(() => {
    const supported = AudioRecorder.isSupported() && SpeechRecognitionService.isSupported();
    setIsSupported(supported);
  }, []);

  const handleTranscript = (text: string) => {
    setTranscripts(prev => [...prev, text]);
  };

  const handleError = (error: string) => {
    console.error('语音输入错误:', error);
    setTranscripts(prev => [...prev, `❌ 错误: ${error}`]);
  };

  const clearTranscripts = () => {
    setTranscripts([]);
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            🎤 语音转文字功能测试
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ⚙️ 设置
          </button>
        </div>

        {/* 功能支持检查 */}
        <div className="mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            浏览器支持检查
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {AudioRecorder.isSupported() ? (
                <span className="text-green-500">✅</span>
              ) : (
                <span className="text-red-500">❌</span>
              )}
              <span className="text-gray-700 dark:text-gray-300">音频录制 (MediaRecorder)</span>
            </div>
            <div className="flex items-center gap-2">
              {SpeechRecognitionService.isSupported() ? (
                <span className="text-green-500">✅</span>
              ) : (
                <span className="text-red-500">❌</span>
              )}
              <span className="text-gray-700 dark:text-gray-300">语音识别 (Web Speech API)</span>
            </div>
          </div>
        </div>

        {/* 当前设置显示 */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            当前设置
          </h3>
          <div className="text-sm text-blue-600 dark:text-blue-300">
            识别语言: {currentLanguage}
          </div>
        </div>

        {/* 语音输入测试区域 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            语音输入测试
          </h3>
          
          <div className="flex items-center justify-center gap-6 p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {/* 语音输入按钮 */}
            <VoiceInput
              onTranscript={handleTranscript}
              onError={handleError}
              language={currentLanguage}
              className="transform scale-150"
            />
            
            {/* 音量可视化 */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">音量</span>
              <VoiceVisualizer
                volume={volume}
                isActive={isRecording}
                className="border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            点击麦克风按钮开始语音输入，再次点击停止
          </div>
        </div>

        {/* 转录结果显示 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              转录结果
            </h3>
            <button
              onClick={clearTranscripts}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              清空
            </button>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-h-[200px] max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900">
            {transcripts.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                暂无转录结果，请开始语音输入
              </div>
            ) : (
              <div className="space-y-3">
                {transcripts.map((transcript, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded border-l-4 border-blue-500"
                  >
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      #{index + 1} - {new Date().toLocaleTimeString()}
                    </div>
                    <div className="text-gray-900 dark:text-gray-100">
                      {transcript}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
            📝 使用说明
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• 首次使用需要授权麦克风权限</li>
            <li>• 在安静的环境中使用效果更佳</li>
            <li>• 说话时保持清晰的发音</li>
            <li>• 支持多种语言，可在设置中切换</li>
            <li>• 转录结果会自动添加到聊天输入框</li>
          </ul>
        </div>

        {/* 技术信息 */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🔧 技术信息
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>• 使用 Web Speech API 进行语音识别</div>
            <div>• 使用 MediaRecorder API 进行音频录制</div>
            <div>• 支持实时语音转文字</div>
            <div>• 支持多语言识别</div>
            <div>• 本地处理，保护隐私</div>
          </div>
        </div>
      </div>

      {/* 设置弹窗 */}
      <VoiceSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />
    </div>
  );
}

// 语音功能状态组件
interface VoiceStatusProps {
  isSupported: boolean;
  isRecording: boolean;
  language: string;
}

export function VoiceStatus({ isSupported, isRecording, language }: VoiceStatusProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        isSupported 
          ? isRecording 
            ? 'bg-red-500 animate-pulse' 
            : 'bg-green-500'
          : 'bg-gray-400'
      }`} />
      <span className="text-gray-600 dark:text-gray-400">
        {isSupported 
          ? isRecording 
            ? `正在录音 (${language})`
            : `语音就绪 (${language})`
          : '语音不可用'
        }
      </span>
    </div>
  );
}
