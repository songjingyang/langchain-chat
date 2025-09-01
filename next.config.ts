import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化配置
  experimental: {
    // 启用 React 18 的并发特性
    reactStrictMode: true,
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

  // 开发服务器优化
  ...(process.env.NODE_ENV === "development" && {
    devIndicators: {
      buildActivity: false, // 关闭构建指示器以提升性能
    },
  }),
};

export default nextConfig;
