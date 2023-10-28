## pinia实现原理以及源码分析

> pinia是vue的专属状态管理器，允许跨组件或者跨页面共享数据，pinia在西班牙语中是菠萝的意思，菠萝花是一组各自独立的花朵，它们共同结合在一起，形成一个菠萝这个水果，与store类似，每一个都是独立的，但又是相互关联的。

### pinia与vuex的对比

- 在规划vuex下一个迭代版本的时候，发现pinia已经实现了Vuex5的许多想法，因此pinia就作为了Vuex的代替方案
- pinia使用起来更简单方便，可以像写composable函数一样来写store
- 更好的typeScript支持
- 支持vueDevtools，来进行对状态的追踪
- 废弃了mutations，对于模块的管理更加扁平化
- 同时支持在vue2和vue3中进行使用，并且支持mapStates，mapGetters，mapActions等方法

> vuex : store.state.a.b.c.xx 
>
> pinia : useStore.xxx ，producStore.xxx
>
> 问题为什么vuex中有mutation和actions

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
    
    // 改变this指向
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
```

pinia能实现在不同的组件状态共享，主要是因为每个store都是一个单例模式

vueuse的createSharedComposable也是一个单例模式，也能用来实现状态共享的问题，会员中心用到了很多这个方法

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

pinia的基本使用

```javascript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.mount('#app')
```

createPinia实现的源码

```javascript

```

createPinia的代码功能图

![image-20231028182352034](C:\Users\kingw\AppData\Roaming\Typora\typora-user-images\image-20231028182352034.png)

### pinia的defineStore方法分析

### pinia的内置方法实现

#### $patch

> $path用来改变store的状态

```

```

#### $resetStore

> $resetStore用来重置store的状态

```

```

#### $subScribe

```

```

#### $onAction

### $disPose

### storeToRefs

> 使用storeToRefs可以让store里面的内容解构使用不丢失响应式

### pinia的插件机制实现

```javascript
pinia.use({
	hello:'hello pinia'
})
```

### pinia的在nuxt中的原理

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

实现原理**获取Vue实例，通过mixin实现数据共享**，vuex也是通过同样的原理进行实现的

### pinia在vueDevtools中被追踪的实现原理