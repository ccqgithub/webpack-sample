const HappyPack = require('happypack');
const path = require('path');
const publicConf = require('../config/public.conf');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * 获取一种css文件的loader列表
 */
exports.getStyleLoader = function(loader, config) {
  // config
  config = Object.assign({
    // 提取css文件的插件实例
    extractPlugin: null,
    // 要用到happy pack的文件后缀
    happyList: ['less'],
    // style-loader options
    styleOptions: null,
    // css-loader options
    cssOptions: null,
    // less-loader options
    lessOptions: null,
    // sass-loader options
    sassOptions: null,
    // stylus-loader options
    stylusOptions: null,
    // postcss-loader options
    postcssOptions: null,
  }, config);

  // style loader
  // let styleLooader = 'style-loader';
  let styleLooader = {
    loader: 'vue-style-loader',
    options: Object.assign({
      sourceMap: publicConf.sourceMap
    }, config.styleOptions) 
  };

  // css loader
  let cssLoader = {
    loader: 'css-loader',
    options: Object.assign({
      importLoaders: 0,
      minimize: publicConf.compress,
      sourceMap: publicConf.sourceMap
    }, config.cssOptions)
  }

  let loaders = [cssLoader];
  
  // postcss
  if (config.postcssOptions || loader == 'postcss') {
    loaders.push({
      loader: 'postcss-loader',
      options: Object.assign({
        sourceMap: publicConf.sourceMap
      }, config.postcssOptions)
    });
  }

  // loader
  if (loader != 'postcss' && loader != 'css') {
    loaders.push({
      loader: loader + '-loader',
      options: Object.assign({
        sourceMap: publicConf.sourceMap
      }, config[loader + 'Options'])
    })
  }

  // style loader
  if (!config.extractPlugin) {
    loaders = [styleLooader].concat(loaders);
  }

  let rst = loaders;
  let happyPackPlugins = [];

  // HappyPack
  if (config.happyList.indexOf(loader) != -1) {
    happyPackPlugins[0] = new HappyPack({
      id: 'happy-' + loader,
      threads: 2,
      loaders: loaders
    });
    rst = 'happypack/loader?id=happy-' + loader;
  }
 
  // extract
  if (config.extractPlugin) {
    rst = config.extractPlugin.extract({
      use: rst,
      fallback: styleLooader
    });
  }

  return {
    loaders: rst,
    happyPackPlugins: happyPackPlugins
  };
}

exports.getStyleLoaders = function(config) {
  let cssLoader = exports.getStyleLoader('css', config);
  let sassLoader = exports.getStyleLoader('sass', config);
  let lessLoader = exports.getStyleLoader('less', config);
  let stylusLoader = exports.getStyleLoader('stylus', config);
  let postcssLoader = exports.getStyleLoader('postcss', config);

  return {
    loaders: {
      css: cssLoader.loaders,
      sass: sassLoader.loaders,
      less: lessLoader.loaders,
      stylus: stylusLoader.loaders,
      postcss: postcssLoader.loaders
    },
    happyPackPlugins: []
      .concat(cssLoader.happyPackPlugins)
      .concat(sassLoader.happyPackPlugins)
      .concat(lessLoader.happyPackPlugins)
      .concat(stylusLoader.happyPackPlugins)
      .concat(postcssLoader.happyPackPlugins)
  }
}