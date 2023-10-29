<template>
    <Layout>
      <router-view></router-view>
      <div>
        <div style="margin: 1rem 0;">
          <PiniaLogo />
        </div>
  
        <h2>Today todoList</h2>
  
        <input type="text" v-model="todoItem" />
        <button @click="addItem">Add</button>
        <ul>
          <li v-for="item in todoStore.items" :key="item.name">
            {{ item.name }} ({{ item.amount }})
            <button
              @click="todoStore.removeItem(item.name)"
              type="button"
            >X</button>
          </li>
        </ul>
        <count></count>
        <div style="height: 30px;"></div>
        <count2></count2>
      </div>
    </Layout>
  </template>
  
  <script>
  import Layout from '@/layouts/default.vue'
  import PiniaLogo from '@/components/PiniaLogo.vue'
  import Count from '@/components/count.vue'
  import Count2 from '@/components/count2.vue'
  import { defineComponent, ref, watch } from 'vue'
  import { useTodosStore } from '@/stores/useTodosStore'
  
  export default defineComponent({
    components: { Layout, PiniaLogo, Count, Count2},
    beforeRouteEnter(){
      // console.log('xxxxxxxxxxxxxx')
    },
    setup() {
      const todoStore = useTodosStore()
      const todoItem = ref('')
  
      function addItem() {
        if (!todoItem.value) return
        todoStore.addItem(todoItem.value)
        todoItem.value = ''
      }
      watch(todoStore.todoItems,(val)=>{
        console.log(val)
      })
  
      return {
        todoItem,
        addItem,
        todoStore,
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
  