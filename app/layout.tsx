import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LangChain Chat - 智能AI聊天助手 | 支持GPT、Gemini、Llama多模型",
  description:
    "基于LangChain.js构建的企业级AI聊天应用，支持OpenAI GPT、Google Gemini、Groq Llama等多种AI模型，提供实时流式对话、智能提示模板、多会话管理等功能。",
  keywords: [
    "AI聊天",
    "LangChain",
    "ChatGPT",
    "Google Gemini",
    "Llama",
    "人工智能",
    "聊天机器人",
    "智能助手",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "LangChain Chat Team" }],
  creator: "LangChain Chat",
  publisher: "LangChain Chat",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url:
      process.env.NEXT_PUBLIC_SITE_URL || "https://langchain-chat.vercel.app",
    siteName: "LangChain Chat",
    title: "LangChain Chat - 智能AI聊天助手",
    description:
      "基于LangChain.js构建的企业级AI聊天应用，支持多种AI模型的实时对话体验",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LangChain Chat - 智能AI聊天助手",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LangChain Chat - 智能AI聊天助手",
    description: "基于LangChain.js构建的企业级AI聊天应用，支持多种AI模型",
    images: ["/twitter-image.png"],
    creator: "@langchainchat",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    yahoo: process.env.YAHOO_VERIFICATION,
  },
  alternates: {
    canonical:
      process.env.NEXT_PUBLIC_SITE_URL || "https://langchain-chat.vercel.app",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("🏗️ RootLayout 渲染中");

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>

        {/* 性能优化脚本 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 预加载关键资源
              if (typeof window !== 'undefined') {
                // 预加载关键字体
                const fontLink = document.createElement('link');
                fontLink.rel = 'preload';
                fontLink.href = '/fonts/geist-sans.woff2';
                fontLink.as = 'font';
                fontLink.type = 'font/woff2';
                fontLink.crossOrigin = 'anonymous';
                document.head.appendChild(fontLink);

                // 监控 Core Web Vitals
                if ('PerformanceObserver' in window) {
                  // FCP 监控
                  new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry && process.env.NODE_ENV === 'development') {
                      console.log('FCP:', fcpEntry.startTime);
                    }
                  }).observe({ entryTypes: ['paint'] });
                }
              }
            `,
          }}
        />

        {/* 结构化数据 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "LangChain Chat",
              description:
                "基于LangChain.js构建的企业级AI聊天应用，支持多种AI模型",
              url:
                process.env.NEXT_PUBLIC_SITE_URL ||
                "https://langchain-chat.vercel.app",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              creator: {
                "@type": "Organization",
                name: "LangChain Chat Team",
              },
              featureList: [
                "多AI模型支持",
                "实时流式对话",
                "智能提示模板",
                "多会话管理",
                "深色模式",
                "响应式设计",
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
