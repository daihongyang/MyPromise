let PENDDING = 'pendding'
let FULFILLED = 'fulfilled'
let REJECTED = 'rejected'
class MyPromise{
    constructor(executor){
        this._state = PENDDING
        this._value = undefined
        try {
            executor(this._resolve.bind(this),this._reject.bind(this))
        } catch (error) {
            this._reject(error)
        }
    }

    _changeState(newState,newValue){
        if(this._state !== PENDDING){
            return
        }
        this._state = newState
        this._value = newValue
        console.log(this._state,this._value)
    }

    _resolve(data){
        this._changeState(FULFILLED,data)
    }

    _reject(reason){
        this._changeState(REJECTED,reason)
    }

    
}

new MyPromise((resolve,reject)=>{
    throw 123
})