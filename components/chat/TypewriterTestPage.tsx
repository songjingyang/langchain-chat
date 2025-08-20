'use client';

import React, { useState } from 'react';
import { TypewriterText } from './TypewriterText';
import { EnhancedTypewriterText } from './EnhancedTypewriterText';
import { TypewriterSettings } from '../ui/TypewriterSettings';
import { getUserPreferences, TypewriterPreferences } from '@/lib/ui/typewriter-config';

const TEST_TEXTS = {
  short: "这是一个简短的测试文本。",
  medium: "这是一个中等长度的测试文本，包含多个句子。它可以帮助我们测试打字机效果在不同长度文本下的表现。",
  long: `这是一个较长的测试文本，用于测试打字机效果的性能和用户体验。

它包含多个段落，不同的标点符号，以及各种字符类型。

• 列表项目1
• 列表项目2  
• 列表项目3

代码示例：
\`\`\`javascript
function example() {
  console.log("Hello, World!");
}
\`\`\`

这样我们可以全面测试打字机效果在各种内容类型下的表现。`,
  code: `以下是一个React组件示例：

\`\`\`tsx
import React, { useState } from 'react';

interface Props {
  title: string;
  onSubmit: (value: string) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState('');
  
  return (
    <div className="p-4">
      <h1>{title}</h1>
      <input 
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={() => onSubmit(value)}>
        提交
      </button>
    </div>
  );
}
\`\`\`

这个组件展示了TypeScript、React Hooks和事件处理的基本用法。`,
  markdown: `# 打字机效果测试

## 功能特性

**打字机效果**支持以下特性：

1. **可变速度** - 根据内容类型自动调整
2. **智能停顿** - 在标点符号处适当停顿
3. **流式兼容** - 与实时流式数据完美配合

### 代码高亮

\`\`\`python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

# 计算前10个斐波那契数
for i in range(10):
    print(f"F({i}) = {fibonacci(i)}")
\`\`\`

### 表格支持

| 功能 | 状态 | 说明 |
|------|------|------|
| 基础打字机 | ✅ | 逐字符显示 |
| 智能停顿 | ✅ | 标点符号停顿 |
| 流式支持 | ✅ | 实时数据流 |
| 自定义速度 | ✅ | 多种预设 |

> **提示**: 您可以在设置中调整打字机效果的速度和行为。`
};

export function TypewriterTestPage() {
  const [selectedText, setSelectedText] = useState<keyof typeof TEST_TEXTS>('medium');
  const [isStreaming, setIsStreaming] = useState(true);
  const [useEnhanced, setUseEnhanced] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<TypewriterPreferences>(getUserPreferences());
  const [key, setKey] = useState(0); // 用于重新渲染组件

  const restartAnimation = () => {
    setKey(prev => prev + 1);
  };

  const handleSettingsChange = (newPreferences: TypewriterPreferences) => {
    setPreferences(newPreferences);
    restartAnimation();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            打字机效果测试
          </h1>
          <button
            onClick={() => setShowSettings(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            ⚙️ 设置
          </button>
        </div>

        {/* 控制面板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              测试文本
            </label>
            <select
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value as keyof typeof TEST_TEXTS)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="short">短文本</option>
              <option value="medium">中等文本</option>
              <option value="long">长文本</option>
              <option value="code">代码示例</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              组件类型
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={!useEnhanced}
                  onChange={() => setUseEnhanced(false)}
                  className="mr-2"
                />
                <span className="text-sm">标准版</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={useEnhanced}
                  onChange={() => setUseEnhanced(true)}
                  className="mr-2"
                />
                <span className="text-sm">增强版</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              模式
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isStreaming}
                  onChange={(e) => setIsStreaming(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">流式模式</span>
              </label>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={restartAnimation}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            🔄 重新开始
          </button>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            {isStreaming ? '⏸️ 停止流式' : '▶️ 开始流式'}
          </button>
        </div>

        {/* 当前设置显示 */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            当前设置
          </h3>
          <div className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
            <div>预设: {preferences.preset}</div>
            <div>自动调整: {preferences.autoAdjust ? '开启' : '关闭'}</div>
            <div>组件: {useEnhanced ? '增强版' : '标准版'}</div>
            <div>模式: {isStreaming ? '流式' : '静态'}</div>
          </div>
        </div>

        {/* 测试区域 */}
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 min-h-[200px] bg-white dark:bg-gray-900">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            效果演示
          </h3>
          <div className="prose prose-sm max-w-none dark:prose-invert">
            {useEnhanced ? (
              <EnhancedTypewriterText
                key={key}
                text={TEST_TEXTS[selectedText]}
                isStreaming={isStreaming}
                preset={preferences.preset}
                autoAdjust={preferences.autoAdjust}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              />
            ) : (
              <TypewriterText
                key={key}
                text={TEST_TEXTS[selectedText]}
                speed={50}
                isStreaming={isStreaming}
                className="text-gray-700 dark:text-gray-300 leading-relaxed"
              />
            )}
          </div>
        </div>

        {/* 性能信息 */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            文本信息
          </h3>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <div>字符数: {TEST_TEXTS[selectedText].length}</div>
            <div>行数: {TEST_TEXTS[selectedText].split('\n').length}</div>
            <div>预计时间: {Math.round(TEST_TEXTS[selectedText].length * 50 / 1000)}秒 (50ms/字符)</div>
          </div>
        </div>
      </div>

      {/* 设置弹窗 */}
      <TypewriterSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
