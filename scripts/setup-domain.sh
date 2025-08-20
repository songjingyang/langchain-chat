#!/bin/bash

# Vercel域名配置脚本
# 使用方法: ./scripts/setup-domain.sh your-domain.com

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置参数
DOMAIN=$1
PROJECT_NAME=${VERCEL_PROJECT_NAME:-"langchain-chat"}
TEAM_ID=${VERCEL_TEAM_ID:-""}

# 帮助函数
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}🎯 Vercel域名配置工具${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}📋 $1${NC}"
}

# 验证参数
validate_input() {
    if [ -z "$DOMAIN" ]; then
        print_error "请提供域名参数"
        echo "使用方法: ./scripts/setup-domain.sh your-domain.com"
        exit 1
    fi
    
    print_info "配置域名: $DOMAIN"
    print_info "项目名称: $PROJECT_NAME"
}

# 检查环境
check_environment() {
    print_info "检查环境..."
    
    # 检查Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI未安装"
        echo "请运行: npm install -g vercel"
        exit 1
    fi
    
    # 检查登录状态
    if ! vercel whoami &> /dev/null; then
        print_error "请先登录Vercel"
        echo "请运行: vercel login"
        exit 1
    fi
    
    print_success "环境检查通过"
}

# 添加域名
add_domain() {
    print_info "添加域名到Vercel项目..."
    
    local cmd="vercel domains add $DOMAIN $PROJECT_NAME"
    if [ -n "$TEAM_ID" ]; then
        cmd="$cmd --scope $TEAM_ID"
    fi
    
    echo "执行命令: $cmd"
    
    if $cmd; then
        print_success "域名添加成功"
    else
        print_error "域名添加失败"
        exit 1
    fi
}

# 生成DNS配置说明
generate_dns_instructions() {
    print_info "生成DNS配置说明..."
    
    echo ""
    echo "📋 DNS配置说明:"
    echo "================================"
    
    # 判断是否为根域名
    if [[ $DOMAIN =~ ^[^.]+\.[^.]+$ ]]; then
        echo "🌐 根域名配置 ($DOMAIN):"
        echo "类型: A"
        echo "名称: @"
        echo "值: 76.76.19.19"
        echo "TTL: 3600"
        echo ""
        echo "类型: A"
        echo "名称: @"
        echo "值: 76.223.126.88"
        echo "TTL: 3600"
        echo ""
        echo "📌 建议同时配置www子域名:"
        echo "类型: CNAME"
        echo "名称: www"
        echo "值: cname.vercel-dns.com"
        echo "TTL: 3600"
    else
        echo "🌐 子域名配置 ($DOMAIN):"
        local subdomain=$(echo $DOMAIN | cut -d'.' -f1)
        echo "类型: CNAME"
        echo "名称: $subdomain"
        echo "值: cname.vercel-dns.com"
        echo "TTL: 3600"
    fi
    
    echo ""
    echo "⚠️  重要提示:"
    echo "1. DNS记录生效可能需要几分钟到几小时"
    echo "2. 建议TTL设置为3600秒（1小时）"
    echo "3. 配置完成后可使用验证命令检查状态"
}

# 验证域名配置
verify_domain() {
    print_info "验证域名配置..."
    
    echo ""
    echo "🔍 DNS解析检查:"
    if nslookup $DOMAIN; then
        print_success "DNS解析正常"
    else
        print_warning "DNS解析可能还在生效中"
    fi
    
    echo ""
    echo "🔍 HTTPS访问检查:"
    if curl -I https://$DOMAIN --max-time 10 &> /dev/null; then
        print_success "HTTPS访问正常"
        curl -I https://$DOMAIN --max-time 10 | head -1
    else
        print_warning "HTTPS访问暂时不可用（可能DNS还在生效中）"
    fi
}

# 显示后续步骤
show_next_steps() {
    echo ""
    echo "📋 后续步骤:"
    echo "1. 在您的域名注册商处配置上述DNS记录"
    echo "2. 等待DNS生效（通常需要几分钟到几小时）"
    echo "3. 运行验证命令: ./scripts/setup-domain.sh $DOMAIN --verify"
    echo "4. 访问您的域名检查是否正常工作"
    echo ""
    print_success "域名配置完成！"
}

# 主程序
main() {
    print_header
    
    # 检查是否是验证模式
    if [ "$2" = "--verify" ]; then
        print_info "验证模式"
        validate_input
        verify_domain
        return
    fi
    
    # 正常配置流程
    validate_input
    check_environment
    add_domain
    generate_dns_instructions
    show_next_steps
}

# 运行主程序
main "$@"
