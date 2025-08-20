import { TemplateCategory } from '../types';

// 预定义的模板分类
export const DEFAULT_CATEGORIES: TemplateCategory[] = [
  {
    id: 'development',
    name: '开发编程',
    description: '编程、代码审查、技术问题解决',
    icon: '💻',
  },
  {
    id: 'writing',
    name: '写作创作',
    description: '文章写作、内容创作、文案优化',
    icon: '✍️',
  },
  {
    id: 'translation',
    name: '翻译语言',
    description: '多语言翻译、语言学习',
    icon: '🌐',
  },
  {
    id: 'education',
    name: '教育学习',
    description: '知识解释、学习辅导、概念理解',
    icon: '📚',
  },
  {
    id: 'business',
    name: '商务办公',
    description: '商务沟通、报告撰写、邮件模板',
    icon: '💼',
  },
  {
    id: 'creative',
    name: '创意设计',
    description: '创意思考、设计灵感、艺术创作',
    icon: '🎨',
  },
  {
    id: 'analysis',
    name: '分析研究',
    description: '数据分析、研究报告、逻辑推理',
    icon: '📊',
  },
  {
    id: 'custom',
    name: '自定义',
    description: '用户自定义的模板',
    icon: '⚙️',
  },
];

// 获取分类信息
export function getCategoryById(categoryId: string): TemplateCategory | undefined {
  return DEFAULT_CATEGORIES.find(cat => cat.id === categoryId);
}

// 获取分类图标
export function getCategoryIcon(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.icon || '📝';
}

// 获取分类名称
export function getCategoryName(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category?.name || '未知分类';
}

// 获取所有分类
export function getAllCategories(): TemplateCategory[] {
  return DEFAULT_CATEGORIES;
}
