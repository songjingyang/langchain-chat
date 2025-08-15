import api from "./index";

export const chatApi = {
  // 基础聊天
  basic: (data) => api.post("/chat/basic", data),

  // 对话聊天
  conversation: (data) => api.post("/chat/conversation", data),

  // 模板聊天
  template: (data) => api.post("/chat/template", data),

  // 流式聊天
  streamChat: async (data, onChunk) => {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "chunk") {
                onChunk(data);
              } else if (data.type === "done") {
                return data;
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn("解析 SSE 数据失败:", e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },
};

export const modelsApi = {
  // 获取所有模型
  getAll: () => api.get("/models"),

  // 获取特定模型
  getOne: (modelName) => api.get(`/models/${modelName}`),

  // 测试模型
  test: (modelName) => api.post(`/models/${modelName}/test`),
};

export const documentsApi = {
  // 上传文档
  upload: (formData) =>
    api.post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),

  // 文档问答
  qa: (data) => api.post("/documents/qa", data),

  // 搜索文档
  search: (data) => api.post("/documents/search", data),

  // 获取文档列表
  getAll: () => api.get("/documents"),

  // 删除文档
  delete: (documentId) => api.delete(`/documents/${documentId}`),
};

export const toolsApi = {
  // 获取所有工具
  getAll: () => api.get("/tools"),

  // 执行工具
  execute: (data) => api.post("/tools/execute", data),

  // 代理执行
  agent: (data) => api.post("/tools/agent", data),

  // 创建自定义工具
  createCustom: (data) => api.post("/tools/custom", data),

  // 工具聊天
  chat: (data) => api.post("/tools/chat", data),
};
