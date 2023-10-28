<template>
    <div>
      <h2>count 计数器 (options)</h2>
      {{ countStore.count }} / 
      {{ countStore.double }}
      <button @click="countStore.increase">Add</button>
      <button @click="disPatch">$patch</button>
      <button @click="reset">$reset</button>
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
   
    return {
        countStore,
        disPatch,
        reset
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
