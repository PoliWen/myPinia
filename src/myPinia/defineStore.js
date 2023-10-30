import { reactive, computed, toRef, inject, ref} from 'vue'
import { piniaSymbol } from './rootStore'
export function defineStore (
    id,
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
        for (let key in _state){
            store[key] = _state[key]
        }
    }

    // 将getters挂载到store上
    if(getters && Object.keys(getters).length > 0){
        for (let getter in getters){
            store[getter] = computed(getters[getter].bind(store,store))
        }
    }
    function wrapAction(methodName){
        return function(){
            actions[methodName].apply(store,arguments)
        }
    }

    // 将actions挂载到store上
    if(actions && Object.keys(actions).length > 0){
        for(let methodName in actions){
            store[methodName] = wrapAction(methodName)
        }
    }
    return ()=>{
        const pinia = inject(piniaSymbol);
        if(!pinia._s.has(id)){
            pinia._s.set(id,store)
        }
        const _store = pinia._s.get(id)
        return _store
    }
}