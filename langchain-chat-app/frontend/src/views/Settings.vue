<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>设置</span>
          <el-button type="primary" :icon="Check" @click="saveSettings">保存设置</el-button>
        </div>
      </template>
      <div class="content">
        <el-empty description="设置功能开发中..." />
        <p>这里将实现：</p>
        <ul>
          <li>🔑 API 密钥管理</li>
          <li>🎨 主题设置</li>
          <li>🌐 语言设置</li>
          <li>⚙️ 系统配置</li>
          <li>📊 使用偏好</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Check } from '@element-plus/icons-vue'

const saveSettings = () => {
  console.log('保存设置...')
}
</script>

<style lang="scss" scoped>
.settings-container {
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
