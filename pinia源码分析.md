

## pinia实现原理以及源码分析

> pinia是vue的专属状态管理器，允许跨组件或者跨页面共享数据，pinia在西班牙语中是菠萝的意思，菠萝花是一组各自独立的花朵，它们共同结合在一起，形成一个菠萝这个水果，与store类似，每一个都是独立的，但又是相互关联的。

### pinia与vuex的对比

- 在规划vuex下一个迭代版本的时候，发现pinia已经实现了Vuex5的许多想法，因此pinia就作为了Vuex的代替方案
- pinia使用起来更简单方便，可以像写composable函数一样来写store
- 更好的typeScript支持
- 支持vueDevtools，对状态的变化进行追踪
- 废弃了mutations，对于模块的管理更加扁平化
- 同时支持在vue2和vue3中进行使用，并且支持mapStates，mapGetters，mapActions等方法

### pinia的基本使用

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

定义store支持两种方式，一种是options的方式，一种是composables的方式

```javascript
export const useCountStore('countStore',{
    state:()=>{
        count:0
    },
    getters:()=>{
        double(){
            return this.count*2
        }
    }，
    actions:{
    	increase(){
    		this.count++
		}
    }
})
```

```javascript
export const useCountStore = defineStore('countStore',()=>{
    const count = ref(0)
    function increase(){
        count.value++
    }
    const double = computed(()=> count.value * 2)

    return {
        count,
        double,
        increase
    }
})
```

### 一个最简版本的pinia实现

```javascript
import { piniaSymbol } from './rootStore'
export default ()=>{
    const pinia = {
        _s: new Map(), // 用来存储所有的store
        install(app){
            app.provide(piniaSymbol,pinia)
        }
    }
    return pinia
}
```

```javascript
import { reactive, computed, toRef, inject} from 'vue'
import { piniaSymbol } from './rootStore'
function defineStore (
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
    
    // 改变this指向
    function wrapAction(methodName){
        return function(){
            actions[methodName].apply(store.$state,arguments)
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
export default defineStore
```

pinia能实现在不同的组件状态共享，主要是因为每个store都是一个单例模式

vueuse的createSharedComposable也是一个单例模式，也能用来实现状态共享的问题

```javascript
export function createSharedComposable(composable){
    let state
    return function(){
        if(!state){
            state = composable()
        }
        return state
    }
}
```

### pinia源码的createPinia方法分析

createPinia实现的源码

```javascript
import { ref, effectScope } from 'vue'
import { piniaSymbol } from './rootStore'

export function createPinia(){
    const scope = effectScope()
    const state = scope.run(()=> ref({})) // 用来存储每个store的state
    const _p = []  // 收集插件
    const pinia = {
        _s: new Map(), // 用map来收集所有的store
        _e: scope,
        use(plugin){  // 用来注册插件
            _p.push(plugin)
            return this
        },
        _p,
        install(app){
            app.provide(piniaSymbol,pinia)
            // 让vue2的组件实例也可以共享
            app.config.globalProperties.$pinia = pinia
        },
        state
    }
    return pinia
}
```

createPinia的代码功能导图

![image-20231028182352034](C:\Users\kingw\AppData\Roaming\Typora\typora-user-images\image-20231028182352034.png)

### pinia的defineStore的实现

第一步，先分析入参和返回结果

defineStore的入参有三种形式

```javascript
const store = defineStore('id',{
    state:()=>{},
    getter:()=>{},
    actions:{}
})
const store = defineStore({ // options入参
    id,
    state:()=>{},
    getter:()=>{},
    actions:{}
})
const store = defineStore('id',()=>{state,getters,actions}) // setup的形式入参
```

处理入参

```javascript
// id + options
// options
// id + setup方法
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
}
```

处理返回函数

```javascript

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
    // setUp可能是一个函数
    const isSetUpStore = typeof setup === 'function'
    
    function useStore(){
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
```

这里处理options的定义方式，和setup也就是composables定义的方式是不一样的，处理options使用createOptionsStore

```javascript
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
    pinia._s.set(id,store)
    Object.assign(store,setupStore)
    return store
}

```

处理setupStore使用createSetUpStore

```javascript
function createSetUpStore(id,setup,pinia,isOption){
    let scope;
    const store = reactive({})   // store 就是一个响应式对象
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
    pinia._s.set(id,store)
    Object.assign(store,setupStore)
    console.log('pinia.state.value',pinia.state.value)
    return store
}


function createOptionsStore(id,options,pinia){
    const { state, actions, getters } = options
   
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
    return createSetUpStore(id,setup,pinia,true)
}

```

### pinia的内置方法实现

#### $patch

> 除了用 `store.count++` 直接改变 store，可以调用 `$patch` 方法。它允许你用一个 `state` 的补丁对象在同一时间更改多个属性

```javascript
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

function $patch(partialStateOrMutatior){
     if(typeof partialStateOrMutatior === 'object'){
         // 用新的状态合并老的状态
         mergeRectiveObject(pinia.state.value[id],partialStateOrMutatior)
     }else{
         partialStateOrMutatior(pinia.state.value[id])
     }
 }
const partialStore = {
    $patch
}
const store = reactive(partialStore)   // store 就是一个响应式对象
```

$patch的原理就是对象的深度合并

#### $reset

> $reset用来重置store的状态

```javascript
store.$reset = function(){
    const initState = state ? state() : {}
    store.$patch((state)=>{
        Object.assign(state,initState)
    })
}
```

