// 监控和错误追踪中间件

/**
 * 性能监控中间件
 */
export const performanceMonitoring = (req, res, next) => {
  const startTime = Date.now();

  // 记录请求开始
  req.startTime = startTime;

  // 监听响应完成
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    // 记录慢请求（超过2秒）
    if (duration > 2000) {
      console.warn(`🐌 慢请求检测:`, {
        method,
        url: originalUrl,
        duration: `${duration}ms`,
        status: statusCode,
        ip: ip?.substring(0, 10) + "...",
      });
    }

    // 记录错误响应
    if (statusCode >= 400) {
      console.error(`❌ 错误响应:`, {
        method,
        url: originalUrl,
        status: statusCode,
        duration: `${duration}ms`,
        ip: ip?.substring(0, 10) + "...",
      });
    }

    // 正常请求日志（仅在开发环境）
    if (process.env.NODE_ENV === "development" && statusCode < 400) {
      console.log(
        `✅ ${method} ${originalUrl} - ${statusCode} (${duration}ms)`
      );
    }
  });

  next();
};

/**
 * 错误追踪中间件
 */
export const errorTracking = (error, req, res, next) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip?.substring(0, 10) + "...",
    userAgent: req.get("User-Agent")?.substring(0, 50) + "...",
    timestamp: new Date().toISOString(),
  };

  // 记录错误
  console.error("💥 服务器错误:", errorInfo);

  // 在生产环境中，这里可以发送到错误追踪服务
  if (process.env.NODE_ENV === "production") {
    // 例如: Sentry.captureException(error, { extra: errorInfo });
  }

  // 不暴露内部错误信息给客户端
  const clientError = {
    error: "服务器内部错误",
    message:
      process.env.NODE_ENV === "development" ? error.message : "请稍后重试",
    timestamp: errorInfo.timestamp,
    requestId: req.id || "unknown",
  };

  res.status(500).json(clientError);
};

/**
 * 请求ID生成中间件
 */
export const requestIdMiddleware = (req, res, next) => {
  req.id = Math.random().toString(36).substr(2, 9);
  res.set("X-Request-ID", req.id);
  next();
};

/**
 * API使用统计中间件
 */
export const usageStats = (() => {
  const stats = {
    requests: 0,
    errors: 0,
    totalResponseTime: 0,
    endpoints: new Map(),
  };

  return (req, res, next) => {
    const startTime = Date.now();
    stats.requests++;

    // 统计端点访问次数
    const endpoint = `${req.method} ${req.route?.path || req.originalUrl}`;
    stats.endpoints.set(endpoint, (stats.endpoints.get(endpoint) || 0) + 1);

    res.on("finish", () => {
      const duration = Date.now() - startTime;
      stats.totalResponseTime += duration;

      if (res.statusCode >= 400) {
        stats.errors++;
      }
    });

    // 暴露统计信息给监控端点
    req.stats = stats;
    next();
  };
})();

/**
 * 健康检查增强
 */
export const healthCheck = (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  const stats = req.stats || {};

  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: {
      used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
      usage: `${Math.round((memory.heapUsed / memory.heapTotal) * 100)}%`,
    },
    stats: {
      requests: stats.requests || 0,
      errors: stats.errors || 0,
      errorRate: stats.requests
        ? `${Math.round((stats.errors / stats.requests) * 100)}%`
        : "0%",
      avgResponseTime: stats.requests
        ? `${Math.round(stats.totalResponseTime / stats.requests)}ms`
        : "0ms",
    },
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  };

  // 检查内存使用是否过高
  const memoryUsage = memory.heapUsed / memory.heapTotal;
  if (memoryUsage > 0.9) {
    health.status = "warning";
    health.warning = "High memory usage detected";
  }

  // 检查错误率是否过高
  const errorRate = stats.requests ? stats.errors / stats.requests : 0;
  if (errorRate > 0.1) {
    health.status = "warning";
    health.warning = "High error rate detected";
  }

  const statusCode = health.status === "healthy" ? 200 : 503;
  res.status(statusCode).json(health);
};
