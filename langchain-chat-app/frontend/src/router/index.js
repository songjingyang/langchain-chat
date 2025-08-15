import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页'
    }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/Chat.vue'),
    meta: {
      title: '智能对话'
    }
  },
  {
    path: '/documents',
    name: 'Documents',
    component: () => import('@/views/Documents.vue'),
    meta: {
      title: '文档问答'
    }
  },
  {
    path: '/tools',
    name: 'Tools',
    component: () => import('@/views/Tools.vue'),
    meta: {
      title: '工具调用'
    }
  },
  {
    path: '/models',
    name: 'Models',
    component: () => import('@/views/Models.vue'),
    meta: {
      title: '模型管理'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - LangChain 智能对话助手`
  }
  next()
})

export default router
