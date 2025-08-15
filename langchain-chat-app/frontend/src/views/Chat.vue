<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <div class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <el-button type="primary" @click="createNewChat" :icon="Plus" class="new-chat-btn">
          新对话
        </el-button>
        <el-button :icon="sidebarCollapsed ? Expand : Fold" @click="toggleSidebar" class="toggle-btn" />
      </div>

      <!-- 对话列表 - 暂时使用简单列表 -->
      <div v-if="!sidebarCollapsed" class="conversations-list">
        <div v-for="conv in conversationList" :key="conv.id" class="conversation-item"
          :class="{ active: conv.id === currentConversationId }" @click="switchConversation(conv.id)">
          {{ conv.title }}
        </div>
      </div>
    </div>

    <!-- 主聊天区域 -->
    <div class="chat-main">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <div class="chat-title">
          <h3>{{ currentConversation?.title || '新对话' }}</h3>
          <el-tag size="small" type="info">{{ currentModel }}</el-tag>
        </div>
        <div class="chat-actions">
          <el-dropdown @command="handleModelChange">
            <el-button :icon="Cpu">
              切换模型 <el-icon>
                <ArrowDown />
              </el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="model in availableModels" :key="model.id" :command="model.id"
                  :disabled="!model.available">
                  {{ model.name }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <el-button :icon="Setting" @click="showSettings = true">设置</el-button>
          <el-button :icon="Delete" @click="clearChat">清空</el-button>
        </div>
      </div>

      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- 空状态 -->
        <div v-if="!currentConversation?.messages.length" class="empty-state">
          <el-empty description="开始新的对话">
            <template #description>
              <p>选择下面的提示或直接输入您的问题</p>
            </template>
          </el-empty>

          <!-- 快速提示 -->
          <div class="quick-prompts">
            <el-button v-for="prompt in chatPrompts" :key="prompt.id" @click="handlePromptSelect(prompt)"
              class="prompt-btn">
              {{ prompt.icon }} {{ prompt.title }}
            </el-button>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="messages-list">
          <div v-for="(message, index) in currentConversation.messages" :key="message.id" class="message-item"
            :class="message.role">
            <!-- 用户消息 -->
            <div v-if="message.role === 'user'" class="message-wrapper user-message">
              <div class="message-content">
                {{ message.content }}
              </div>
              <div class="message-time">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
            
            <!-- AI助手消息 -->
            <div v-else-if="message.role === 'assistant'" class="message-wrapper assistant-message">
              <div class="message-avatar">
                <el-icon><Cpu /></el-icon>
              </div>
              <div class="message-body">
                <div class="message-content" v-html="formatMessageContent(message.content)">
                </div>
                <div class="message-actions">
                  <el-button size="small" text @click="copyMessage(message.content)">
                    复制
                  </el-button>
                  <el-button size="small" text @click="regenerateMessage(index)">
                    重新生成
                  </el-button>
                </div>
                <div class="message-time">
                  {{ formatTime(message.timestamp) }}
                  <span v-if="message.usage" class="token-usage">
                    ({{ message.usage.prompt_tokens + message.usage.completion_tokens }} tokens)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-message">
            <div class="message-avatar">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="loading-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div class="loading-text">AI 正在思考中...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <div class="input-container">
          <el-input v-model="inputMessage" type="textarea" :placeholder="inputPlaceholder" :disabled="isLoading"
            :rows="3" resize="none" @keydown.enter.ctrl="sendMessage" @keydown.enter.meta="sendMessage" />
          <div class="input-actions">
            <el-button :icon="Microphone" @click="startVoiceInput" :disabled="isRecording" circle />
            <el-button @click="showAttachments = true" circle />
            <el-button type="primary" :icon="Promotion" @click="sendMessage" :loading="isLoading"
              :disabled="!inputMessage.trim()">
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="聊天设置" width="500px">
      <el-form :model="settings" label-width="100px">
        <el-form-item label="系统提示">
          <el-input v-model="settings.systemPrompt" type="textarea" :rows="4" placeholder="设置AI的角色和行为..." />
        </el-form-item>
        <el-form-item label="温度">
          <el-slider v-model="settings.temperature" :min="0" :max="2" :step="0.1" show-input />
          <div class="setting-desc">控制回复的随机性，0为最确定，2为最随机</div>
        </el-form-item>
        <el-form-item label="流式输出">
          <el-switch v-model="settings.streaming" />
          <div class="setting-desc">启用后将实时显示AI的回复过程</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存</el-button>
      </template>
    </el-dialog>

    <!-- 附件对话框 -->
    <el-dialog v-model="showAttachments" title="上传附件" width="400px">
      <el-upload drag :auto-upload="false" :on-change="handleAttachmentUpload" accept=".txt,.pdf,.docx,.md">
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 txt/pdf/docx/md 文件，且不超过 10MB
          </div>
        </template>
      </el-upload>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { modelsApi } from '@/api/chat'
import { modelsAPI } from '@/api'
import { ElMessage } from 'element-plus'
import {
  Plus, Fold, Expand, Cpu, ArrowDown, Setting, Delete,
  Microphone, Promotion, Loading, UploadFilled
} from '@element-plus/icons-vue'

const route = useRoute()
const chatStore = useChatStore()

// 响应式数据
const sidebarCollapsed = ref(false)
const showSettings = ref(false)
const showAttachments = ref(false)
const inputMessage = ref('')
const isRecording = ref(false)
const messagesContainer = ref(null)
const availableModels = ref([])

// 设置
const settings = ref({
  systemPrompt: '',
  temperature: 0.7,
  streaming: true
})

// 计算属性
const {
  currentConversation,
  conversationList,
  currentConversationId,
  isLoading,
  currentModel
} = storeToRefs(chatStore)

const inputPlaceholder = computed(() => {
  return isLoading.value ? 'AI 正在回复中...' : '输入您的问题...'
})

// 聊天提示
const chatPrompts = ref([
  {
    id: 1,
    title: '翻译助手',
    content: '请帮我翻译以下内容',
    icon: '🌍'
  },
  {
    id: 2,
    title: '代码助手',
    content: '请帮我解释或优化这段代码',
    icon: '💻'
  },
  {
    id: 3,
    title: '写作助手',
    content: '请帮我写一篇关于...的文章',
    icon: '✍️'
  },
  {
    id: 4,
    title: '学习助手',
    content: '请解释一下...的概念',
    icon: '📚'
  }
])

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const createNewChat = () => {
  chatStore.createConversation()
  inputMessage.value = ''
}

const switchConversation = (id) => {
  chatStore.switchConversation(id)
}

const deleteConversation = (id) => {
  chatStore.deleteConversation(id)
}

const renameConversation = (id, newTitle) => {
  const conversation = chatStore.conversations.get(id)
  if (conversation) {
    conversation.title = newTitle
  }
}

const clearChat = () => {
  chatStore.clearCurrentConversation()
}

const handleModelChange = (modelId) => {
  chatStore.currentModel = modelId
  ElMessage.success(`已切换到 ${modelId} 模型`)
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || isLoading.value) return

  const message = inputMessage.value.trim()
  inputMessage.value = ''

  try {
    if (settings.value.streaming) {
      await chatStore.sendMessageStream(message, {
        model: currentModel.value,
        systemPrompt: settings.value.systemPrompt,
        temperature: settings.value.temperature
      })
    } else {
      await chatStore.sendMessage(message, {
        model: currentModel.value,
        systemPrompt: settings.value.systemPrompt,
        temperature: settings.value.temperature
      })
    }

    // 滚动到底部
    await nextTick()
    scrollToBottom()
  } catch (error) {
    ElMessage.error('发送消息失败')
  }
}

