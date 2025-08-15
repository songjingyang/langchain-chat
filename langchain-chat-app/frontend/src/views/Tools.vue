<template>
  <div class="tools-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>工具调用</span>
          <el-button type="primary" :icon="Tools">创建工具</el-button>
        </div>
      </template>
      <div class="content">
        <el-empty description="工具调用功能开发中..." />
        <p>这里将实现：</p>
        <ul>
          <li>🧮 计算器工具</li>
          <li>⏰ 时间日期工具</li>
          <li>📝 文本处理工具</li>
          <li>🔧 自定义工具创建</li>
          <li>🤖 AI代理自动调用</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Tools } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.tools-container {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .content {
    text-align: center;
    
    ul {
      text-align: left;
      max-width: 400px;
      margin: 20px auto;
      
      li {
        margin: 8px 0;
        color: var(--el-text-color-regular);
      }
    }
  }
}
</style>
