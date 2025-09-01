#!/usr/bin/env node

/**
 * SEO 图片生成脚本
 * 生成 Open Graph 和 Twitter Card 所需的图片
 */

const fs = require('fs');
const path = require('path');

// 图片配置
const imageConfigs = [
  {
    name: 'og-image.png',
    width: 1200,
    height: 630,
    description: 'Open Graph 图片'
  },
  {
    name: 'twitter-image.png',
    width: 1200,
    height: 600,
    description: 'Twitter Card 图片'
  },
  {
    name: 'favicon.ico',
    width: 32,
    height: 32,
    description: '网站图标'
  },
  {
    name: 'favicon.svg',
    width: 32,
    height: 32,
    description: 'SVG 网站图标'
  },
  {
    name: 'apple-touch-icon.png',
    width: 180,
    height: 180,
    description: 'Apple Touch 图标'
  },
  {
    name: 'icon-192.png',
    width: 192,
    height: 192,
    description: 'PWA 图标 192x192'
  },
  {
    name: 'icon-512.png',
    width: 512,
    height: 512,
    description: 'PWA 图标 512x512'
  },
  {
    name: 'screenshot-desktop.png',
    width: 1280,
    height: 720,
    description: '桌面版截图'
  },
  {
    name: 'screenshot-mobile.png',
    width: 390,
    height: 844,
    description: '移动版截图'
  }
];

// 生成 SVG 图标内容
function generateSVGIcon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#000000"/>
  <path d="M8 12h16M8 16h16M8 20h12" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  <circle cx="24" cy="8" r="3" fill="#3b82f6"/>
</svg>`;
}

// 生成占位符图片信息
function generatePlaceholderInfo() {
  return `# SEO 图片生成指南

## 需要生成的图片

${imageConfigs.map(config => 
  `### ${config.name}
- 尺寸: ${config.width}x${config.height}
- 用途: ${config.description}
- 建议工具: Figma, Canva, Photoshop
`).join('\n')}

## 设计建议

### 品牌元素
- 主色调: #000000 (黑色)
- 强调色: #3b82f6 (蓝色)
- 字体: 现代无衬线字体
- Logo: 聊天气泡 + AI 元素

### Open Graph 图片 (1200x630)
- 背景: 渐变或纯色
- 标题: "LangChain Chat"
- 副标题: "智能AI聊天助手"
- 图标: 聊天/AI 相关图标
- 文字大小: 确保在小尺寸下可读

### Twitter Card 图片 (1200x600)
- 类似 OG 图片但比例稍有不同
- 确保重要内容在安全区域内

### 图标系列
- 简洁的聊天气泡设计
- 包含 AI 元素（如小圆点表示智能）
- 在不同尺寸下保持清晰

### 截图
- 展示应用的主要功能
- 包含聊天界面
- 显示多模型支持
- 确保界面美观整洁

## 生成后的文件位置
所有图片应放置在 \`public/\` 目录下。

## 验证工具
- Open Graph: https://developers.facebook.com/tools/debug/
- Twitter Card: https://cards-dev.twitter.com/validator
- Google Rich Results: https://search.google.com/test/rich-results
`;
}

function main() {
  console.log('🎨 SEO 图片生成脚本');
  console.log('================');

  const publicDir = path.join(process.cwd(), 'public');
  
  // 确保 public 目录存在
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 生成 SVG 图标
  const svgPath = path.join(publicDir, 'favicon.svg');
  fs.writeFileSync(svgPath, generateSVGIcon());
  console.log('✅ 生成 favicon.svg');

  // 生成图片生成指南
  const guidePath = path.join(process.cwd(), 'SEO_IMAGES_GUIDE.md');
  fs.writeFileSync(guidePath, generatePlaceholderInfo());
  console.log('✅ 生成图片设计指南: SEO_IMAGES_GUIDE.md');

  console.log('\n📋 需要手动创建的图片:');
  imageConfigs
    .filter(config => config.name !== 'favicon.svg')
    .forEach(config => {
      console.log(`   - ${config.name} (${config.width}x${config.height})`);
    });

  console.log('\n💡 提示:');
  console.log('   1. 查看 SEO_IMAGES_GUIDE.md 了解详细设计要求');
  console.log('   2. 使用 Figma 或 Canva 等工具创建图片');
  console.log('   3. 将生成的图片放置在 public/ 目录下');
  console.log('   4. 运行 npm run build 验证图片是否正确加载');
}

if (require.main === module) {
  main();
}

module.exports = {
  imageConfigs,
  generateSVGIcon,
  generatePlaceholderInfo
};