const handlePromptSelect = (prompt) => {
  inputMessage.value = prompt.content
}

const formatMessages = (messages) => {
  return messages.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    streaming: msg.streaming,
    error: msg.error,
    usage: msg.usage
  }))
}

const regenerateMessage = async (messageIndex) => {
  try {
    await chatStore.regenerateResponse(messageIndex)
    await nextTick()
    scrollToBottom()
  } catch (error) {
    ElMessage.error('重新生成失败')
  }
}

const copyMessage = (content) => {
  navigator.clipboard.writeText(content)
  ElMessage.success('已复制到剪贴板')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const saveSettings = () => {
  chatStore.systemPrompt = settings.value.systemPrompt
  chatStore.temperature = settings.value.temperature
  showSettings.value = false
  ElMessage.success('设置已保存')
}

const handleFileUpload = (file) => {
  // 处理文件上传
  console.log('上传文件:', file)
}

const handleAttachmentUpload = (files) => {
  // 处理附件上传
  console.log('上传附件:', files)
  showAttachments.value = false
}

const startVoiceInput = () => {
  // 语音输入功能
  ElMessage.info('语音输入功能开发中...')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化消息内容，简单的Markdown转换
const formatMessageContent = (content) => {
  if (!content) return ''
  
  // 简单的Markdown转换
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
    .replace(/`(.*?)`/g, '<code>$1</code>') // 行内代码
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // 代码块
    .replace(/\n/g, '<br>') // 换行
}

const loadModels = async () => {
  try {
    const response = await modelsAPI.getModels()
    if (response.success) {
      availableModels.value = response.data.models || []
      // 如果当前模型不在可用列表中，设置为默认模型
      if (!availableModels.value.find(m => m.id === chatStore.currentModel)) {
        chatStore.currentModel = response.data.default || availableModels.value[0]?.id
      }
    }
  } catch (error) {
    console.error('加载模型失败:', error)
    ElMessage.error('加载模型列表失败')
  }
}

// 监听路由查询参数
watch(() => route.query.prompt, (prompt) => {
  if (prompt) {
    inputMessage.value = prompt
  }
}, { immediate: true })

// 监听消息变化，自动滚动
watch(() => currentConversation.value?.messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// 生命周期
onMounted(() => {
  loadModels()

  // 如果没有当前对话，创建一个新的
  if (!currentConversationId.value) {
    chatStore.createConversation()
  }
})
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  height: 100vh;
  background: var(--el-bg-color);
}

.sidebar {
  width: 280px;
  background: var(--el-fill-color-lighter);
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;

  &.collapsed {
    width: 60px;
  }

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    display: flex;
    gap: 8px;

    .new-chat-btn {
      flex: 1;
    }

    .toggle-btn {
      flex-shrink: 0;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--el-bg-color);

  .chat-title {
    display: flex;
    align-items: center;
    gap: 12px;

    h3 {
      margin: 0;
      color: var(--el-text-color-primary);
    }
  }

  .chat-actions {
    display: flex;
    gap: 8px;
  }
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  .empty-state {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.chat-input {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.setting-desc {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
}

// 对话列表样式
.conversations-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;

  .conversation-item {
    padding: 12px 16px;
    margin: 4px 0;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 14px;
    color: var(--el-text-color-regular);

    &:hover {
      background-color: var(--el-fill-color-light);
    }

    &.active {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}

// 快速提示样式
.quick-prompts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 20px;

  .prompt-btn {
    height: auto;
    padding: 16px;
    text-align: left;
    white-space: normal;
  }
}

// 消息列表样式
.messages-list {
  .message-item {
    margin: 20px 0;
    display: flex;
    flex-direction: column;

    // 用户消息样式
    &.user {
      align-items: flex-end;

      .user-message {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        max-width: 70%;

        .message-content {
          background: var(--el-color-primary);
          color: white;
          border-radius: 18px 18px 4px 18px;
          padding: 12px 16px;
          word-wrap: break-word;
          line-height: 1.5;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .message-time {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 6px;
        }
      }
    }

    // AI助手消息样式
    &.assistant {
      align-items: flex-start;

      .assistant-message {
        display: flex;
        align-items: flex-start;
        max-width: 80%;
        gap: 12px;

        .message-avatar {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--el-color-primary-light-8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--el-color-primary);
          margin-top: 2px;
        }

        .message-body {
          flex: 1;
          display: flex;
          flex-direction: column;

          .message-content {
            background: var(--el-fill-color-blank);
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 18px 18px 18px 4px;
            padding: 12px 16px;
            word-wrap: break-word;
            line-height: 1.5;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

            // Markdown样式
            strong {
              font-weight: 600;
            }

            em {
              font-style: italic;
            }

            code {
              background: var(--el-fill-color-light);
              padding: 2px 4px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }

            pre {
              background: var(--el-fill-color-light);
              border-radius: 8px;
              padding: 12px;
              margin: 8px 0;
              overflow-x: auto;

              code {
                background: none;
                padding: 0;
                font-size: 0.9em;
                line-height: 1.4;
              }
            }
          }

          .message-actions {
            display: flex;
            gap: 8px;
            margin-top: 6px;
            opacity: 0;
            transition: opacity 0.2s;
          }

          .message-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-top: 4px;

            .token-usage {
              color: var(--el-text-color-placeholder);
              margin-left: 8px;
            }
          }

          &:hover .message-actions {
            opacity: 1;
          }
        }
      }
    }
  }
}

// 加载状态样式
.loading-state {
  margin: 20px 0;
  display: flex;
  align-items: flex-start;

  .loading-message {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .message-avatar {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--el-color-primary-light-8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--el-color-primary);
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .typing-indicator {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: var(--el-fill-color-blank);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 18px 18px 18px 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

        span {
          width: 8px;
          height: 8px;
          background: var(--el-color-primary);
          border-radius: 50%;
          animation: typing 1.5s infinite ease-in-out;

          &:nth-child(1) {
            animation-delay: 0s;
          }

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }

      .loading-text {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-left: 4px;
      }
    }
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

// 输入区域样式
.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

// 加载状态样式
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 768px) {
  .sidebar {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &:not(.collapsed) {
      transform: translateX(0);
    }
  }

  .chat-header {
    padding: 12px 16px;

    .chat-actions {
      .el-button {
        padding: 8px 12px;
      }
    }
  }

  .chat-input {
    padding: 12px 16px;
  }

  .quick-prompts {
    grid-template-columns: 1fr;
  }
}
</style>
