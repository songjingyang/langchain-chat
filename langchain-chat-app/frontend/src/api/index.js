import axios from "axios";
import { ElMessage } from "element-plus";

// 创建 axios 实例
const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证 token
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }

    return config;
  },
  (error) => {
    console.error("请求错误:", error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("响应错误:", error);

    let message = "请求失败";

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message = data.error || "请求参数错误";
          break;
        case 401:
          message = "未授权，请重新登录";
          break;
        case 403:
          message = "拒绝访问";
          break;
        case 404:
          message = "请求的资源不存在";
          break;
        case 500:
          message = "服务器内部错误";
          break;
        default:
          message = data.error || `请求失败 (${status})`;
      }
    } else if (error.request) {
      message = "网络连接失败";
    } else {
      message = error.message || "未知错误";
    }

    ElMessage.error(message);
    return Promise.reject(error);
  }
);

// 模型相关API
export const modelsAPI = {
  // 获取所有可用模型
  getModels() {
    return api.get("/models");
  },

  // 获取特定模型信息
  getModel(modelName) {
    return api.get(`/models/${modelName}`);
  },

  // 测试模型连接
  testModel(modelName) {
    return api.post(`/models/${modelName}/test`);
  },
};

export default api;
