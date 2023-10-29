import { toRaw, toRef, isRef, isReactive } from 'vue'
export function storeToRefs(store){
    store = toRaw()
    const refs = {}
    for(let key in store){
        // 跳过对函数的操作
        if(isRef(value) || isReactive(value)){
            refs[key] = toRef(store,key)
        }
    }
    return refs
}