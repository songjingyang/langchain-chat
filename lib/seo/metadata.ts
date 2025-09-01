import { Metadata } from 'next'

interface SEOConfig {
  title: string
  description: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
}

export function generateMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://langchain-chat.vercel.app'
  const fullUrl = config.url ? `${baseUrl}${config.url}` : baseUrl
  const imageUrl = config.image ? `${baseUrl}${config.image}` : `${baseUrl}/og-image.png`

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    openGraph: {
      type: config.type || 'website',
      locale: 'zh_CN',
      url: fullUrl,
      siteName: 'LangChain Chat',
      title: config.title,
      description: config.description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: config.title,
        },
      ],
      ...(config.publishedTime && { publishedTime: config.publishedTime }),
      ...(config.modifiedTime && { modifiedTime: config.modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [imageUrl],
      creator: '@langchainchat',
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

export const defaultSEOConfig: SEOConfig = {
  title: 'LangChain Chat - 智能AI聊天助手 | 支持GPT、Gemini、Llama多模型',
  description: '基于LangChain.js构建的企业级AI聊天应用，支持OpenAI GPT、Google Gemini、Groq Llama等多种AI模型，提供实时流式对话、智能提示模板、多会话管理等功能。',
  keywords: [
    'AI聊天',
    'LangChain',
    'ChatGPT',
    'Google Gemini',
    'Llama',
    '人工智能',
    '聊天机器人',
    '智能助手',
    'Next.js',
    'TypeScript',
    '流式对话',
    '多模型支持',
    '企业级应用'
  ],
}

// 页面特定的SEO配置
export const pageSEOConfigs = {
  home: {
    ...defaultSEOConfig,
    url: '/',
  },
  chat: {
    title: 'AI聊天对话 - LangChain Chat',
    description: '与AI进行智能对话，支持多种AI模型，实时流式响应，提供最佳的聊天体验。',
    keywords: ['AI对话', '智能聊天', '实时响应', '多模型支持'],
    url: '/chat',
  },
  api: {
    title: 'API文档 - LangChain Chat',
    description: 'LangChain Chat API接口文档，了解如何集成和使用我们的AI聊天服务。',
    keywords: ['API文档', 'AI接口', '开发者文档', '集成指南'],
    url: '/api',
  },
} as const

export type PageSEOKey = keyof typeof pageSEOConfigs
