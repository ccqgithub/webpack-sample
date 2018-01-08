/**
 * Output配置
 * 配置不同环境的打包发布参数
 */

const path = require('path');
const APP_ENV = process.env.APP_ENV || 'local';
const configs = {};

// common
let common = {
  // 输出目录
  distPath: path.join(__dirname, '../dist'),
  // public path
  publicPath: '/',
  // 是否输出source map
  sourceMap: true,
  // 是否压缩
  compress: false,
  // 是否清理产出目录distPath
  clear: true
}

// local
configs['local'] = Object.assign({}, common, {
  publicPath: '/',
  sourceMap: true,
  compress: false,
  clear: true
})

// it
configs['it'] = Object.assign({}, common, {
  publicPath: '/',
  sourceMap: true,
  compress: false
})

// uat
configs['uat'] = Object.assign({}, common, {
  publicPath: '/',
  sourceMap: true,
  compress: false
})

// prod
configs['prod'] = Object.assign({}, common, {
  publicPath: '/',
  sourceMap: false,
  compress: false
})

// module.exports
module.exports = configs[APP_ENV]
