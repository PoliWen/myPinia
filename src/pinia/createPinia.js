import { ref, effectScope } from 'vue'
import { piniaSymbol,setActivePinia } from './rootStore'

export function createPinia(){
    const scope = effectScope()
    const state = scope.run(()=> ref({})) // 用来存储每个store的state
    // scope.stop() 来停止所有的副作用函数
    const _p = []
    const pinia = {
        _s: new Map(), // 用map来收集所有的store
        _e: scope,
        use(plugin){
            _p.push(plugin)
            return this
        },
        _p,
        install(app){
            // pinia要去收集所有store的信息，并且可以进行卸载store
            // 如何让所有的store都能获取到这个对象
            setActivePinia(pinia)
            app.provide(piniaSymbol,pinia)

            // 让vue2的组件实例也可以共享
            app.config.globalProperties.$pinia = pinia
        },
        state
    }
    return pinia
}
/*
总结：
createPinia,默认具备一个install方法
_s 用来存储 id->store
state 用来存储所有的状态
_e 用来停止所有的状态
*/