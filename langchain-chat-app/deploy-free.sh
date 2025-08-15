#!/bin/bash

# 免费平台一键部署脚本
set -e

echo "🆓 LangChain聊天应用 - 免费部署助手"
echo "========================================="

# 检查Git状态
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ 请先初始化Git仓库"
    echo "运行: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  检测到未提交的更改"
    read -p "是否现在提交？(y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Ready for deployment"
        echo "✅ 更改已提交"
    fi
fi

echo ""
echo "🎯 选择部署平台:"
echo "1) Vercel (推荐 - 最简单)"
echo "2) Railway (推荐 - 最稳定)" 
echo "3) Render (Docker支持)"
echo "4) 显示部署指南"
echo "5) 检查API密钥配置"

read -p "请选择 (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 准备Vercel部署..."
        
        # 检查vercel CLI
        if ! command -v vercel &> /dev/null; then
            echo "📦 安装Vercel CLI..."
            npm install -g vercel
        fi
        
        echo "✅ Vercel配置文件已准备好"
        echo ""
        echo "📋 部署步骤:"
        echo "1. 访问 https://vercel.com"
        echo "2. 使用GitHub登录"
        echo "3. 导入您的仓库"
        echo "4. 配置环境变量 (见下方)"
        echo "5. 点击Deploy"
        echo ""
        echo "🔑 需要配置的环境变量:"
        echo "- OPENAI_API_KEY"
        echo "- ANTHROPIC_API_KEY"  
        echo "- GOOGLE_API_KEY"
        echo "- GROQ_API_KEY"
        echo ""
        read -p "是否现在在浏览器中打开Vercel？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://vercel.com/new"
        fi
        ;;
    2)
        echo ""
        echo "🚂 准备Railway部署..."
        echo ""
        echo "📋 部署步骤:"
        echo "1. 访问 https://railway.app"
        echo "2. 使用GitHub登录"
        echo "3. 点击 'New Project' → 'Deploy from GitHub repo'"
        echo "4. 选择您的仓库"
        echo "5. 配置环境变量"
        echo ""
        echo "🔑 需要配置的环境变量:"
        echo "- OPENAI_API_KEY"
        echo "- ANTHROPIC_API_KEY"
        echo "- GOOGLE_API_KEY" 
        echo "- GROQ_API_KEY"
        echo ""
        read -p "是否现在在浏览器中打开Railway？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://railway.app/new"
        fi
        ;;
    3)
        echo ""
        echo "🎨 准备Render部署..."
        echo ""
        echo "📋 部署步骤:"
        echo "1. 访问 https://render.com"
        echo "2. 使用GitHub登录"
        echo "3. 点击 'New +' → 'Web Service'"
        echo "4. 连接您的GitHub仓库"
        echo "5. 配置构建和启动命令"
        echo ""
        echo "⚙️  配置信息:"
        echo "- Build Command: npm run build"
        echo "- Start Command: npm start"
        echo "- Environment: Node"
        echo ""
        read -p "是否现在在浏览器中打开Render？(y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "https://render.com/deploy"
        fi
        ;;
    4)
        echo ""
        echo "📖 查看详细部署指南..."
        if command -v code &> /dev/null; then
            code FREE-DEPLOY.md
        elif command -v nano &> /dev/null; then
            nano FREE-DEPLOY.md
        else
            cat FREE-DEPLOY.md
        fi
        ;;
    5)
        echo ""
        echo "🔍 检查API密钥配置..."
        echo ""
        
        # 检查.env文件
        if [ -f .env ]; then
            echo "✅ 找到.env文件"
            if grep -q "OPENAI_API_KEY=your_" .env; then
                echo "⚠️  OpenAI API密钥需要设置"
            else
                echo "✅ OpenAI API密钥已配置"
            fi
            
            if grep -q "ANTHROPIC_API_KEY=your_" .env; then
                echo "⚠️  Anthropic API密钥需要设置"
            else
                echo "✅ Anthropic API密钥已配置"
            fi
            
            if grep -q "GOOGLE_API_KEY=your_" .env; then
                echo "⚠️  Google API密钥需要设置"
            else
                echo "✅ Google API密钥已配置"
            fi
            
            if grep -q "GROQ_API_KEY=your_" .env; then
                echo "⚠️  Groq API密钥需要设置"
            else
                echo "✅ Groq API密钥已配置"
            fi
        else
            echo "⚠️  未找到.env文件"
            echo "正在创建模板..."
            cp env.example .env
            echo "✅ 已创建.env文件，请编辑并填入您的API密钥"
        fi
        
        echo ""
        echo "🔗 获取API密钥的链接:"
        echo "• OpenAI: https://platform.openai.com/api-keys"
        echo "• Anthropic: https://console.anthropic.com/"
        echo "• Google AI: https://makersuite.google.com/app/apikey"
        echo "• Groq: https://console.groq.com/keys"
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "📚 有用的资源:"
echo "• 详细部署指南: FREE-DEPLOY.md"
echo "• 生产环境部署: DEPLOYMENT.md"
echo "• 项目文档: README.md"
echo ""
echo "🎉 祝您部署成功！"
