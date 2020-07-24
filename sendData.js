import request from './fetch'

/**
 * 发送上报数据
 * @param {Object} data 
 */
function _track(data) {
  return request({
    url: 'track',
    method: 'post',
    data
  })
}

/**
 * 事件上报
 * @param {Object} params 
 */
export function track(params) {
  console.log(`Track data to server: ${JSON.stringify(params)}`)
  _track(params)
}
