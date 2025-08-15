<template>
  <div class="home-container">
    <!-- 导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <div class="logo">
          <el-icon size="32" color="#409EFF">
            <ChatDotRound />
          </el-icon>
          <h1>LangChain 智能助手</h1>
        </div>
        <el-menu
          mode="horizontal"
          :default-active="$route.path"
          router
          class="nav-menu"
        >
          <el-menu-item index="/chat">智能对话</el-menu-item>
          <el-menu-item index="/documents">文档问答</el-menu-item>
          <el-menu-item index="/tools">工具调用</el-menu-item>
          <el-menu-item index="/models">模型管理</el-menu-item>
          <el-menu-item index="/settings">设置</el-menu-item>
        </el-menu>
      </div>
    </el-header>

    <!-- 主要内容 -->
    <el-main class="main-content">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <div class="welcome-content">
          <div class="welcome-avatar">
            <el-avatar :size="80" :src="avatarUrl" />
          </div>
          <h1>欢迎使用 LangChain 智能助手</h1>
          <p>基于最新的大语言模型技术，为您提供智能对话、文档问答、工具调用等强大功能</p>
          <div class="welcome-actions">
            <el-button type="primary" size="large" @click="startChat">
              <el-icon><ChatDotRound /></el-icon>
              开始对话
            </el-button>
            <el-button size="large" @click="viewDocs">
              <el-icon><Document /></el-icon>
              文档问答
            </el-button>
          </div>
        </div>
      </div>

      <!-- 功能介绍 -->
      <div class="features-section">
        <h2>核心功能</h2>
        <el-row :gutter="24" class="features-grid">
          <el-col :xs="24" :sm="12" :md="6" v-for="feature in features" :key="feature.id">
            <el-card class="feature-card" shadow="hover" @click="navigateTo(feature.path)">
              <div class="feature-icon">
                <el-icon size="48" :color="feature.color">
                  <component :is="feature.icon" />
                </el-icon>
              </div>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 快速提示 -->
      <div class="prompts-section">
        <h2>快速开始</h2>
        <p>选择一个示例开始体验</p>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6" v-for="prompt in quickPrompts" :key="prompt.id">
            <el-card class="prompt-card" shadow="hover" @click="handlePromptSelect(prompt)">
              <div class="prompt-icon">{{ prompt.icon }}</div>
              <h4>{{ prompt.title }}</h4>
              <p>{{ prompt.content }}</p>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 模型状态 -->
      <div class="models-section">
        <h2>可用模型</h2>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="8" v-for="model in availableModels" :key="model.id">
            <el-card class="model-card">
              <div class="model-info">
                <div class="model-name">{{ model.name }}</div>
                <div class="model-provider">{{ model.provider }}</div>
                <el-tag :type="model.available ? 'success' : 'danger'" size="small">
                  {{ model.available ? '可用' : '不可用' }}
                </el-tag>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-main>

    <!-- 页脚 -->
    <el-footer class="footer">
      <div class="footer-content">
        <p>&copy; 2025 LangChain 智能助手. 基于 LangChain.js 和 Element Plus X 构建</p>
        <div class="footer-links">
          <a href="https://js.langchain.com/" target="_blank">LangChain.js</a>
          <a href="https://element-plus-x.com/" target="_blank">Element Plus X</a>
          <a href="https://github.com" target="_blank">GitHub</a>
        </div>
      </div>
    </el-footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { modelsApi } from '@/api/chat'
import { ChatDotRound, Document, Tools, Setting, Cpu } from '@element-plus/icons-vue'

const router = useRouter()

// 数据
const avatarUrl = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')
const availableModels = ref([])

// 功能列表
const features = ref([
  {
    id: 1,
    title: '智能对话',
    description: '与AI进行自然语言对话，支持多种模型和流式响应',
    icon: 'ChatDotRound',
    color: '#409EFF',
    path: '/chat'
  },
  {
    id: 2,
    title: '文档问答',
    description: '上传文档并基于文档内容进行智能问答',
    icon: 'Document',
    color: '#67C23A',
    path: '/documents'
  },
  {
    id: 3,
    title: '工具调用',
    description: '使用AI调用各种工具完成复杂任务',
    icon: 'Tools',
    color: '#E6A23C',
    path: '/tools'
  },
  {
    id: 4,
    title: '模型管理',
    description: '管理和配置不同的AI模型',
    icon: 'Cpu',
    color: '#F56C6C',
    path: '/models'
  }
])

