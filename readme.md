## Vue项目埋点方案--声明式指令埋点（点击&曝光）
埋点方案有命令式埋点和声明式埋点。
- 命令式埋点：在用户行为触发位置调用事件上报函数进行行为上报，缺点是埋点和业务耦合度比较高，工作量比较大
- 声明式埋点：通过自定义指令统一完成事件上报，使得埋点和业务代码一定程度上解耦合。
本篇文章将记录借助vue自定义指令完成声明式埋点，降低前端埋点压力。

### 一、准备工作
这里关于vue自定义指令和IntersectionObserver不做详细介绍，自行前往官网了解学习。
- vue自定义指令，[vue自定义指令官网](https://cn.vuejs.org/v2/guide/custom-directive.html)
- IntersectionObserver实现元素视窗观测，[Intersection Observer API](https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API)

### 二、代码实现
- 创建指令
这里我们计划创建`v-track`指令，创建代码如下：
```javascript
import Vue from 'vue'
import Exposure from './exposure'
import Click from './click'

// 实例化曝光和点击
const exp = new Exposure()
const cli = new Click()

Vue.directive('track', {
// 调用指令声明周期钩子函数bind，其他钩子函数请移步官网
bind(el, binding) {
// 获取指令参数
const { arg } = binding
arg.split('|').forEach(item => {
// 点击
if (item === 'click') {
cli.add({ el })
} else if (item === 'exposure') {
exp.add({ el })
}
})
}
})

```
- 曝光类`exposure.js`
曝光使用IntersectionObserver观察元素是否在视窗内，并且曝光上报只上报一次，上报之后移除观察。设定每2秒进行一次上报。
如何解决曝光的漏报（定时器2秒之内的用户退出）和多报：
a. 漏报：保存localStorage，下次进入之后如果有数据则上报，如果用户再不进入，对漏报的几条数据可忽略
b. 多报：IntersectionObserver监听曝光，上报时候移除元素的监听
```javascript
import 'intersection-observer'
import { track } from './sendData'

// 节流时间调整，默认100ms
IntersectionObserver.prototype['THROTTLE_TIMEOUT'] = 300

export default class Exposure {
constructor(maxNum = 20) {
this.cacheDataArr = []
this.maxNum = maxNum
this._timer = 0
this._observer = null
this.init()
}

/**
* 初始化
*/
init() {
const self = this
// 边界处理
this.trackFromLocalStorage()
this.beforeLeaveWebview()

// 实例化监听
this._observer = new IntersectionObserver(function(entries, observer) {
entries.forEach((entry) => {
// 出现在视窗中
if (entry.isIntersecting) {
// 清除当前定时器
clearInterval(this._timer)

// 获取参数
const tp = entry.target.attributes['track-params'].value
// 收集参数统一上报，减少网络请求
self.cacheDataArr.push(tp)
// 曝光之后取消观察
self._observer.unobserve(entry.target)

if (self.cacheDataArr.length >= self.maxNum) {
self.track()
} else {
self.storeIntoLocalStorage(self.cacheDataArr)
if (self.cacheDataArr.length > 0) {
// 2秒上报一次
self._timer = setInterval(function() {
self.track()
}, 2000)
}
}
}
})
},
{
root: null,
rootMargin: '0px',
threshold: 0.5 // 元素出现面积，0 - 1，这里当元素出现一半以上则进行曝光
})
}

/**
* 给元素添加监听
* @param {Element} entry 
*/
add(entry) {
this._observer && this._observer.observe(entry.el)
}

/**
* 埋点上报
*/
track() {
const trackData = this.cacheDataArr.splice(0, this.maxNum)
track(trackData)
// 更新localStoragee
this.storeIntoLocalStorage(this.cacheDataArr)
}

/**
* 存储到localstorage, 防止在设定上报时间内用户退出
* @param { Arrary } data 
*/
storeIntoLocalStorage(data) {
window.localStorage.setItem('cacheTrackData', data)
}

/**
* 首次进入先获取localStorage中的数据，也就是用户上次退出未上报的数据
*/
trackFromLocalStorage() {
const cacheData = window.localStorage.getItem('cacheTrackData')
if (cacheData) {
track(cacheData)
}
}

/**
* 用户退出系统时调用方法，需要和客户端同学协商注册事件
*/
beforeLeaveWebview() {
// 客户端自定义事件监听上报
}
}
```
- 点击类`click.js`
用户的点击行为没有曝光行为频繁，所以简单处理，每次点击进行埋点上报。
```javascript
import { track } from './sendData'

export default class Click {
add(entry) {
const tp = entry.el.attributes['track-params'].value
entry.el.addEventListener('click', function() {
track(tp)
})
}
}
```
- 上报函数`sendData.js`
上报函数未具体实现，如果需要提供，后续私信完善。
```javascript
import config from './config'

/**
* 事件上报
* @param {Object} params 
*/
export function track(params) {
// 这里自己封装fetch或者axios，在拦截器中实现公共参数上报
console.log(`Track data to server ${config.serverUrl}: ${JSON.stringify(params)}`)
}

```

### 三、使用
- 引入全局指令
```javascript
// main.js
import './directives/track'
```

- 页面使用自定义指令完成上报
```javascript
// 点击事件
<div v-track:click></div>

// 点击事件带参数
<div v-track:click :track-params="12455"></div>

// 曝光事件
<div v-track:exposure></div>

// 曝光事件带参数
<div v-track:exposure :track-params="12455"></div>

// 曝光事件并点击带参数
<div v-track:click|exposure :track-params="12455"></div>
```

以上，记录vue项目如何进行声明式埋点，不足之处望指正，不喜勿喷！