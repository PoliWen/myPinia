import { createPinia } from '@/pinia'
// import { createPinia } from '@/myPinia'
import { createRouter, createWebHistory } from 'vue-router'
import { createApp } from 'vue'
import App from './App.vue'
import playground from '@/components/playground.vue'
import { useCountStore } from '@/stores/useCountStore'
const routes = [
    {
        path:'/',
        component: playground
    }
]
const router = createRouter({
    history: createWebHistory(),
    routes
})

const pinia = createPinia()
//使用插件来做数据持久化
pinia.use(( { store }  )=> {
    console.log(store.$id)
    // 做一些持久化操作
    const local = localStorage.getItem(store.$id + 'PINIA_STATE')
    store.hello = 'hello pinia'
    if(local){
        store.$state = JSON.parse(local)
    }
    store.$subscribe(({ storeId: id },state)=>{
        console.log('id',id)
        localStorage.setItem(id+'PINIA_STATE', JSON.stringify(state))
    })
})
createApp(App).use(router).use(pinia).mount('#app')

// router.beforeEach((to,from,next)=>{
//     const store = useCountStore()
//     console.log('xxx',store.count)
//     next()
// })