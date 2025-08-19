import { NextResponse } from 'next/server';
import { getAvailableModels, validateApiKeys } from '@/lib/langchain/models';

export async function GET() {
  try {
    const models = getAvailableModels();
    const apiKeys = validateApiKeys();
    
    // 只返回有效API密钥的模型
    const availableModels = models.filter(model => apiKeys[model.provider]);
    
    return NextResponse.json({
      models: availableModels,
      apiKeys,
    });
  } catch (error) {
    console.error('获取模型信息错误:', error);
    return NextResponse.json(
      { error: '获取模型信息失败' },
      { status: 500 }
    );
  }
}
