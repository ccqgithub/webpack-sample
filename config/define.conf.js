/**
 * 常量配置
 * 用于配置 webpack.DefinePlugin
 */

const APP_ENV = process.env.APP_ENV || 'local';
const defines = {};

// common
let common = {
  API_BASE_URL: JSON.stringify('http://www.api.com/'),
  BAIDU_MAP_KEY: 'dsjfsfjsdkfjdsxxx'
}

// local
defines['local'] = Object.assign({}, common, {
  'process.env.NODE_ENV': JSON.stringify('development'),
  'MIX_PANEL_TOKEN': JSON.stringify('dsjfsfjsdkfjdsxxx'),
})

// testing
defines['it'] = Object.assign({}, common, {
  'process.env.NODE_ENV': JSON.stringify('production'),
  'MIX_PANEL_TOKEN': JSON.stringify('dsjfsfjsdkfjdsxxx'),
})

// testing
defines['uat'] = Object.assign({}, common, {
  'process.env.NODE_ENV': JSON.stringify('production'),
  'MIX_PANEL_TOKEN': JSON.stringify('dsjfsfjsdkfjdsxxx'),
})

// production
defines['prod'] =  Object.assign({}, common, {
  'process.env.NODE_ENV': JSON.stringify('production'),
  'MIX_PANEL_TOKEN': JSON.stringify('dsjfsfjsdkfjdsxxx'),
})

// module.exports
module.exports = defines[APP_ENV]
