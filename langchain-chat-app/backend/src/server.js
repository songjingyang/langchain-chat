import "dotenv/config";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";

// 导入路由
import chatRoutes from "./routes/chat.js";
import modelsRoutes from "./routes/models.js";
import documentsRoutes from "./routes/documents.js";
import toolsRoutes from "./routes/tools.js";

// 导入Serverless中间件
import {
  isServerless,
  serverlessMiddleware,
  timeoutMiddleware,
  memoryOptimization,
} from "./middleware/serverless.js";

// 导入监控中间件
import {
  performanceMonitoring,
  errorTracking,
  requestIdMiddleware,
  usageStats,
  healthCheck,
} from "./middleware/monitoring.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 信任代理
app.set("trust proxy", 1);

// 监控和请求追踪
app.use(requestIdMiddleware);
app.use(usageStats);
app.use(performanceMonitoring);

// Serverless环境适配
app.use(serverlessMiddleware);
app.use(memoryOptimization);
app.use(timeoutMiddleware(25000));

// 安全中间件
if (!isServerless()) {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );
}

// 压缩中间件
app.use(compression());

// 限流中间件（在Serverless环境中使用更宽松的限制）
const limiter = rateLimit({
  windowMs:
    parseInt(process.env.RATE_LIMIT_WINDOW_MS) ||
    (isServerless() ? 60000 : 15 * 60 * 1000),
  max:
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) ||
    (isServerless() ? 300 : 100),
  message: {
    error: "请求过于频繁，请稍后再试",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isServerless() && req.url.includes("/health"),
});

if (!isServerless()) {
  app.use("/api", limiter);
}

// CORS中间件
const corsOrigin =
  process.env.CORS_ORIGIN ||
  process.env.FRONTEND_URL ||
  "http://localhost:5173";
app.use(
  cors({
    origin: corsOrigin.split(",").map((origin) => origin.trim()),
    credentials: true,
  })
);

// 解析中间件
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 静态文件服务
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// API 路由
app.use("/api/chat", chatRoutes);
app.use("/api/models", modelsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/tools", toolsRoutes);

// 健康检查端点（使用增强的健康检查）
app.get("/health", healthCheck);

// API健康检查
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// 监控指标端点
app.get("/metrics", (req, res) => {
  const metrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
    environment: process.env.NODE_ENV,
  };
  res.json(metrics);
});

// WebSocket 连接处理
wss.on("connection", (ws, req) => {
  console.log("新的 WebSocket 连接");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("收到消息:", data.type);

      // 根据消息类型处理不同的请求
      switch (data.type) {
        case "chat":
          // 处理聊天消息 - 在 chat routes 中实现
          break;
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        default:
          ws.send(
            JSON.stringify({
              type: "error",
              message: "未知的消息类型",
            })
          );
      }
    } catch (error) {
      console.error("WebSocket 消息处理错误:", error);
      ws.send(
        JSON.stringify({
          type: "error",
          message: "消息处理失败",
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("WebSocket 连接关闭");
  });

  ws.on("error", (error) => {
    console.error("WebSocket 错误:", error);
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error("服务器错误:", error);
  res.status(500).json({
    error: "内部服务器错误",
    message:
      process.env.NODE_ENV === "development" ? error.message : "服务暂时不可用",
  });
});

// 404 处理
app.use("*", (req, res) => {
  res.status(404).json({
    error: "接口不存在",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 3000;

// 检查是否在Serverless环境中
if (
  process.env.VERCEL ||
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME
) {
  // Serverless环境，导出app而不是启动服务器
  console.log("🌐 Serverless环境检测到");
} else {
  // 传统服务器环境
  server.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📡 WebSocket 服务运行在 ws://localhost:${PORT}`);
    console.log(`🌍 环境: ${process.env.NODE_ENV || "development"}`);
  });

  // 优雅关闭
  process.on("SIGTERM", () => {
    console.log("收到 SIGTERM 信号，正在关闭服务器...");
    server.close(() => {
      console.log("服务器已关闭");
      process.exit(0);
    });
  });
}

// 全局错误处理器（放在最后）
app.use(errorTracking);

export default app;
export { wss };
