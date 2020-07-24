import Axios from 'axios'
import config from './config'

// 创建实例
const service = Axios.create({
  baseURL: config.serverUrl,
  timeout: config.serverTimeout
})

// 公共参数
const trackPublicParams = {
  uid: ''
}

// 请求拦截
service.interceptors.request.use((config) => {
  config.data = Object.assign({}, config.data, trackPublicParams)
  return config
}, (error) => {
  return Promise.reject(error)
})

export default service