// 假用户数据
export const mockUsers = [
  {
    id: '1',
    name: '张三',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
    email: 'zhangsan@example.com',
    role: '产品经理',
    status: 'online'
  },
  {
    id: '2',
    name: '李四',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
    email: 'lisi@example.com',
    role: '前端开发',
    status: 'online'
  },
  {
    id: '3',
    name: '王五',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
    email: 'wangwu@example.com',
    role: '后端开发',
    status: 'away'
  },
  {
    id: '4',
    name: '赵六',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
    email: 'zhaoliu@example.com',
    role: 'UI设计师',
    status: 'offline'
  },
  {
    id: '5',
    name: 'Alice Johnson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
    email: 'alice@example.com',
    role: '项目经理',
    status: 'online'
  },
  {
    id: '6',
    name: 'Bob Smith',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face',
    email: 'bob@example.com',
    role: '测试工程师',
    status: 'busy'
  }
];

// 假话题数据
export const mockTopics = [
  {
    id: 'topic1',
    name: '产品讨论',
    description: '产品功能和需求讨论',
    color: '#3B82F6',
    messageCount: 156,
    participants: 8
  },
  {
    id: 'topic2',
    name: '技术分享',
    description: '技术方案和最佳实践分享',
    color: '#10B981',
    messageCount: 89,
    participants: 12
  },
  {
    id: 'topic3',
    name: '项目进度',
    description: '项目进度更新和里程碑',
    color: '#F59E0B',
    messageCount: 234,
    participants: 6
  },
  {
    id: 'topic4',
    name: '设计评审',
    description: 'UI/UX设计方案评审',
    color: '#EF4444',
    messageCount: 67,
    participants: 5
  },
  {
    id: 'topic5',
    name: '代码审查',
    description: '代码质量和规范讨论',
    color: '#8B5CF6',
    messageCount: 123,
    participants: 9
  },
  {
    id: 'topic6',
    name: '用户反馈',
    description: '用户体验和反馈收集',
    color: '#06B6D4',
    messageCount: 45,
    participants: 4
  }
];

// 斜杠命令数据
export const mockCommands = [
  {
    id: 'help',
    command: '/help',
    description: '显示所有可用命令',
    icon: '❓',
    category: '系统'
  },
  {
    id: 'clear',
    command: '/clear',
    description: '清空当前对话',
    icon: '🗑️',
    category: '系统'
  },
  {
    id: 'export',
    command: '/export',
    description: '导出对话记录',
    icon: '📤',
    category: '系统'
  },
  {
    id: 'settings',
    command: '/settings',
    description: '打开设置面板',
    icon: '⚙️',
    category: '系统'
  },
  {
    id: 'translate',
    command: '/translate',
    description: '翻译文本',
    icon: '🌐',
    category: '工具'
  },
  {
    id: 'summarize',
    command: '/summarize',
    description: '总结对话内容',
    icon: '📝',
    category: '工具'
  },
  {
    id: 'code',
    command: '/code',
    description: '代码格式化',
    icon: '💻',
    category: '工具'
  },
  {
    id: 'remind',
    command: '/remind',
    description: '设置提醒',
    icon: '⏰',
    category: '工具'
  }
];

// 表情数据
export const mockEmojis = {
  recent: ['😀', '😂', '🥰', '😍', '🤔', '👍', '❤️', '🎉'],
  smileys: [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
    '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
    '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
    '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨'
  ],
  gestures: [
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
    '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲'
  ],
  hearts: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
    '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
    '💘', '💝', '💟', '♥️', '💌', '💋', '💍', '💎'
  ],
  objects: [
    '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉',
    '⭐', '🌟', '💫', '✨', '🔥', '💯', '💢', '💥',
    '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭'
  ]
};

// 文件类型配置
export const fileTypeConfig = {
  image: {
    accept: 'image/*',
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  },
  document: {
    accept: '.pdf,.doc,.docx,.txt,.md',
    maxSize: 50 * 1024 * 1024, // 50MB
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.md']
  },
  video: {
    accept: 'video/*',
    maxSize: 100 * 1024 * 1024, // 100MB
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv']
  },
  audio: {
    accept: 'audio/*',
    maxSize: 20 * 1024 * 1024, // 20MB
    extensions: ['.mp3', '.wav', '.ogg', '.m4a']
  }
};

// 工具函数
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop();
  switch (extension) {
    case 'pdf': return '📄';
    case 'doc':
    case 'docx': return '📝';
    case 'txt':
    case 'md': return '📃';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp': return '🖼️';
    case 'mp4':
    case 'avi':
    case 'mov': return '🎥';
    case 'mp3':
    case 'wav':
    case 'ogg': return '🎵';
    default: return '📎';
  }
};

export const validateFile = (file: File, type: keyof typeof fileTypeConfig): { valid: boolean; error?: string } => {
  const config = fileTypeConfig[type];
  
  if (file.size > config.maxSize) {
    return {
      valid: false,
      error: `文件大小不能超过 ${formatFileSize(config.maxSize)}`
    };
  }
  
  const extension = '.' + file.name.toLowerCase().split('.').pop();
  if (!config.extensions.includes(extension)) {
    return {
      valid: false,
      error: `不支持的文件类型，支持的格式：${config.extensions.join(', ')}`
    };
  }
  
  return { valid: true };
};
