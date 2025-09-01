import { NextResponse } from 'next/server'
import { generateAllStructuredData } from '@/lib/seo/structured-data'

export async function GET() {
  try {
    const structuredData = generateAllStructuredData()
    
    return NextResponse.json({
      success: true,
      data: structuredData,
      timestamp: new Date().toISOString(),
      meta: {
        description: 'LangChain Chat SEO 结构化数据',
        version: '1.0.0'
      }
    })
  } catch (error) {
    console.error('SEO API 错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '获取SEO数据失败',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
