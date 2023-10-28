import { defineStore } from '@/pinia'
import { ref, computed } from 'vue'
// import { defineStore } from '@/myPinia'

export const useCountStore2 = defineStore('count2',()=>{
    const count = ref(0)
    function increase(){
        count.value++
    }
    const double = computed(()=> count.value*2)

    return {
        count,
        double,
        increase
    }

})

