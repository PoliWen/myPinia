import { inject, getCurrentInstance, reactive, effectScope, computed, isRef, isReactive, toRefs, watch } from 'vue'
import { piniaSymbol,setActivePinia, activePinia } from './rootStore'
import { addSubscription, triggerSubscription } from './subscribe'

function isComputed(v){
    return !!(isRef(v) && v.effect)
}

function isObject(value){
    return typeof value === 'object' && value !== null
}

function mergeRectiveObject(target,state){
    for(let key in state){
        let oldValue = target[key]
        let newValue = state[key]
        if(isObject(oldValue) && isObject(newValue)){
            mergeRectiveObject(oldValue,newValue) // 递归合并
        }else{
            target[key] = newValue
        }
    }
    return target
}

function createSetUpStore(id,setup,pinia,isOption){
    let scope;
    function $patch(partialStateOrMutatior){
        if(typeof partialStateOrMutatior === 'object'){
            // 用新的状态合并老的状态
            mergeRectiveObject(pinia.state.value[id],partialStateOrMutatior)
        }else{
            partialStateOrMutatior(pinia.state.value[id])
        }
    }
    let actionSubscriptions = []
    const partialStore = {
        $patch,
        $subscribe(callback,options = {}){
            // 每次状态变化都会执行订阅
            scope.run(()=> watch(pinia.state.value[id],(state)=>{
                callback({storeId:id},state)
            },options))
        },
        $onAction: addSubscription.bind(null, actionSubscriptions),
        $dispose(){
            scope.stop()
            actionSubscriptions = []
            pinia._s.delete(id)
        }
    }
    const store = reactive(partialStore)   // store 就是一个响应式对象
    const initialState = pinia.state.value[id] // setup默认是没有初始化状态的
    if(!initialState && !isOption){
        pinia.state.value[id] = {}
    }

    const setupStore = pinia._e.run(()=>{
        scope = effectScope()
        return scope.run(()=> setup() )
    })

    function wrapAction(name,action){
        return function(){ 
            const afterCallbackList = []
            const onErrorCallbackList = []
            function after(callback){
                afterCallbackList.push(callback)
            }
            function onError(callback){
                onErrorCallbackList.push(callback)
            }
            let ret
            try{
                ret = action.apply(store,arguments)
                triggerSubscription(afterCallbackList, ret)
            }catch(e){
                triggerSubscription(onErrorCallbackList,e)
            }

            if(ret instanceof Promise){
                return ret.then((value)=>{
                   return  triggerSubscription(afterCallbackList, value)
                }).catch(e=>{
                    triggerSubscription(onErrorCallbackList,e)
                    return Promise.resolve(e)
                })
            }
            triggerSubscription(actionSubscriptions,{ after, onError })
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
    pinia._s.set(id,store)
    Object.assign(store,setupStore)
    console.log('pinia.state.value',pinia.state.value)
    Object.defineProperty(store,'$state',{
        get:()=> pinia.state.value[id],
        set:(state)=> $patch($state => Object.assign($state,state))
    })
    store.$id = id
    pinia._p.forEach(plugin => {
        plugin({ store })
    })
    return store
}


function createOptionsStore(id,options,pinia){
    const { state, actions, getters } = options
   
    function setup(){  // 对用户传递的state，actions，getters做处理
       pinia.state.value[id] = state ? state() : {}
       const localState = toRefs(pinia.state.value[id])
       
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
    const store = createSetUpStore(id,setup,pinia,true)
    store.$reset = function(){
        const initState = state ? state() : {}
        store.$patch((state)=>{
            Object.assign(state,initState)
        })
    }
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
        let pinia = instance && inject(piniaSymbol)
        if (pinia) setActivePinia(pinia)
        pinia = activePinia
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
