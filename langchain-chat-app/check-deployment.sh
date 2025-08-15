#!/bin/bash

# 部署状态检查脚本
set -e

echo "🔍 检查部署状态..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_url() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "  检查 $name... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✅ 正常${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

# 性能测试
performance_test() {
    local url=$1
    local name=$2
    
    echo -n "  性能测试 $name... "
    
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")
    local response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        echo -e "${GREEN}✅ ${response_ms}ms${NC}"
    elif (( $(echo "$response_time < 5.0" | bc -l) )); then
        echo -e "${YELLOW}⚠️  ${response_ms}ms (慢)${NC}"
    else
        echo -e "${RED}❌ ${response_ms}ms (超时)${NC}"
    fi
}

# 获取部署URL
if [ -z "$1" ]; then
    echo "📝 检查本地部署..."
    BASE_URL="http://localhost:3000"
else
    echo "📝 检查线上部署: $1"
    BASE_URL=$1
fi

echo ""
echo "🌐 基础连接测试:"
check_url "$BASE_URL/health" "健康检查"
check_url "$BASE_URL/api/health" "API健康检查"
check_url "$BASE_URL/api/models" "模型列表"

echo ""
echo "⚡ 性能测试:"
performance_test "$BASE_URL/health" "健康检查"
performance_test "$BASE_URL/api/models" "模型API"

echo ""
echo "🔒 安全检查:"
# 检查安全头
echo -n "  检查安全头... "
headers=$(curl -s -I "$BASE_URL/health")
if echo "$headers" | grep -q "X-Content-Type-Options\|X-Frame-Options"; then
    echo -e "${GREEN}✅ 安全头已配置${NC}"
else
    echo -e "${YELLOW}⚠️  安全头未完全配置${NC}"
fi

echo ""
echo "📊 功能测试:"

# 测试模型列表
echo -n "  测试模型列表API... "
models_response=$(curl -s "$BASE_URL/api/models")
if echo "$models_response" | grep -q '"success":true'; then
    model_count=$(echo "$models_response" | jq -r '.data.models | length' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✅ 成功 (${model_count}个模型)${NC}"
else
    echo -e "${RED}❌ 失败${NC}"
    echo "    响应: $(echo "$models_response" | head -c 100)..."
fi

# 测试聊天API（简单测试）
echo -n "  测试聊天API连接... "
chat_test=$(curl -s -X POST "$BASE_URL/api/chat/basic" \
    -H "Content-Type: application/json" \
    -d '{"message":"test","model":"gpt-3.5-turbo"}' \
    -w "%{http_code}")

# 提取状态码（最后3位）
status_code="${chat_test: -3}"

if [ "$status_code" = "200" ] || [ "$status_code" = "500" ]; then
    echo -e "${GREEN}✅ API可达${NC}"
else
    echo -e "${YELLOW}⚠️  API可能需要配置 (状态码: $status_code)${NC}"
fi

echo ""
echo "📈 监控信息:"

# 获取健康检查详细信息
echo -n "  获取系统信息... "
health_info=$(curl -s "$BASE_URL/health")
if echo "$health_info" | grep -q '"status"'; then
    echo -e "${GREEN}✅ 获取成功${NC}"
    
    # 解析并显示关键信息
    if command -v jq >/dev/null 2>&1; then
        echo "    运行时间: $(echo "$health_info" | jq -r '.uptime // "unknown"')"
        echo "    内存使用: $(echo "$health_info" | jq -r '.memory.usage // "unknown"')"
        echo "    错误率: $(echo "$health_info" | jq -r '.stats.errorRate // "unknown"')"
        echo "    平均响应时间: $(echo "$health_info" | jq -r '.stats.avgResponseTime // "unknown"')"
    fi
else
    echo -e "${RED}❌ 获取失败${NC}"
fi

echo ""
echo "🎯 部署建议:"

# 检查是否为HTTPS
if [[ $BASE_URL == https://* ]]; then
    echo -e "  ${GREEN}✅ 使用HTTPS${NC}"
else
    echo -e "  ${YELLOW}⚠️  建议使用HTTPS${NC}"
fi

# 检查域名
if [[ $BASE_URL == *"localhost"* ]]; then
    echo -e "  ${YELLOW}ℹ️  本地部署，建议部署到云平台${NC}"
elif [[ $BASE_URL == *".vercel.app"* ]]; then
    echo -e "  ${GREEN}✅ Vercel部署，性能良好${NC}"
elif [[ $BASE_URL == *".railway.app"* ]]; then
    echo -e "  ${GREEN}✅ Railway部署，稳定性好${NC}"
elif [[ $BASE_URL == *".onrender.com"* ]]; then
    echo -e "  ${GREEN}✅ Render部署，Docker支持${NC}"
else
    echo -e "  ${GREEN}✅ 自定义域名部署${NC}"
fi

echo ""
echo -e "${GREEN}🎉 部署检查完成！${NC}"

# 显示快速访问链接
echo ""
echo "🔗 快速访问链接:"
echo "  主页: $BASE_URL"
echo "  健康检查: $BASE_URL/health"
echo "  API文档: $BASE_URL/api"
echo "  模型管理: $BASE_URL/#/models"
