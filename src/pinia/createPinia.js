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
            pinia._a = app
            setActivePinia(pinia)
            app.provide(piniaSymbol,pinia)
            app.config.globalProperties.$pinia = pinia  // 设置全局属性$pinia
        },
        _a: null,
        state
    }
    return pinia
}
