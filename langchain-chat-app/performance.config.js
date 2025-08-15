// 性能优化配置文件

export const performanceConfig = {
  // API响应时间目标
  responseTimeTargets: {
    health: 100, // 健康检查 < 100ms
    models: 500, // 模型列表 < 500ms
    chat: 5000, // 聊天响应 < 5s
    upload: 10000, // 文件上传 < 10s
  },

  // 缓存配置
  cache: {
    static: {
      maxAge: 31536000, // 静态资源缓存1年
      immutable: true,
    },
    api: {
      models: 300, // 模型列表缓存5分钟
      health: 30, // 健康检查缓存30秒
    },
  },

  // 压缩配置
  compression: {
    level: 6, // gzip压缩级别
    threshold: 1024, // 最小压缩阈值
    filter: (req, res) => {
      // 不压缩已压缩的内容
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return true;
    },
  },

  // 限流配置
  rateLimit: {
    production: {
      windowMs: 15 * 60 * 1000, // 15分钟
      max: 100, // 每IP 100请求
    },
    development: {
      windowMs: 60 * 1000, // 1分钟
      max: 1000, // 每IP 1000请求
    },
    serverless: {
      windowMs: 60 * 1000, // 1分钟
      max: 300, // 每IP 300请求
    },
  },

  // 监控配置
  monitoring: {
    slowRequestThreshold: 2000, // 慢请求阈值 2s
    errorRateThreshold: 0.1, // 错误率阈值 10%
    memoryThreshold: 0.9, // 内存使用阈值 90%
    logLevel: process.env.NODE_ENV === "production" ? "error" : "debug",
  },

  // Serverless优化
  serverless: {
    timeout: 25000, // 函数超时时间
    memoryLimit: 512, // 内存限制 MB
    enableGC: true, // 启用垃圾回收
    keepWarm: false, // 不启用预热（免费层限制）
  },
};

// 根据环境获取配置
export const getConfig = (env = process.env.NODE_ENV) => {
  const config = { ...performanceConfig };

  if (env === "production") {
    config.monitoring.logLevel = "error";
    config.compression.level = 9;
    config.cache.static.maxAge = 31536000;
  } else if (env === "development") {
    config.monitoring.logLevel = "debug";
    config.compression.level = 1;
    config.cache.static.maxAge = 0;
  }

  return config;
};
