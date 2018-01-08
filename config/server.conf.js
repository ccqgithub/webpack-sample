/**
 * Dev Server 配置
 * 配置不同环境的打包发布参数
 */

const path = require('path');
const httpsProxyAgent = require('https-proxy-agent');

module.exports = {
  // 端口
  port: 9000,

  // 自动打开浏览器
  autoOpenBrowser: true,

  // url重写
  // https://github.com/koajs/rewrite
  rewrites: [
    {
      from: '/^\/test-xxx\/(.*)$/',
      to: '/test/$1'
    }
  ],

  // 请求代理，详细配置参见：
  // https://github.com/vagusX/koa-proxies
  proxies: {
    '/octocat': {
      target: 'https://api.github.com/users',    
      changeOrigin: true,
      agent: new httpsProxyAgent('http://1.2.3.4:88'),
      rewrite: path => path.replace(/^\/octocat(\/|\/\w+)?$/, '/vagusx'),
      logs: true
    }
  }
}
