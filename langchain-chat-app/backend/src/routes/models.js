import express from 'express';
import { modelManager } from '../config/models.js';

const router = express.Router();

/**
 * 获取所有可用模型
 */
router.get('/', (req, res) => {
  try {
    const models = modelManager.getAvailableModels();
    res.json({
      success: true,
      data: {
        models,
        default: modelManager.getDefaultModel(),
        total: models.length
      }
    });
  } catch (error) {
    console.error('获取模型列表错误:', error);
    res.status(500).json({
      error: '获取模型列表失败',
      message: error.message
    });
  }
});

/**
 * 获取特定模型信息
 */
router.get('/:modelName', (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!modelManager.isModelAvailable(modelName)) {
      return res.status(404).json({
        error: '模型不存在',
        modelName
      });
    }

    res.json({
      success: true,
      data: {
        id: modelName,
        name: modelManager.getModelDisplayName(modelName),
        provider: modelManager.getModelProvider(modelName),
        available: true
      }
    });
  } catch (error) {
    console.error('获取模型信息错误:', error);
    res.status(500).json({
      error: '获取模型信息失败',
      message: error.message
    });
  }
});

/**
 * 测试模型连接
 */
router.post('/:modelName/test', async (req, res) => {
  try {
    const { modelName } = req.params;
    
    if (!modelManager.isModelAvailable(modelName)) {
      return res.status(404).json({
        error: '模型不存在',
        modelName
      });
    }

    const model = modelManager.getModel(modelName);
    const testMessage = '你好，请回复"测试成功"';
    
    const startTime = Date.now();
    const response = await model.invoke([{ role: 'user', content: testMessage }]);
    const endTime = Date.now();

    res.json({
      success: true,
      data: {
        modelName,
        response: response.content,
        responseTime: endTime - startTime,
        usage: response.usage_metadata || null
      }
    });

  } catch (error) {
    console.error('模型测试错误:', error);
    res.status(500).json({
      error: '模型测试失败',
      message: error.message,
      modelName: req.params.modelName
    });
  }
});

export default router;
