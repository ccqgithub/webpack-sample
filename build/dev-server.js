/**
 * Dev Server 入口
 * node build/dev-server.js
 */

const fs = require('fs');
const path = require('path');
const koa = require('koa');
const staticServe = require('koa-static');
const proxy = require('koa-proxies');
const rewrite = require('koa-rewrite');
const hotMiddleware = require('koa-webpack-hot');
const webpack = require('webpack');
const opn = require('opn');
const httpsProxyAgent = require('https-proxy-agent');

const publicConfig = require('../config/public.conf');
const serverConfig = require('../config/server.conf');
const webpackConfig = require('../build/webpack.conf');

// compiler callback
let lastHash = null;
function compilerCallback(err, stats) {
  if (err) {
    // Do not keep cache anymore
    compiler.purgeInputFileSystem();
  }

  if (err) {
    lastHash = null;
    console.error(err.stack || err);
    if (err.details) console.error(err.details);
  }

  if (stats.hash !== lastHash) {
    lastHash = stats.hash;
    let statsString = stats.toString();
    if (statsString) process.stdout.write(statsString + "\n");
  }
}

// new app
const app = new koa();

const compiler = webpack(webpackConfig);
// watch webpack
const watching = compiler.watch({
  // aggregateTimeout: 300,
  // poll: undefined
}, compilerCallback);

// hot reload
app.use(hotMiddleware(compiler, {
  log: console.log,
  // path: '/__webpack_hmr',
  // heartbeat: 10 * 1000
}));

//如果为 true，则解析 "Host" 的 header 域，并支持 X-Forwarded-Host
app.proxy = true;
//默认为2，表示 .subdomains 所忽略的字符偏移量。
app.subdomainOffset = 2;

// not caught errors
app.on('error', (err, ctx) => {
  console.log(err);
  console.log(err.stack);
});

// 静态文件
app.use(staticServe(publicConfig.distPath));

// rewrite
const rewriteList = serverConfig.rewrites || [];
rewriteList.forEach(item => {
  app.use(rewrite(item.from, item.to))
});

// proxy apis
const proxies = serverConfig.proxies || {};
Object.keys(proxies).forEach(key => {
  app.use(proxy(key, proxies[key]));
});

// not found
app.use(async (ctx, next) => {
  console.log(ctx.path, '404')
  ctx.throw('Not Found!', 404);
});

// 开启监听服务
const server = app.listen(serverConfig.port);

// autoOpenBrowser
if (serverConfig.autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
  const uri = 'http://localhost:' + serverConfig.port;
  opn(uri);
}