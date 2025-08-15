<template>
  <div class="documents-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>文档问答</span>
          <el-button type="primary" :icon="Upload">上传文档</el-button>
        </div>
      </template>
      <div class="content">
        <el-empty description="文档问答功能开发中..." />
        <p>这里将实现：</p>
        <ul>
          <li>📄 文档上传 (PDF, TXT, CSV, MD)</li>
          <li>🔍 文档内容搜索</li>
          <li>💬 基于文档的智能问答</li>
          <li>📊 文档分析和摘要</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { Upload } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.documents-container {
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
