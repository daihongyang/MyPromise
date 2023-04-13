# MyPromise

仅自己练习使用，严禁用于商业用途，转载请标明出处。

## 1.雏形

根据promise的语法，可以得知promise本质就是一个构造器，所以完全可以用es6的新语法class实现。它接收一个函数，这个函数有两个参数分别为resolve和reject。并且resolve和reject都为函数，它们各有一个参数。不难写出以下代码。

```javascript
class MyPromise{
    constructor(executor){   
    executor(this._resolve,this._reject)  
    }

    _resolve(data){
       
    }

    _reject(reason){
       
    }

    
}
```

## 2.状态

根据Promise语法，一个Promise拥有三种状态，并且在状态变更完成后便不会更改，所以需要一个属性来记录当前的状态。还需要一个属性来记录成功/失败后的数据/原因。可以在外层设定三个变量来枚举状态，这样做的好处是减少耦合。此外可以封装一个_changeState函数来变更状态和数据，当状态不为PENDING的时候要停止执行。

注意resolve和reject函数中使用到了this，由于严格模式下直接调用函数，this指向会为undefined，这会导致报错，所以要用bind绑定this的指向为class内部。

```javascript
let PENDDING = 'pendding'
let FULFILLED = 'fulfilled'
let REJECTED = 'rejected'
class MyPromise{
    constructor(executor){
        this._state = PENDDING
        this._value = undefined
        //更改this指向
        executor(this._resolve.bind(this),this._reject.bind(this)) 
    }

    _changeState(newState,newValue){
        if(this._state !== PENDDING){
            //状态不为PENDING的时候要停止执行
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
```

## 3.报错

根据Promise语法，一旦执行期间出现报错，要立刻进入REJECTED状态，所以要用trycatch来判断一下

```javascript
constructor(executor){
        this._state = PENDDING
        this._value = undefined
        try {
            executor(this._resolve.bind(this),this._reject.bind(this))
        } catch (error) {
            this._reject(error)
        }
    }
```

## 4.then

根据Promise语法，then函数会返回一个新的Promise，并且异步执行，放在微队列中。

关于微队列问题，浏览器环境可以用MutationObserver解决，node环境可以用process解决，其他环境就用setTimeOut解决（实在没有办法了所以用宏队列来解决），可以封装一个函数来执行微队列行为

MutationObserver语法：[MutationObserver - Web API 接口参考 | MDN (mozilla.org)](https://developer.mozilla.org/zh-CN/docs/Web/API/MutationObserver)

```javascript
function runMicroTask(cb){
    if(process&&process.nextTick){
        //node环境
        process.nextTick(cb)
    }else if(MutationObserver){
        //浏览器环境
        const p = document.createElement('p')
        const observer = new MutationObserver(cb)
        observer.observe(p,{
            childList: true  // 观察目标子节点的变化，是否有添加或者删除
        })
        p.innerHTML = 1
    }else{
        setTimeout(() => {
            cb
        }, 0);
    }
}
```

then函数接收两个参数，分别为成功时调用的函数和失败时调用的函数。由于不是立即执行所以需要人为地创造一个队列用于记录添加的所有函数。这些函数并不是全部执行，要根据Promise的成功还是失败来判断执行哪些函数，所以这个队列应该存储状态。不仅如此，返回的新Promise也要根据执行的函数来判断是执行resolve还是reject，所以队列数组里还需要添加新Promise的resolve和reject。

封装了一个方法来实现上述操作

```javascript
_changeQueue(func,state,resolve,reject){
        this._queue.push({
            executor: func,//要执行的函数
            state: state,//执行函数需要的状态
            resolve,//返回新的promise的resolve
            reject//返回新的promise的reject
        })
    }
```

接下来只需要在then内部调用这个方法就可以了

```javascript
then(onFulfill,onReject){
        return new MyPromise((resolve,reject)=>{
            this._changeQueue(onFulfill,FULFILLED,resolve,reject)
            this._changeQueue(onReject,REJECTED,resolve,reject)
        })
    }
```

现在输出queue数组可以得到类似如下数组

```javascript
[
  {
    executor: [Function (anonymous)],
    state: 'fulfilled',
    resolve: [Function: bound _resolve],
    reject: [Function: bound _reject]
  },
  {
    executor: undefined,
    state: 'rejected',
    resolve: [Function: bound _resolve],
    reject: [Function: bound _reject]
  }
]
```

接下来就要考虑遍历执行这个数组，在执行前需要考虑何时执行，根据then的使用方法，得知在**状态变更**和**状态确立**的时候执行

封装一个执行函数，当状态处于挂起时不进行遍历执行，每次执行后要对执行过的对象从队列中移除

```javascript
_execQueue(){
        if(this.state===PENDDING){
            //当状态处于挂起时不进行遍历执行
            return
        }
        while(this._queue[0]){
            //单独执行每一项的函数
            this._execItem(this._queue[0])
            //每次执行后要对执行过的对象从队列中移除
            this._queue.shift()
        }

    }
```





