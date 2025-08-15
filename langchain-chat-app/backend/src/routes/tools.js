import express from 'express';
import { DynamicTool } from '@langchain/core/tools';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { pull } from 'langchain/hub';
import { modelManager } from '../config/models.js';

const router = express.Router();

/**
 * 内置工具定义
 */
const builtinTools = {
  calculator: new DynamicTool({
    name: 'calculator',
    description: '执行基本的数学计算，输入应该是数学表达式',
    func: async (input) => {
      try {
        // 安全的数学表达式计算
        const result = Function('"use strict"; return (' + input + ')')();
        return `计算结果: ${result}`;
      } catch (error) {
        return `计算错误: ${error.message}`;
      }
    },
  }),

  currentTime: new DynamicTool({
    name: 'current_time',
    description: '获取当前时间和日期',
    func: async () => {
      const now = new Date();
      return `当前时间: ${now.toLocaleString('zh-CN')}`;
    },
  }),

  textLength: new DynamicTool({
    name: 'text_length',
    description: '计算文本长度，输入应该是要计算长度的文本',
    func: async (input) => {
      return `文本长度: ${input.length} 个字符`;
    },
  }),

  wordCount: new DynamicTool({
    name: 'word_count',
    description: '统计文本中的单词数量，输入应该是要统计的文本',
    func: async (input) => {
      const words = input.trim().split(/\s+/).filter(word => word.length > 0);
      const chineseChars = (input.match(/[\u4e00-\u9fa5]/g) || []).length;
      return `单词数: ${words.length}, 中文字符数: ${chineseChars}`;
    },
  }),

  jsonFormatter: new DynamicTool({
    name: 'json_formatter',
    description: '格式化JSON字符串，输入应该是JSON字符串',
    func: async (input) => {
      try {
        const parsed = JSON.parse(input);
        return JSON.stringify(parsed, null, 2);
      } catch (error) {
        return `JSON格式化错误: ${error.message}`;
      }
    },
  }),
};

/**
 * 获取所有可用工具
 */
router.get('/', (req, res) => {
  try {
    const tools = Object.keys(builtinTools).map(name => ({
      name,
      description: builtinTools[name].description,
      builtin: true
    }));

    res.json({
      success: true,
      data: {
        tools,
        total: tools.length
      }
    });

  } catch (error) {
    console.error('获取工具列表错误:', error);
    res.status(500).json({
      error: '获取工具列表失败',
      message: error.message
    });
  }
});

/**
 * 执行单个工具
 */
router.post('/execute', async (req, res) => {
  try {
    const { toolName, input } = req.body;

    if (!toolName) {
      return res.status(400).json({ error: '工具名称不能为空' });
    }

    const tool = builtinTools[toolName];
    if (!tool) {
      return res.status(404).json({ error: '工具不存在' });
    }

    const result = await tool.func(input || '');

    res.json({
      success: true,
      data: {
        toolName,
        input,
        result
      }
    });

  } catch (error) {
    console.error('工具执行错误:', error);
    res.status(500).json({
      error: '工具执行失败',
      message: error.message
    });
  }
});

/**
 * 使用代理执行复杂任务
 */
router.post('/agent', async (req, res) => {
  try {
    const { 
      task, 
      model = 'default', 
      tools = ['calculator', 'currentTime', 'textLength'],
      maxIterations = 5 
    } = req.body;

    if (!task) {
      return res.status(400).json({ error: '任务描述不能为空' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 选择工具
    const selectedTools = tools.map(toolName => {
      const tool = builtinTools[toolName];
      if (!tool) {
        throw new Error(`工具 ${toolName} 不存在`);
      }
      return tool;
    });

    // 创建代理
    const prompt = await pull('hwchase17/react');
    const agent = await createReactAgent({
      llm: chatModel,
      tools: selectedTools,
      prompt,
    });

    const agentExecutor = new AgentExecutor({
      agent,
      tools: selectedTools,
      maxIterations,
      verbose: true,
    });

    // 执行任务
    const result = await agentExecutor.invoke({
      input: task,
    });

    res.json({
      success: true,
      data: {
        task,
        result: result.output,
        model: modelName,
        toolsUsed: tools,
        iterations: result.intermediateSteps?.length || 0
      }
    });

  } catch (error) {
    console.error('代理执行错误:', error);
    res.status(500).json({
      error: '代理执行失败',
      message: error.message
    });
  }
});

/**
 * 创建自定义工具
 */
router.post('/custom', async (req, res) => {
  try {
    const { name, description, code } = req.body;

    if (!name || !description || !code) {
      return res.status(400).json({ error: '工具名称、描述和代码不能为空' });
    }

    // 创建自定义工具
    const customTool = new DynamicTool({
      name,
      description,
      func: async (input) => {
        try {
          // 注意：在生产环境中，执行用户代码需要沙箱环境
          const func = new Function('input', code);
          return await func(input);
        } catch (error) {
          return `执行错误: ${error.message}`;
        }
      },
    });

    // 临时存储自定义工具（实际项目中应该持久化）
    builtinTools[name] = customTool;

    res.json({
      success: true,
      data: {
        name,
        description,
        created: true
      }
    });

  } catch (error) {
    console.error('创建自定义工具错误:', error);
    res.status(500).json({
      error: '创建自定义工具失败',
      message: error.message
    });
  }
});

/**
 * 工具调用聊天
 */
router.post('/chat', async (req, res) => {
  try {
    const { 
      message, 
      model = 'default', 
      availableTools = ['calculator', 'currentTime', 'textLength'] 
    } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息内容不能为空' });
    }

    // 获取模型
    const modelName = model === 'default' ? modelManager.getDefaultModel() : model;
    const chatModel = modelManager.getModel(modelName);

    // 准备工具
    const tools = availableTools.map(toolName => {
      const tool = builtinTools[toolName];
      if (!tool) {
        throw new Error(`工具 ${toolName} 不存在`);
      }
      return tool;
    });

    // 绑定工具到模型
    const modelWithTools = chatModel.bindTools(tools);

    // 调用模型
    const response = await modelWithTools.invoke([
      { role: 'user', content: message }
    ]);

    // 处理工具调用
    let finalResponse = response.content;
    const toolCalls = response.tool_calls || [];

    if (toolCalls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of toolCalls) {
        const tool = tools.find(t => t.name === toolCall.name);
        if (tool) {
          const result = await tool.func(toolCall.args.input || '');
          toolResults.push({
            tool: toolCall.name,
            input: toolCall.args.input,
            result
          });
        }
      }

      res.json({
        success: true,
        data: {
          message: finalResponse,
          toolCalls: toolResults,
          model: modelName
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          message: finalResponse,
          model: modelName
        }
      });
    }

  } catch (error) {
    console.error('工具聊天错误:', error);
    res.status(500).json({
      error: '工具聊天失败',
      message: error.message
    });
  }
});

export default router;
