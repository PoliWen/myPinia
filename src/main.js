import { createPinia } from '@/pinia'
// import { createPinia } from '@/myPinia'
import { createApp } from 'vue'
import App from './App.vue'
console.log(createPinia())
createApp(App).use(createPinia()).mount('#app')