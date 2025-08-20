// 打字机效果配置

export interface TypewriterConfig {
  speed: number; // 基础速度（毫秒）
  punctuationDelay: number; // 标点符号延迟倍数
  sentenceEndDelay: number; // 句末延迟倍数
  lineBreakDelay: number; // 换行延迟倍数
  cursorBlinkSpeed: number; // 光标闪烁速度（毫秒）
}

// 预设配置
export const TYPEWRITER_PRESETS = {
  // 快速模式 - 适合短文本
  fast: {
    speed: 30,
    punctuationDelay: 1.2,
    sentenceEndDelay: 2,
    lineBreakDelay: 1.5,
    cursorBlinkSpeed: 800,
  } as TypewriterConfig,

  // 标准模式 - 平衡速度和体验
  normal: {
    speed: 50,
    punctuationDelay: 1.5,
    sentenceEndDelay: 3,
    lineBreakDelay: 2,
    cursorBlinkSpeed: 1000,
  } as TypewriterConfig,

  // 慢速模式 - 适合长文本或演示
  slow: {
    speed: 80,
    punctuationDelay: 2,
    sentenceEndDelay: 4,
    lineBreakDelay: 2.5,
    cursorBlinkSpeed: 1200,
  } as TypewriterConfig,

  // 极慢模式 - 适合逐字阅读
  verySlow: {
    speed: 120,
    punctuationDelay: 2.5,
    sentenceEndDelay: 5,
    lineBreakDelay: 3,
    cursorBlinkSpeed: 1500,
  } as TypewriterConfig,
};

// 默认配置
export const DEFAULT_TYPEWRITER_CONFIG = TYPEWRITER_PRESETS.normal;

// 根据内容类型获取推荐配置
export function getRecommendedConfig(content: string): TypewriterConfig {
  const length = content.length;
  const hasCodeBlocks = content.includes('```');
  const hasLists = /^[\s]*[-*+]\s/m.test(content);
  const sentenceCount = (content.match(/[.!?。！？]/g) || []).length;

  // 代码块使用快速模式
  if (hasCodeBlocks) {
    return TYPEWRITER_PRESETS.fast;
  }

  // 列表使用标准模式
  if (hasLists) {
    return TYPEWRITER_PRESETS.normal;
  }

  // 根据长度和句子数量选择
  if (length < 100) {
    return TYPEWRITER_PRESETS.fast;
  } else if (length < 500) {
    return TYPEWRITER_PRESETS.normal;
  } else if (sentenceCount > 10) {
    return TYPEWRITER_PRESETS.slow;
  } else {
    return TYPEWRITER_PRESETS.normal;
  }
}

// 字符类型检测
export function getCharacterType(char: string): 'normal' | 'punctuation' | 'sentenceEnd' | 'lineBreak' {
  if (char === '\n') {
    return 'lineBreak';
  }
  
  if (['.', '!', '?', '。', '！', '？'].includes(char)) {
    return 'sentenceEnd';
  }
  
  if ([',', '，', ';', '；', ':', '：', '-', '—', '(', ')', '（', '）', '[', ']', '【', '】'].includes(char)) {
    return 'punctuation';
  }
  
  return 'normal';
}

// 计算字符延迟时间
export function calculateCharacterDelay(char: string, config: TypewriterConfig): number {
  const charType = getCharacterType(char);
  
  switch (charType) {
    case 'lineBreak':
      return config.speed * config.lineBreakDelay;
    case 'sentenceEnd':
      return config.speed * config.sentenceEndDelay;
    case 'punctuation':
      return config.speed * config.punctuationDelay;
    default:
      return config.speed;
  }
}

// 用户偏好设置
export interface TypewriterPreferences {
  preset: keyof typeof TYPEWRITER_PRESETS;
  customConfig?: Partial<TypewriterConfig>;
  autoAdjust: boolean; // 是否根据内容自动调整
}

// 默认用户偏好
export const DEFAULT_PREFERENCES: TypewriterPreferences = {
  preset: 'normal',
  autoAdjust: true,
};

// 从localStorage获取用户偏好
export function getUserPreferences(): TypewriterPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem('typewriter-preferences');
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn('Failed to load typewriter preferences:', error);
  }

  return DEFAULT_PREFERENCES;
}

// 保存用户偏好到localStorage
export function saveUserPreferences(preferences: TypewriterPreferences): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('typewriter-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('Failed to save typewriter preferences:', error);
  }
}

// 获取最终配置（考虑用户偏好和内容类型）
export function getFinalConfig(content: string): TypewriterConfig {
  const preferences = getUserPreferences();
  
  let baseConfig: TypewriterConfig;
  
  if (preferences.autoAdjust) {
    baseConfig = getRecommendedConfig(content);
  } else {
    baseConfig = TYPEWRITER_PRESETS[preferences.preset];
  }
  
  // 应用自定义配置
  if (preferences.customConfig) {
    return { ...baseConfig, ...preferences.customConfig };
  }
  
  return baseConfig;
}

// 性能优化：预计算常见字符的延迟
const CHAR_DELAY_CACHE = new Map<string, number>();

export function getCachedCharacterDelay(char: string, config: TypewriterConfig): number {
  const cacheKey = `${char}-${config.speed}-${config.punctuationDelay}-${config.sentenceEndDelay}-${config.lineBreakDelay}`;
  
  if (CHAR_DELAY_CACHE.has(cacheKey)) {
    return CHAR_DELAY_CACHE.get(cacheKey)!;
  }
  
  const delay = calculateCharacterDelay(char, config);
  CHAR_DELAY_CACHE.set(cacheKey, delay);
  
  return delay;
}
