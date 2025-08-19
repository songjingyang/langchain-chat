# 测试Markdown渲染功能

## 表格测试

| 功能 | 状态 | 描述 |
|------|------|------|
| Markdown表格 | ✅ 已实现 | 支持表格渲染 |
| 代码高亮 | ✅ 已实现 | 支持语法高亮 |
| 打字机效果 | ✅ 已实现 | 流式显示效果 |

## 代码块测试

```javascript
// JavaScript代码示例
function createChatModel(provider) {
  console.log(`创建${provider}模型`);
  return new ChatModel({
    provider,
    streaming: true
  });
}
```

```python
# Python代码示例
def process_message(message):
    """处理聊天消息"""
    return {
        'content': message,
        'timestamp': datetime.now()
    }
```

## 列表测试

### 无序列表
- OpenAI GPT-4o Mini
- Groq Llama 3.1 8B
- Google Gemini 1.5 Flash

### 有序列表
1. 创建聊天模型
2. 发送消息
3. 处理流式响应
4. 渲染Markdown内容

## 链接测试

访问 [LangChain.js文档](https://js.langchain.com/docs/introduction) 了解更多信息。

## 引用测试

> 这是一个引用块示例。
> 用于展示重要信息或引用内容。

## 内联代码测试

使用 `npm run dev` 启动开发服务器，然后访问 `http://localhost:3000` 查看应用。
