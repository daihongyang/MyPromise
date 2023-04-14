let PENDDING = 'pendding'
let FULFILLED = 'fulfilled'
let REJECTED = 'rejected'

function runMicroTask(cb) {
    if (process && process.nextTick) {
        //node环境
        process.nextTick(cb)
    } else if (MutationObserver) {
        //浏览器环境
        const p = document.createElement('p')
        const observer = new MutationObserver(cb)
        observer.observe(p, {
            childList: true  // 观察目标子节点的变化，是否有添加或者删除
        })
        p.innerHTML = 1
    } else {
        setTimeout(() => {
            cb
        }, 0);
    }
}


function isPromise(obj) {
    return !!(obj && typeof obj === 'object' && typeof obj.then === 'function')
}
class MyPromise {
    constructor(executor) {
        this._state = PENDDING
        this._value = undefined
        this._queue = []
        try {
            executor(this._resolve.bind(this), this._reject.bind(this))
        } catch (error) {
            this._reject(error)
        }
    }

    _changeState(newState, newValue) {
        if (this._state !== PENDDING) {
            return
        }
        this._state = newState
        this._value = newValue
        this._execQueue()
    }

    _resolve(data) {
        this._changeState(FULFILLED, data)
    }

    _reject(reason) {
        this._changeState(REJECTED, reason)
    }

    _changeQueue(func, state, resolve, reject) {
        this._queue.push({
            executor: func,
            state: state,
            resolve,
            reject
        })

    }

    _execQueue() {
        if (this.state === PENDDING) {
            return
        }
        while (this._queue[0]) {
            this._execItem(this._queue[0])
            this._queue.shift()
        }

    }

    _execItem({ executor, state, resolve, reject }) {
        runMicroTask(() => {
            if (this._state !== state) {
                //状态不匹配的不执行
                return
            }
            if (typeof executor !== 'function') {
                //executor不是function 状态穿透
                this._state === FULFILLED ?
                    resolve(this._value) :
                    reject(this._value)
                return
            }
            try {
                //传递参数最终结果
                const result = executor(this._value)
                if (isPromise(result)) {
                    result.then(resolve, reject)
                } else {
                    resolve(result)
                }

            } catch (error) {
                reject(this._value)
            }
        })
    }

    then(onFulfill, onReject) {
        return new MyPromise((resolve, reject) => {
            this._changeQueue(onFulfill, FULFILLED, resolve, reject)
            this._changeQueue(onReject, REJECTED, resolve, reject)
            this._execQueue()
        })
    }


}

const promise = new MyPromise((resolve, reject) => {
    resolve(1)
})
const pro2 = promise.then(() => {
    console.log('成功')
    return 1
})
setTimeout(() => {
    console.log(pro2)
}, 50);

