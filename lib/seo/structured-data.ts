// 结构化数据生成器

export interface WebApplicationSchema {
  '@context': 'https://schema.org'
  '@type': 'WebApplication'
  name: string
  description: string
  url: string
  applicationCategory: string
  operatingSystem: string
  offers: {
    '@type': 'Offer'
    price: string
    priceCurrency: string
  }
  creator: {
    '@type': 'Organization'
    name: string
  }
  featureList: string[]
  screenshot?: string[]
  aggregateRating?: {
    '@type': 'AggregateRating'
    ratingValue: number
    reviewCount: number
  }
}

export interface OrganizationSchema {
  '@context': 'https://schema.org'
  '@type': 'Organization'
  name: string
  url: string
  logo: string
  description: string
  foundingDate?: string
  contactPoint?: {
    '@type': 'ContactPoint'
    contactType: string
    email?: string
    url?: string
  }
}

export interface FAQSchema {
  '@context': 'https://schema.org'
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

export function generateWebApplicationSchema(): WebApplicationSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://langchain-chat.vercel.app'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LangChain Chat',
    description: '基于LangChain.js构建的企业级AI聊天应用，支持多种AI模型',
    url: baseUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    creator: {
      '@type': 'Organization',
      name: 'LangChain Chat Team'
    },
    featureList: [
      '多AI模型支持（OpenAI GPT、Google Gemini、Groq Llama）',
      '实时流式对话体验',
      '智能提示模板系统',
      '多会话管理',
      '深色模式支持',
      '响应式设计',
      '文件上传和分析',
      '图像和视频生成',
      '提示词优化'
    ],
    screenshot: [
      `${baseUrl}/screenshot-desktop.png`,
      `${baseUrl}/screenshot-mobile.png`
    ]
  }
}

export function generateOrganizationSchema(): OrganizationSchema {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://langchain-chat.vercel.app'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LangChain Chat',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: '专注于AI聊天应用开发的技术团队，致力于提供最佳的AI对话体验',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${baseUrl}/contact`
    }
  }
}

export function generateFAQSchema(): FAQSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'LangChain Chat支持哪些AI模型？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LangChain Chat支持多种主流AI模型，包括OpenAI GPT-4o Mini、Google Gemini 1.5 Flash、Groq Llama 3.1 8B等，用户可以根据需要选择最适合的模型。'
        }
      },
      {
        '@type': 'Question',
        name: '如何开始使用LangChain Chat？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '使用LangChain Chat非常简单：1. 访问我们的网站；2. 选择您喜欢的AI模型；3. 在输入框中输入您的问题；4. 享受实时的AI对话体验。无需注册即可开始使用。'
        }
      },
      {
        '@type': 'Question',
        name: 'LangChain Chat是否免费使用？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'LangChain Chat提供免费的基础功能，用户可以体验AI聊天、多会话管理等核心功能。高级功能和更多API调用额度可能需要付费订阅。'
        }
      },
      {
        '@type': 'Question',
        name: '我的聊天记录是否安全？',
        acceptedAnswer: {
          '@type': 'Answer',
          text: '我们非常重视用户隐私和数据安全。聊天记录存储在您的本地浏览器中，我们不会收集或存储您的个人对话内容。您可以随时导出或删除您的聊天记录。'
        }
      }
    ]
  }
}

// 生成完整的结构化数据
export function generateAllStructuredData() {
  return {
    webApplication: generateWebApplicationSchema(),
    organization: generateOrganizationSchema(),
    faq: generateFAQSchema()
  }
}
