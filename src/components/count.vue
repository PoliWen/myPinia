<template>
    <div>
      <h2>count 计数器 (options)</h2>
      {{ countStore.count }} / 
      {{ countStore.double }}
      {{ countStore.hello }}
      <button @click="countStore.increase">Add</button>
      <button @click="disPatch">$patch</button>
      <button @click="reset">$reset</button>
      <button @click="countStore.$dispose">dispose</button>
      <button @click="change">$state</button>
    </div>
</template>

<script>

import { defineComponent, ref } from 'vue'
import { useCountStore } from '../stores/useCountStore'

export default defineComponent({

  setup() {
    const countStore = useCountStore()
    console.log('countStore',countStore)

    function disPatch(){
        countStore.$patch((state)=>{
            state.count = 1000
        })
        // countStore.$patch({count: 1000})
    }

    function reset(){
        countStore.$reset()
    }

    countStore.$subscribe((storeInfo,state)=>{
        console.log('订阅变化',state.count) // 可以用于进行持久化操作
    })
    countStore.$onAction(({ after })=>{
      console.log('action 开始执行',countStore.count)

      after(()=>{
        console.log('action 执行完毕',countStore.count)
      })

      after(()=>{
        console.log('action 执行完毕第二次',countStore.count)
      })
    })

    function change(){
      countStore.$state = {count: 1000}
    }
   
    return {
        countStore,
        disPatch,
        reset,
        change
    }
  },
})
</script>

<style scoped>
h2{
  padding-bottom: 10px;
}
img {
  width: 200px;
}

button,
input {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
