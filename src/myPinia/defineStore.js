import { reactive, computed, toRef, inject, ref} from 'vue'
import { piniaSymbol } from './rootStore'
function defineStore (
    name,
    {
        state,
        getters,
        actions
    }
){
    const store = reactive({})
    // 将state挂载到store上
    if(state && typeof state === 'function'){
        const _state = state()
        store.$state = reactive(_state)
        for (let key in _state){
            store[key] = toRef(store.$state,key)
        }
    }

    // 将getters挂载到store上
    if(getters && Object.keys(getters).length > 0){
        for (let getter in getters){
            store[getter] = computed(getters[getter].bind(store.$state,store.$state))
            store.$state[getter] = store[getter]
        }
    }
    function wrapAction(name){
        return function(){
            actions[name].apply(store.$state,arguments)
        }
    }

    // 将actions挂载到store上
    if(actions && Object.keys(actions).length > 0){
        for(let method in actions){
            store[method] = wrapAction(method)
        }
    }
    return ()=>{
        const pinia = inject(piniaSymbol);
        if(!pinia._s.has(name)){
            pinia._s.set(name,store)
        }
        const _store = pinia._s.get(name)
        return _store
    }
}
export default defineStore