import { inject, getCurrentInstance, reactive, effectScope } from 'vue'
import { piniaSymbol } from 'rootStore'


// id + options
// options
// name + setup
function createOptionsStore(id,options,pinia){
    const { state, actions, getters } = options
    const store = reactive({})   // store 就是一个响应式对象
    let scope;
    function setup(){  // 对用户传递的state，actions，getters做处理
       const localState =  pinia.state.value[id] = state ? state() : {}
       // getters
       return Object.assign(
        localState, // 用户的状态
        actions,    // 用户的动作
        // 使用computed对getters进行封装
        Object.keys(getters || {}).reduce((memo,name)=>{
            memo[name] = computed(()=>{
                return getters[name].call(store)
            })
            return memo
        },{}))
    }
    const setupStore = pinia._e.run(()=>{
        scope = effectScope()
        return scope.run(()=> setup() )
    })

    function wrapAction(name,action){
        return function(){
            let ret = action.apply(store,arguments)
            // action 执行后可能是promise
            return ret
        }
    }
    for(let key in setupStore){
        const props = setupStore[key]
        if(typeof prop === 'function'){
            setupStore[key] = wrapAction(key,prop) // 函数劫持
        }
    }
    // pinia._e.stop() // 停止全部
    // scope.stop() // 停止自己， 自己可以控制自己的死活，父亲可以控制所有的死活
    pinia._S.set(id,store)
    Object.assign(store,setupStore)
    return store
}


export function defineStore(idOrOptions,setUp){
    let id
    let options
    if(typeof idOrOptions === 'string'){
        id = idOrOptions
        options = setup
    }else{
        options = idOrOptions;
        id = idOrOptions.id
    }
    // setUp可能是一个函数
    function useStore(){
        // 在这里拿到的store，应该是同一个
        let instance = getCurrentInstance()
        const pinia = instance && inject(piniaSymbol)
        if(!pinia_S.has(id)){ // 第一次useStore
            createOptionsStore(id,options,pinia)
        }
        const store = pinia._S.get(id)
        return store
    }
    return useStore
}
