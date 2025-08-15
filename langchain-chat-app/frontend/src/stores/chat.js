import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { chatApi } from '@/api/chat'

export const useChatStore = defineStore('chat', () => {
  // 状态
  const conversations = ref(new Map())
  const currentConversationId = ref(null)
  const isLoading = ref(false)
  const currentModel = ref('default')
  const systemPrompt = ref('')
  const temperature = ref(0.7)

  // 计算属性
  const currentConversation = computed(() => {
    if (!currentConversationId.value) return null
    return conversations.value.get(currentConversationId.value)
  })

  const conversationList = computed(() => {
    return Array.from(conversations.value.values()).sort((a, b) => 
      new Date(b.updatedAt) - new Date(a.updatedAt)
    )
  })

  // 创建新对话
  const createConversation = (title = '新对话') => {
    const id = Date.now().toString()
    const conversation = {
      id,
      title,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: currentModel.value,
      systemPrompt: systemPrompt.value
    }
    
    conversations.value.set(id, conversation)
    currentConversationId.value = id
    
    return conversation
  }

  // 切换对话
  const switchConversation = (id) => {
    if (conversations.value.has(id)) {
      currentConversationId.value = id
    }
  }

  // 删除对话
  const deleteConversation = (id) => {
    conversations.value.delete(id)
    if (currentConversationId.value === id) {
      const remaining = Array.from(conversations.value.keys())
      currentConversationId.value = remaining.length > 0 ? remaining[0] : null
    }
  }

  // 添加消息
  const addMessage = (message) => {
    if (!currentConversation.value) {
      createConversation()
    }
    
    const conversation = currentConversation.value
    conversation.messages.push({
      id: Date.now().toString(),
      ...message,
      timestamp: new Date().toISOString()
    })
    
    conversation.updatedAt = new Date().toISOString()
    
    // 如果是第一条用户消息，更新对话标题
    if (conversation.messages.length === 1 && message.role === 'user') {
      conversation.title = message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
    }
  }

  // 发送消息
  const sendMessage = async (content, options = {}) => {
    if (!content.trim()) return

    // 添加用户消息
    addMessage({
      role: 'user',
      content: content.trim()
    })

    isLoading.value = true

    try {
      const conversation = currentConversation.value
      const history = conversation.messages.slice(0, -1) // 排除刚添加的用户消息

      const response = await chatApi.conversation({
        message: content,
        history,
        model: options.model || currentModel.value,
        systemPrompt: options.systemPrompt || systemPrompt.value,
        temperature: options.temperature || temperature.value
      })

      // 添加AI回复
      addMessage({
        role: 'assistant',
        content: response.data.message,
        model: response.data.model,
        usage: response.data.usage
      })

      return response.data

    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 添加错误消息
      addMessage({
        role: 'assistant',
        content: '抱歉，消息发送失败。请稍后重试。',
        error: true
      })
      
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 流式发送消息
  const sendMessageStream = async (content, options = {}) => {
    if (!content.trim()) return

    // 添加用户消息
    addMessage({
      role: 'user',
      content: content.trim()
    })

    // 添加空的AI消息用于流式更新
    const aiMessageId = Date.now().toString()
    addMessage({
      id: aiMessageId,
      role: 'assistant',
      content: '',
      streaming: true
    })

    isLoading.value = true

    try {
      const conversation = currentConversation.value
      const history = conversation.messages.slice(0, -2) // 排除最后两条消息

      await chatApi.streamChat({
        message: content,
        history,
        model: options.model || currentModel.value,
        systemPrompt: options.systemPrompt || systemPrompt.value,
        conversationId: conversation.id
      }, (chunk) => {
        // 更新流式消息内容
        const aiMessage = conversation.messages.find(m => m.id === aiMessageId)
        if (aiMessage) {
          aiMessage.content += chunk.content
        }
      })

      // 标记流式完成
      const aiMessage = conversation.messages.find(m => m.id === aiMessageId)
      if (aiMessage) {
        aiMessage.streaming = false
      }

    } catch (error) {
      console.error('流式发送失败:', error)
      
      // 更新错误消息
      const aiMessage = conversation.messages.find(m => m.id === aiMessageId)
      if (aiMessage) {
        aiMessage.content = '抱歉，消息发送失败。请稍后重试。'
        aiMessage.error = true
        aiMessage.streaming = false
      }
      
      throw error
    } finally {
      isLoading.value = false
    }
  }

  // 重新生成回复
  const regenerateResponse = async (messageIndex) => {
    const conversation = currentConversation.value
    if (!conversation || messageIndex < 1) return

    const userMessage = conversation.messages[messageIndex - 1]
    if (userMessage.role !== 'user') return

    // 移除之后的所有消息
    conversation.messages = conversation.messages.slice(0, messageIndex)

    // 重新发送
    await sendMessage(userMessage.content)
  }

  // 清空当前对话
  const clearCurrentConversation = () => {
    if (currentConversation.value) {
      currentConversation.value.messages = []
      currentConversation.value.updatedAt = new Date().toISOString()
    }
  }

  // 导出对话
  const exportConversation = (id) => {
    const conversation = conversations.value.get(id)
    if (!conversation) return null

    return {
      title: conversation.title,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      model: conversation.model
    }
  }

  // 导入对话
  const importConversation = (data) => {
    const id = Date.now().toString()
    const conversation = {
      id,
      title: data.title || '导入的对话',
      messages: data.messages || [],
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: data.model || 'default'
    }
    
    conversations.value.set(id, conversation)
    return conversation
  }

  return {
    // 状态
    conversations,
    currentConversationId,
    isLoading,
    currentModel,
    systemPrompt,
    temperature,
    
    // 计算属性
    currentConversation,
    conversationList,
    
    // 方法
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    sendMessage,
    sendMessageStream,
    regenerateResponse,
    clearCurrentConversation,
    exportConversation,
    importConversation
  }
})
