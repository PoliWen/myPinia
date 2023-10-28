// import { defineStore } from 'pinia'
import { defineStore } from '@/myPinia'

export const useTodosStore = defineStore('todos',{
  state: () => ({
    todoItems: []
  }),
  getters: {
    items: (state) =>
      state.todoItems.reduce((items, item) => {
        const existItem = items.find((it) => it.name === item)
        if (!existItem) {
          items.push({ name: item, amount: 1 })
        } else {
          existItem.amount++
        }
        return items
      }, [])
  },
  actions: {
    addItem(name) {
      this.todoItems.push(name)
    },

    removeItem(name) {
      const i = this.todoItems.indexOf(name)
      if (i > -1) this.todoItems.splice(i, 1)
    }
  }
})

