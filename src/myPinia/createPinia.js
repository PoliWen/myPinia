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