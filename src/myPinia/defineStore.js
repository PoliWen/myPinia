import { reactive, computed, toRef, inject} from 'vue'
function defineStore (
    name,
    {
        state,
        getters,
        actions
    }
){
    const store = {}
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

    // 将actions挂载到store上
    if(actions && Object.keys(actions).length > 0){
        for(let method in actions){
            store[method] = actions[method]
        }
    }
    return ()=>{
        const createStore = inject('_pinia');
        const _pinia = createStore(name,reactive(store))
        return _pinia[name]
    }
}
export default defineStore