$reset这个方法支持在vue2中使用，在vue3中有更好的方式处理，直接改变state的值就行了

#### $subScribe

$subScribe用于订阅状态的变化，当转态发生变化需要执行某些操作，可以使用此方法

```javascript
const partialStore = {
    $patch,
    $subscribe(callback,options = {}){
        // 每次状态变化都会执行订阅
        scope.run(()=> watch(pinia.state.value[id],(state)=>{
            callback({storeId:id},state)
        },options))
    }
}
```

$subScribe的实现很简单，只是用watch去监听store上的state状态值的变化，然后执行回调函数。

#### $onAction

> 用于监听action的调用，store.$onAction({after，error}) => {  })，在action执行完成之后调用after回调函数

要实现此功能很明显是使用的发布订阅者模式，因此需要实现一个发布订阅的工具函数

```javascript
export function addSubscription(subscriptions,callback){
    subscriptions.push(callback)
    const removeSubscription = ()=>{
        const index = removeSubscriptions.indexof(callback)
        idx > -1 && subscriptions.splice(idx,1)
    }
    return removeSubscription
}
export function triggerSubscription(subscriptions,...args){
    subscriptions.slice().forEach(cb => cb(...args))  
    // 这里的slice(), 没有传递参数，只返回一个原数组的浅拷贝，这是常见的用法，用来遍历数组的副本，而不修改原始数据
}
```

```javascript
let actionSubscriptions = []
const partialStore = {
   $onAction: addSubscription.bind(null, actionSubscriptions),
}
const store = reactive(partialStore)
```

在执行$onAction的时候，先将方法订阅添加到actionSubscriptions这个对象里面，在执行actions动作的时候进行触发

```javascript
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
        triggerSubscription(actionSubscriptions,{ after, onError })
        
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
        // action 执行后可能是promise
        return ret
    }
}
```

### $disPose

> 此方法用来注销store

```javascript
const partialStore = {
    $dispose(){
        scope.stop()
        actionSubscriptions = []
        pinia._s.delete(id)
    }
}
```

#### $state

$state可以用来直接修改store的状态

```javascript
 Object.defineProperty(store,'$state',{
     get:()=> pinia.state.value[id],
     set:(state)=> $patch($state => Object.assign($state,state))
 })
```

### storeToRefs

> 使用storeToRefs可以让store里面的内容解构使用不丢失响应式

回顾一下toRef与toRefs的实现

```javascript
function toRef(obj,key){
	const wrapper = {
        get value(){
            return obj[key]
        }
    }
    return wrapper
}

function toRefs(obj){
    const ret = {}
    for(const key in obj){
        ret[key] = toRef(obj,key)
    }
    return ret
}
```

```javascript
import { toRaw, toRef, isRef, isReactive } from 'vue'
export function storeToRefs(store){
    store = toRaw()
    const refs = {}
    for(let key in store){
        // 排除对函数的操作
        if(isRef(value) || isReactive(value)){
            refs[key] = toRef(store,key)
        }
    }
    return refs
}
```

通过上面的代码我们发现storeToRefs的实现跟toRefs的实现一样，只是排除了对函数的处理

### pinia的插件机制实现

```javascript
pinia.use((store) => {
    store.hello = 'Hello pinia'
})
```

```javascript
// createPinia.js
const _p = []
const pinia = {
    use(plugin){
        _p.push(plugin)
    },
    _p,  
}

// store.js
function createSetUpStore(){
     const store = reactive({})
     pinia._p.forEach(plugin => {
         plugin({ store })
     })
     return store
}
```

从上面代码发现插件的实现非常简单

### vue2中插件的实现原理

pinia在vue2中使用要借助PiniaVuePlugin

```javascript
import { createPinia, PiniaVuePlugin } from 'pinia'
Vue.use(PiniaVuePlugin)
const pinia = createPinia()
new Vue({
  el: '#app',
  pinia,
})
```

实现源码如下

```javascript
export const PiniaVuePlugin: Plugin = function (_Vue) {
  // Equivalent of
  // app.config.globalProperties.$pinia = pinia
  _Vue.mixin({
    beforeCreate() {
      const options = this.$options
      if (options.pinia) {
        const pinia = options.pinia as Pinia
        // HACK: taken from provide(): https://github.com/vuejs/composition-api/blob/main/src/apis/inject.ts#L31
        /* istanbul ignore else */
        if (!(this as any)._provided) {
          const provideCache = {}
          Object.defineProperty(this, '_provided', {
            get: () => provideCache,
            set: (v) => Object.assign(provideCache, v),
          })
        }
        ;(this as any)._provided[piniaSymbol as any] = pinia

        // propagate the pinia instance in an SSR friendly way
        // avoid adding it to nuxt twice
        /* istanbul ignore else */
        if (!this.$pinia) {
          this.$pinia = pinia
        }

        pinia._a = this as any
        if (IS_CLIENT) {
          // this allows calling useStore() outside of a component setup after
          // installing pinia's plugin
          setActivePinia(pinia)
        }
        if (USE_DEVTOOLS) {
          registerPiniaDevtools(pinia._a, pinia)
        }
      } else if (!this.$pinia && options.parent && options.parent.$pinia) {
        this.$pinia = options.parent.$pinia
      }
    },
    destroyed() {
      delete this._pStores
    },
  })
}
```

实现原理，**获取Vue实例，通过mixin实现数据共享**，vuex也是通过同样的原理进行实现的
