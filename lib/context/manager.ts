import { Message, ModelProvider, ContextConfig, ContextStats } from '../types';

// 不同模型的默认上下文配置
export const DEFAULT_CONTEXT_CONFIGS: Record<ModelProvider, ContextConfig> = {
  openai: {
    maxMessages: 20,
    maxTokens: 3000, // 为响应留出空间
    strategy: 'recent',
  },
  groq: {
    maxMessages: 15,
    maxTokens: 2500, // Groq token限制更严格
    strategy: 'recent',
  },
  google: {
    maxMessages: 25,
    maxTokens: 4000, // Gemini有更大的上下文窗口
    strategy: 'recent',
  },
};

// 估算消息的token数量（简单估算：1个字符约等于0.75个token）
export function estimateTokens(text: string): number {
  // 中文字符按1个token计算，英文按0.75个token计算
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const otherChars = text.length - chineseChars;
  return Math.ceil(chineseChars + otherChars * 0.75);
}

// 估算消息列表的总token数
export function estimateMessagesTokens(messages: Message[]): number {
  return messages.reduce((total, message) => {
    return total + estimateTokens(message.content) + 10; // 每条消息额外10个token用于格式化
  }, 0);
}

// 截断消息历史以适应上下文限制
export function truncateMessages(
  messages: Message[],
  config: ContextConfig
): Message[] {
  if (messages.length === 0) return [];

  // 按策略截断消息
  switch (config.strategy) {
    case 'recent':
      return truncateByRecent(messages, config);
    case 'sliding_window':
      return truncateBySlidingWindow(messages, config);
    case 'summary':
      // 暂时使用recent策略，后续可以实现摘要策略
      return truncateByRecent(messages, config);
    default:
      return truncateByRecent(messages, config);
  }
}

// 保留最近的消息
function truncateByRecent(messages: Message[], config: ContextConfig): Message[] {
  // 首先按消息数量限制
  let truncated = messages.slice(-config.maxMessages);
  
  // 然后按token数量限制
  let totalTokens = estimateMessagesTokens(truncated);
  
  while (truncated.length > 1 && totalTokens > config.maxTokens) {
    // 移除最早的消息（但保留至少一条消息）
    truncated = truncated.slice(1);
    totalTokens = estimateMessagesTokens(truncated);
  }
  
  return truncated;
}

// 滑动窗口策略（保留对话的连续性）
function truncateBySlidingWindow(messages: Message[], config: ContextConfig): Message[] {
  if (messages.length <= config.maxMessages) {
    const totalTokens = estimateMessagesTokens(messages);
    if (totalTokens <= config.maxTokens) {
      return messages;
    }
  }

  // 尝试保持用户-助手对话的完整性
  const pairs: Message[][] = [];
  let currentPair: Message[] = [];
  
  for (const message of messages) {
    if (message.role === 'user') {
      if (currentPair.length > 0) {
        pairs.push(currentPair);
      }
      currentPair = [message];
    } else if (message.role === 'assistant' && currentPair.length === 1) {
      currentPair.push(message);
      pairs.push(currentPair);
      currentPair = [];
    }
  }
  
  // 如果有未完成的对话对，也加入
  if (currentPair.length > 0) {
    pairs.push(currentPair);
  }
  
  // 从最新的对话对开始，逐步添加直到达到限制
  const result: Message[] = [];
  let totalTokens = 0;
  
  for (let i = pairs.length - 1; i >= 0; i--) {
    const pairTokens = estimateMessagesTokens(pairs[i]);
    if (totalTokens + pairTokens <= config.maxTokens && result.length + pairs[i].length <= config.maxMessages) {
      result.unshift(...pairs[i]);
      totalTokens += pairTokens;
    } else {
      break;
    }
  }
  
  return result;
}

// 获取上下文统计信息
export function getContextStats(
  messages: Message[],
  config: ContextConfig
): ContextStats {
  const messageCount = messages.length;
  const estimatedTokens = estimateMessagesTokens(messages);
  const isLimited = messageCount > config.maxMessages || estimatedTokens > config.maxTokens;
  
  return {
    messageCount,
    estimatedTokens,
    isLimited,
  };
}

// 准备发送给AI的消息上下文
export function prepareContextMessages(
  messages: Message[],
  model: ModelProvider,
  customConfig?: Partial<ContextConfig>
): Message[] {
  const config = {
    ...DEFAULT_CONTEXT_CONFIGS[model],
    ...customConfig,
  };
  
  return truncateMessages(messages, config);
}

// 格式化上下文统计信息用于显示
export function formatContextStats(stats: ContextStats): string {
  const { messageCount, estimatedTokens, isLimited } = stats;
  const limitedText = isLimited ? ' (已限制)' : '';
  return `${messageCount} 条消息, ~${estimatedTokens} tokens${limitedText}`;
}
