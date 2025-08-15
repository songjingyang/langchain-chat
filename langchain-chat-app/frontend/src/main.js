import { createApp } from "vue";
import { createPinia } from "pinia";
import router from "./router";
import App from "./App.vue";

// Element Plus X 和相关样式
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// Element Plus X AI 组件 (暂时注释掉，因为包可能不存在)
// import ElementPlusX from 'vue-element-plus-x'
// import 'vue-element-plus-x/dist/style.css'

// 全局样式
import "./styles/index.scss";

const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 使用插件
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
// app.use(ElementPlusX);

app.mount("#app");
