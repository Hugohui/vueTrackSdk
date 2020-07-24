import Vue from 'vue'
import Exposure from './exposure'
import Click from './click'

// 实例化
const exp = new Exposure()
const cli = new Click()

Vue.directive('track', {
  bind(el, binding) {
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
