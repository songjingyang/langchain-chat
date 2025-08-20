import {
  PromptTemplate,
  ChatPromptTemplate,
  StringPromptTemplate,
  TemplateContext,
  Message,
  MessageTemplate,
} from "../types";
import { v4 as uuidv4 } from "uuid";

const TEMPLATES_KEY = "langchain-chat-templates";

// 获取所有模板
export function getTemplates(): PromptTemplate[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    if (!stored) return getDefaultTemplates();

    const templates = JSON.parse(stored);
    return templates.map((template: PromptTemplate) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt),
    }));
  } catch (error) {
    console.error("获取模板失败:", error);
    return getDefaultTemplates();
  }
}

// 保存模板
export function saveTemplates(templates: PromptTemplate[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error("保存模板失败:", error);
  }
}

// 创建新模板
export function createTemplate(
  type: "chat" | "string",
  name: string,
  description: string,
  category: string = "custom"
): PromptTemplate {
  const baseTemplate = {
    id: uuidv4(),
    name,
    description,
    category,
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
    variables: {},
  };

  if (type === "chat") {
    return {
      ...baseTemplate,
      type: "chat",
      messages: [
        {
          role: "system",
          content: "你是一个有用的AI助手。",
          variables: [],
        },
      ],
    } as ChatPromptTemplate;
  } else {
    return {
      ...baseTemplate,
      type: "string",
      template: "请帮我{task}。",
    } as StringPromptTemplate;
  }
}

// 更新模板
export function updateTemplate(
  templateId: string,
  updates: Partial<PromptTemplate>
): void {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === templateId);

  if (index !== -1) {
    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date(),
    } as PromptTemplate;
    saveTemplates(templates);
  }
}

// 删除模板
export function deleteTemplate(templateId: string): void {
  const templates = getTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  saveTemplates(filtered);
}

// 增加使用次数
export function incrementUsage(templateId: string): void {
  const templates = getTemplates();
  const template = templates.find((t) => t.id === templateId);

  if (template) {
    template.usageCount += 1;
    template.updatedAt = new Date();
    saveTemplates(templates);
  }
}

// 渲染字符串模板
export function renderStringTemplate(
  template: string,
  context: TemplateContext
): string {
  let rendered = template;

  // 替换内置占位符
  if (context.input) {
    rendered = rendered.replace(/\{input\}/g, context.input);
  }

  if (context.history && context.history.length > 0) {
    const historyText = context.history
      .map((msg) => `${msg.role === "user" ? "用户" : "AI"}: ${msg.content}`)
      .join("\n");
    rendered = rendered.replace(/\{history\}/g, historyText);
  }

  // 替换自定义变量
  if (context.variables) {
    Object.entries(context.variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, "g");
      rendered = rendered.replace(regex, String(value));
    });
  }

  return rendered;
}

// 渲染聊天模板
export function renderChatTemplate(
  template: ChatPromptTemplate,
  context: TemplateContext
): MessageTemplate[] {
  return template.messages.map((msgTemplate) => ({
    ...msgTemplate,
    content: renderStringTemplate(msgTemplate.content, context),
  }));
}

// 提取模板中的变量
export function extractVariables(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return [];

  return [...new Set(matches.map((match) => match.slice(1, -1)))];
}

// 验证模板语法
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 检查括号匹配
  const openBrackets = (template.match(/\{/g) || []).length;
  const closeBrackets = (template.match(/\}/g) || []).length;

  if (openBrackets !== closeBrackets) {
    errors.push("括号不匹配");
  }

  // 检查空变量名
  const emptyVariables = template.match(/\{\s*\}/g);
  if (emptyVariables) {
    errors.push("存在空的变量名");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// 获取默认模板
export function getDefaultTemplates(): PromptTemplate[] {
  const now = new Date();

  return [
    // 代码助手模板
    {
      id: "code-assistant",
      name: "代码助手",
      description: "专业的编程助手，帮助解决代码问题",
      type: "chat",
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的编程助手。请用清晰、准确的方式回答编程相关问题，并提供可运行的代码示例。",
          variables: [],
        },
        {
          role: "user",
          content: "{input}",
          variables: ["input"],
        },
      ],
      variables: {},
      category: "development",
      tags: ["编程", "代码", "开发"],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    } as ChatPromptTemplate,

    // 写作助手模板
    {
      id: "writing-assistant",
      name: "写作助手",
      description: "帮助改进文章写作和内容创作",
      type: "chat",
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的写作助手。请帮助用户改进文章结构、语言表达和内容质量。",
          variables: [],
        },
        {
          role: "user",
          content: "请帮我{task}：\n\n{content}",
          variables: ["task", "content"],
        },
      ],
      variables: {
        task: "润色文章",
        content: "",
      },
      category: "writing",
      tags: ["写作", "文章", "润色"],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    } as ChatPromptTemplate,

    // 翻译助手模板
    {
      id: "translation-assistant",
      name: "翻译助手",
      description: "专业的多语言翻译助手",
      type: "string",
      template:
        "请将以下{source_lang}文本翻译成{target_lang}，保持原意和语调：\n\n{text}",
      variables: {
        source_lang: "中文",
        target_lang: "英文",
        text: "",
      },
      category: "translation",
      tags: ["翻译", "语言", "多语言"],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    } as StringPromptTemplate,

    // 学习助手模板
    {
      id: "learning-assistant",
      name: "学习助手",
      description: "帮助学习和理解复杂概念",
      type: "chat",
      messages: [
        {
          role: "system",
          content:
            "你是一个耐心的学习助手。请用简单易懂的方式解释复杂概念，并提供实例和练习建议。",
          variables: [],
        },
        {
          role: "user",
          content: "请帮我理解{topic}，我的当前水平是{level}。",
          variables: ["topic", "level"],
        },
      ],
      variables: {
        topic: "",
        level: "初学者",
      },
      category: "education",
      tags: ["学习", "教育", "解释"],
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    } as ChatPromptTemplate,
  ];
}
