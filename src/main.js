import { createPinia } from '@/myPinia'
import { createApp } from 'vue'
import App from './App.vue'
createApp(App).use(createPinia()).mount('#app')