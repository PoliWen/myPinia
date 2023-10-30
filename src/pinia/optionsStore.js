import { inject, getCurrentInstance, reactive, effectScope, computed, isRef, isReactive } from 'vue'
import { piniaSymbol } from './rootStore'

function isComputed(v){
    return !!(isRef(v) && v.effect)
}

function createOptionsStore(id,options,pinia){
    const { state, actions, getters } = options
    let scope;
    const store = reactive({})   // store 就是一个响应式对象
  
    function setup(){  // 对用户传递的state，actions，getters做处理
       const localState =  pinia.state.value[id] = state ? state() : {}
       // getters
       return Object.assign(
        localState, // 用户的状态
        actions,    // 用户的动作
        // 使用computed对getters进行封装
        Object.keys(getters || {}).reduce((memo,name)=>{
            memo[name] = computed(()=> {
                const store = pinia._s.get(id)
                return getters[name].apply(store,localState)
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
        const prop = setupStore[key]
        if(typeof prop === 'function'){
            setupStore[key] = wrapAction(key,prop) // 函数劫持
        }
        if((isRef(prop) && !isComputed(prop)) || isReactive(prop)){
            if(!isOption){
                console.log('props',key)
                pinia.state.value[id][key] = prop
            }
        }
    }
    // pinia._e.stop() // 停止全部
    // scope.stop() // 停止自己， 自己可以控制自己的死活，父亲可以控制所有的死活
    Object.assign(store,setupStore)
    pinia._s.set(id,store)
    return store
}



// id + options
// options
// name + setup

export function defineStore(idOrOptions,setup){
    let id
    let options
    if(typeof idOrOptions === 'string'){
        id = idOrOptions
        options = setup
    }else{
        options = idOrOptions;
        id = idOrOptions.id
    }
    const isSetUpStore = typeof setup === 'function'
    // setUp可能是一个函数
    function useStore(){
        // 在这里拿到的store，应该是同一个
        let instance = getCurrentInstance()
        const pinia = instance && inject(piniaSymbol)
        if(!pinia._s.has(id)){ // 第一次useStore
            if(isSetUpStore){
                createSetUpStore(id,setup,pinia)
            }else{
                createOptionsStore(id,options,pinia)
            }
        }
        const store = pinia._s.get(id)
        return store
    }
    return useStore
}
