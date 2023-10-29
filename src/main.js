import { createPinia } from '@/pinia'
// import { createPinia } from '@/myPinia'
import { createApp } from 'vue'
import App from './App.vue'
const pinia = createPinia()
//使用插件来做数据持久化
pinia.use(function({ store }){
    console.log(store.$id)
    // 做一些持久化操作
    const local = localStorage.getItem(store.$id + 'PINIA_STATE')
    store.hello = 'hello world'
    if(local){
        store.$state = JSON.parse(local)
    }
    store.$subscribe(({ storeId:id },state)=>{
        console.log('id',id)
        localStorage.setItem(id+'PINIA_STATE', JSON.stringify(state))
    })
})

createApp(App).use(pinia).mount('#app')