// 快速提示
const quickPrompts = ref([
  {
    id: 1,
    title: '翻译助手',
    content: '请将以下文本翻译成英文：你好，世界！',
    icon: '🌍'
  },
  {
    id: 2,
    title: '代码解释',
    content: '请解释这段JavaScript代码的作用：const arr = [1,2,3].map(x => x * 2)',
    icon: '💻'
  },
  {
    id: 3,
    title: '创意写作',
    content: '请写一个关于人工智能的短故事',
    icon: '✍️'
  },
  {
    id: 4,
    title: '数学计算',
    content: '请计算 15 * 23 + 47 的结果',
    icon: '🔢'
  }
])

// 方法
const startChat = () => {
  router.push('/chat')
}

const viewDocs = () => {
  router.push('/documents')
}

const navigateTo = (path) => {
  router.push(path)
}

const handlePromptSelect = (prompt) => {
  router.push({
    path: '/chat',
    query: { prompt: prompt.content }
  })
}

const loadModels = async () => {
  try {
    const response = await modelsApi.getAll()
    availableModels.value = response.data.models
  } catch (error) {
    console.error('加载模型失败:', error)
  }
}

// 生命周期
onMounted(() => {
  loadModels()
})
</script>

<style lang="scss" scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #fff;
  border-bottom: 1px solid var(--el-border-color-light);
  padding: 0;

  .header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 20px;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;

    h1 {
      margin: 0;
      font-size: 20px;
      color: var(--el-text-color-primary);
    }
  }

  .nav-menu {
    border: none;
  }
}

.main-content {
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.welcome-section {
  margin-bottom: 60px;

  .welcome-content {
    text-align: center;

    .welcome-avatar {
      margin-bottom: 24px;
    }

    h1 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
      font-size: 32px;
      font-weight: 600;
    }

    p {
      margin: 0 0 32px 0;
      color: var(--el-text-color-regular);
      font-size: 16px;
      line-height: 1.6;
      max-width: 600px;
      margin-left: auto;
      margin-right: auto;
    }

    .welcome-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
  }
}

.features-section {
  margin-bottom: 60px;

  h2 {
    text-align: center;
    margin-bottom: 40px;
    color: var(--el-text-color-primary);
  }

  .features-grid {
    .feature-card {
      text-align: center;
      cursor: pointer;
      transition: transform 0.3s ease;
      margin-bottom: 20px;

      &:hover {
        transform: translateY(-5px);
      }

      .feature-icon {
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 12px 0;
        color: var(--el-text-color-primary);
      }

      p {
        margin: 0;
        color: var(--el-text-color-regular);
        font-size: 14px;
        line-height: 1.5;
      }
    }
  }
}

.prompts-section {
  margin-bottom: 60px;

  h2 {
    text-align: center;
    margin-bottom: 16px;
    color: var(--el-text-color-primary);
  }

  > p {
    text-align: center;
    margin-bottom: 32px;
    color: var(--el-text-color-regular);
  }

  .prompt-card {
    text-align: center;
    cursor: pointer;
    transition: transform 0.3s ease;
    margin-bottom: 16px;
    height: 160px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    &:hover {
      transform: translateY(-4px);
    }

    .prompt-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    h4 {
      margin: 0 0 8px 0;
      color: var(--el-text-color-primary);
      font-size: 16px;
    }

    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 12px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}

.models-section {
  margin-bottom: 40px;

  h2 {
    text-align: center;
    margin-bottom: 40px;
    color: var(--el-text-color-primary);
  }

  .model-card {
    margin-bottom: 16px;

    .model-info {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .model-name {
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .model-provider {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }
  }
}

.footer {
  background: var(--el-fill-color-light);
  border-top: 1px solid var(--el-border-color-light);
  padding: 20px 0;

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;

    p {
      margin: 0;
      color: var(--el-text-color-regular);
      font-size: 14px;
    }

    .footer-links {
      display: flex;
      gap: 20px;

      a {
        color: var(--el-text-color-regular);
        text-decoration: none;
        font-size: 14px;

        &:hover {
          color: var(--el-color-primary);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 20px;
    padding: 20px;
  }

  .footer-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
}
</style>
