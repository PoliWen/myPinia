export function addSubscription(subscriptions,callback){
    subscriptions.push(callback)
    const removeSubscription = ()=>{
        const index = removeSubscriptions.indexof(callback)
        idx > -1 && subscriptions.splice(idx,1)
    }
    return removeSubscription
}


export function triggerSubscription(subscriptions,...args){
    subscriptions.slice().forEach(cb => cb(...args))  // 这里的slice(), 没有传递参数，只返回一个原数组的浅拷贝，这是常见的用法，用来遍历数组的副本，而不修改原始数据
}