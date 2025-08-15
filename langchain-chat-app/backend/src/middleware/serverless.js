// Serverless环境适配中间件

/**
 * 检测当前环境是否为Serverless
 */
export const isServerless = () => {
  return !!(
    process.env.VERCEL ||
    process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RENDER
  );
};

/**
 * Serverless环境优化中间件
 */
export const serverlessMiddleware = (req, res, next) => {
  // 设置适当的缓存头
  if (req.method === "GET" && !req.url.includes("/api/")) {
    res.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  // 在Serverless环境中禁用Keep-Alive
  if (isServerless()) {
    res.set("Connection", "close");
  }

  // 设置CORS头（适用于所有环境）
  res.set("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 处理预检请求
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
};

/**
 * 超时处理中间件
 */
export const timeoutMiddleware = (timeout = 25000) => {
  return (req, res, next) => {
    // 在Serverless环境中设置较短的超时时间
    const actualTimeout = isServerless() ? Math.min(timeout, 25000) : timeout;

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          error: "请求超时",
          message: "服务器处理时间过长，请重试",
        });
      }
    }, actualTimeout);

    // 清理计时器
    res.on("finish", () => clearTimeout(timer));
    res.on("close", () => clearTimeout(timer));

    next();
  };
};

/**
 * 内存优化中间件
 */
export const memoryOptimization = (req, res, next) => {
  // 在Serverless环境中启用垃圾回收
  if (isServerless() && global.gc) {
    // 请求完成后强制垃圾回收
    res.on("finish", () => {
      setImmediate(() => {
        if (global.gc) global.gc();
      });
    });
  }

  next();
};
