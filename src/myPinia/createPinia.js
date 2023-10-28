import { reactive } from 'vue'

export default ()=>{
    const _pinia= reactive({})
    function createStore(name,store){
        if(!_pinia[name]){
            _pinia[name] = store
        }
        return _pinia
    }
    function install(app){
        app.provide('_pinia',createStore)
    }
    return {
        install
    }
}