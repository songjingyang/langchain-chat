<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
// 应用根组件
</script>

<style lang="scss">
#app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

// 全局样式重置
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

// 滚动条样式
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: var(--el-fill-color-dark);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--el-fill-color-darker);
}

// 动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
