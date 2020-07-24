import { track } from './sendData'

export default class Click {
  add(entry) {
    const tp = entry.el.attributes['track-params'].value
    entry.el.addEventListener('click', function() {
      track(tp)
    })
  }
}
