import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 启用 React 18 的严格模式
  reactStrictMode: true,
  
  // 性能优化配置
  experimental: {
    // 优化包大小
    optimizePackageImports: [
      "@langchain/core",
      "@langchain/openai",
      "@langchain/groq",
      "@langchain/google-genai",
    ],
  },

  // 编译优化
  compiler: {
    // 移除 console.log (仅在生产环境)
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // 构建优化
  webpack: (config, { dev, isServer }) => {
    // 开发环境优化
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }

    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
            langchain: {
              test: /[\\/]node_modules[\\/]@?langchain/,
              name: "langchain",
              chunks: "all",
              priority: 10,
            },
          },
        },
      };
    }

    return config;
  },

  // 图片优化
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  // 压缩配置
  compress: true,

  // SEO 优化配置
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        source: "/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
