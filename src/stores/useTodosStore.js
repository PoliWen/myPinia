import { defineStore } from '@/myPinia'

export const useTodosStore = defineStore('todos',{
  state: () => ({
    todoItems: [],
  }),
  getters: {
    items: (state) =>
      state.todoItems.reduce((items, item) => {
        const existingItem = items.find((it) => it.name === item)

        if (!existingItem) {
          items.push({ name: item, amount: 1 })
        } else {
          existingItem.amount++
        }

        return items
      }, []),
  },
  actions: {
    addItem(name) {
      this.todoItems.push(name)
    },

    removeItem(name) {
      const i = this.todoItems.indexOf(name)
      if (i > -1) this.todoItems.splice(i, 1)
    },
  },
})

