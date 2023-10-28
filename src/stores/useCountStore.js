import { defineStore } from '@/pinia'
// import { defineStore } from '@/myPinia'

export const useCountStore = defineStore('count',{
  state: () => ({
    count: 0
  }),
  getters: {
    double(){
      return this.count * 2
    }
  },
  actions: {
    increase() {
      this.count++
    },
  }
})

