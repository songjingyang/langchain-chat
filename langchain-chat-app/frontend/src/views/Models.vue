<template>
  <div class="models-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模型管理</span>
          <div class="header-actions">
            <el-button type="primary" :icon="Refresh" @click="loadModels" :loading="loading">
              刷新
            </el-button>
          </div>
        </div>
      </template>
      
      <div class="content">
        <!-- 模型统计 -->
        <div class="stats-row" v-if="!loading && models.length > 0">
          <el-statistic title="可用模型" :value="models.length" />
          <el-statistic title="默认模型" :value="defaultModel || '未设置'" />
        </div>
        
        <!-- 模型列表 -->
        <el-table 
          :data="models" 
          :loading="loading"
          v-loading="loading"
          element-loading-text="加载模型列表中..."
          element-loading-spinner="el-icon-loading"
          stripe
          class="models-table"
        >
          <el-table-column label="模型名称" width="200">
            <template #default="{ row }">
              <div class="model-name">
                <el-icon class="model-icon">
                  <Document />
                </el-icon>
                <span>{{ row.name }}</span>
                <el-tag v-if="row.id === defaultModel" type="success" size="small">默认</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="提供商" width="120">
            <template #default="{ row }">
              <el-tag :type="getProviderTagType(row.provider)">
                {{ row.provider }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="模型ID" prop="id" min-width="180" />
          
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.available" type="success">可用</el-tag>
              <el-tag v-else type="danger">不可用</el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                size="small" 
                @click="testModel(row.id)"
                :loading="testingModels.has(row.id)"
              >
                测试连接
              </el-button>
              <el-button 
                type="success" 
                size="small" 
                @click="setDefaultModel(row.id)"
                :disabled="row.id === defaultModel"
              >
                设为默认
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 空状态 -->
        <el-empty 
          v-if="!loading && models.length === 0"
          description="没有可用的模型"
          :image-size="100"
        >
          <el-button type="primary" @click="loadModels">重新加载</el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Document } from '@element-plus/icons-vue'
import { modelsAPI } from '@/api'

// 响应式数据
const loading = ref(false)
const models = ref([])
const defaultModel = ref('')
const testingModels = ref(new Set())

// 加载模型列表
const loadModels = async () => {
  loading.value = true
  try {
    const response = await modelsAPI.getModels()
    if (response.success) {
      models.value = response.data.models || []
      defaultModel.value = response.data.default || ''
      ElMessage.success(`成功加载 ${models.value.length} 个模型`)
    } else {
      ElMessage.error(response.error || '加载模型列表失败')
    }
  } catch (error) {
    console.error('加载模型列表错误:', error)
    ElMessage.error('加载模型列表失败')
  } finally {
    loading.value = false
  }
}

// 测试模型连接
const testModel = async (modelId) => {
  testingModels.value.add(modelId)
  try {
    const response = await modelsAPI.testModel(modelId)
    if (response.success) {
      ElMessage.success(`模型 ${modelId} 连接测试成功`)
    } else {
      ElMessage.error(`模型 ${modelId} 连接测试失败: ${response.error}`)
    }
  } catch (error) {
    console.error('模型测试错误:', error)
    ElMessage.error(`模型 ${modelId} 连接测试失败`)
  } finally {
    testingModels.value.delete(modelId)
  }
}

// 设置默认模型
const setDefaultModel = async (modelId) => {
  try {
    await ElMessageBox.confirm(
      `确定要将 ${modelId} 设置为默认模型吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    // 注意：这里需要后端API支持设置默认模型
    // 暂时只在前端更新显示
    defaultModel.value = modelId
    ElMessage.success(`已将 ${modelId} 设置为默认模型`)
    
  } catch {
    // 用户取消操作
  }
}

// 根据提供商获取标签类型
const getProviderTagType = (provider) => {
  const typeMap = {
    'OpenAI': 'primary',
    'Anthropic': 'success',
    'Google': 'warning',
    'Groq': 'info'
  }
  return typeMap[provider] || 'default'
}

// 组件挂载时加载模型列表
onMounted(() => {
  loadModels()
})
</script>

<style lang="scss" scoped>
.models-container {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .content {
    .stats-row {
      display: flex;
      gap: 40px;
      margin-bottom: 20px;
      padding: 16px;
      background: var(--el-fill-color-light);
      border-radius: 8px;
    }
    
    .models-table {
      margin-top: 20px;
      
      .model-name {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .model-icon {
          color: var(--el-color-primary);
        }
      }
    }
  }
}
</style>
