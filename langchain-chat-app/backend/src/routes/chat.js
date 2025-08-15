import express from 'express';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { modelManager } from '../config/models.js';
import { wss } from '../server.js';

const router = express.Router();

/**
 * 基础聊天接口
 */
router.post('/basic', async (req, res) => {
  try {
    const { message, model = 'default', systemPrompt, temperature } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 设置温度
    if (temperature !== undefined) {
      chatModel.temperature = temperature;
    }

    // 构建消息
    const messages = [];
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    messages.push(new HumanMessage(message));

    // 调用模型
    const response = await chatModel.invoke(messages);

    res.json({
      success: true,
      data: {
        message: response.content,
        model: modelName,
        usage: response.usage_metadata || null
      }
    });

  } catch (error) {
    console.error('基础聊天错误:', error);
    res.status(500).json({
      error: '聊天处理失败',
      message: error.message
    });
  }
});

/**
 * 流式聊天接口
 */
router.post('/stream', async (req, res) => {
  try {
    const { message, model = 'default', systemPrompt, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 构建消息
    const messages = [];
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }
    messages.push(new HumanMessage(message));

    // 流式调用
    const stream = await chatModel.stream(messages);
    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.content;
      if (content) {
        fullResponse += content;
        
        // 发送 SSE 数据
        res.write(`data: ${JSON.stringify({
          type: 'chunk',
          content: content,
          conversationId
        })}\n\n`);
      }
    }

    // 发送完成信号
    res.write(`data: ${JSON.stringify({
      type: 'done',
      fullResponse,
      model: modelName,
      conversationId
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('流式聊天错误:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * 对话历史聊天
 */
router.post('/conversation', async (req, res) => {
  try {
    const { 
      message, 
      history = [], 
      model = 'default', 
      systemPrompt,
      maxHistory = 10 
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 构建消息历史
    const messages = [];
    
    if (systemPrompt) {
      messages.push(new SystemMessage(systemPrompt));
    }

    // 添加历史消息（限制数量）
    const recentHistory = history.slice(-maxHistory);
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    }

    // 添加当前消息
    messages.push(new HumanMessage(message));

    // 调用模型
    const response = await chatModel.invoke(messages);

    res.json({
      success: true,
      data: {
        message: response.content,
        model: modelName,
        usage: response.usage_metadata || null,
        historyLength: recentHistory.length
      }
    });

  } catch (error) {
    console.error('对话聊天错误:', error);
    res.status(500).json({
      error: '对话处理失败',
      message: error.message
    });
  }
});

/**
 * 使用提示模板的聊天
 */
router.post('/template', async (req, res) => {
  try {
    const { 
      template, 
      variables = {}, 
      model = 'default',
      userMessage 
    } = req.body;

    if (!template && !userMessage) {
      return res.status(400).json({ error: '模板或用户消息不能为空' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    let response;

    if (template) {
      // 使用提示模板
      const promptTemplate = ChatPromptTemplate.fromTemplate(template);
      const chain = promptTemplate.pipe(chatModel).pipe(new StringOutputParser());
      response = await chain.invoke(variables);
    } else {
      // 直接使用用户消息
      response = await chatModel.invoke([new HumanMessage(userMessage)]);
      response = response.content;
    }

    res.json({
      success: true,
      data: {
        message: response,
        model: modelName,
        template: template || null,
        variables
      }
    });

  } catch (error) {
    console.error('模板聊天错误:', error);
    res.status(500).json({
      error: '模板处理失败',
      message: error.message
    });
  }
});

export default router;
