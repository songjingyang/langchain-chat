import http from "http";

const options = {
  host: process.env.HOST || "localhost",
  port: process.env.PORT || 3000,
  path: process.env.HEALTH_CHECK_PATH || "/health",
  method: "GET",
  timeout: 2000,
};

const request = http.request(options, (res) => {
  console.log(`健康检查状态: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on("error", (err) => {
  console.error("健康检查失败:", err.message);
  process.exit(1);
});

request.on("timeout", () => {
  console.error("健康检查超时");
  request.destroy();
  process.exit(1);
});

request.end();
