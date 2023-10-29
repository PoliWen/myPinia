<template>
    <div>
      <h2>count 计数器(composables)</h2>
      {{ countStore2.count }} / 
      {{ countStore2.double }}
      <button @click="countStore2.increase">Add</button>
    </div>
</template>

<script>

import { defineComponent, ref } from 'vue'
import { useCountStore2 } from '@/stores'

export default defineComponent({

  setup() {
    const countStore2 = useCountStore2()
   
    return {
        countStore2,
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
