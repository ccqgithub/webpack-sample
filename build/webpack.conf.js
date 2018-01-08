const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const PlaceAssetsPlugin = require('html-webpack-place-assets-plugin');
const HappyPack = require('happypack');

const getStyleLoaders = require('./style-loader').getStyleLoaders;
const findEntry = require('./find-entry');
const defines = require('../config/define.conf');
const publicConf = require('../config/public.conf');

const isProduction = process.env.NODE_ENV === 'production';

// context path
const contextPath = path.resolve(__dirname, '../');

// extract css
let extractCss = isProduction ?
  new ExtractTextPlugin('css/[name].[hash].css') :
  new ExtractTextPlugin('css/[name].css')

// styleLoaders: css, less, sass, stylus, postcss
let styleLoaders = getStyleLoaders({
  extractPlugin: isProduction ? extractCss : null,
  happyList: ['less'],
  postcssOptions: { 
    config: {
      path: path.resolve(__dirname, './postcss.config.js')
    }
  }
});

// babelLoaderOptions
let babelLoaderOptions = {
  loader: 'babel-loader',
  options: {
    'babelrc': false,
    'presets': [
      'react',
      ['env', {
        'targets': {
          'browsers': ['> 1%', 'ie > 9']
        },
        useBuiltIns: true
      }],
      'stage-2',
      'stage-3',
    ],
    'plugins': [].concat(
      // react hot loader
      isProduction ? [] : 'react-hot-loader/babel'
    )
  }
}

// hot reload entry
let hotReloadEntry = [
  'webpack-hot-middleware/client?reload=false',
  'react-hot-loader/patch',
];

// entrys
let entryConfigs = findEntry({
  // contextDir
  contextPath: contextPath,
  // entryDir
  entryDirs: [
    path.resolve(contextPath, 'app/script/entry/')
  ],
  // group the entry files
  group(p) {
    if (/app\/script\/entry\/index\.jsx/.test(p)) {
      return  'student';
    }
    if (/app\/script\/entry\/teacher-index\.jsx/.test(p)) {
      return  'teacher';
    }
    return 'other';
  },
  // template for entry js
  template(p) {
    return p.replace(/.*app\/script\/entry\/(.*)\.(js|jsx)$/, 'app/template/$1.html');
  }
});

let entries = entryConfigs.entries;
let templates = entryConfigs.templates;
let entryGroups = entryConfigs.entryGroups;
let entryObj = {};

Object.keys(entries).forEach((key) => {
  let item = entries[key];
  entryObj[item] = isProduction ?
    './' + item :
    hotReloadEntry.concat('./' + item);
});

// commonPlugins
let cssFileRe = /^.*\.(css|sass|scss|less|styl)$/;
let reCommon = /app\/script\/common\.js/;
let reCommonStudent = /app\/script\/common-student\.js/;
let reCommonTeacher = /app\/script\/common-teacher\.js/;
let reCommonOther = /app\/script\/common-other\.js/;
let reNpm = /node_modules/;
let commonPlugins = [
  // common student
  {
    name: 'com-student',
    minSize: 0,
    minChunks: function (module, count) {
      if (!module.resource || cssFileRe.test(module.resource)) {
        return false;
      }

      if (
        reCommonStudent.test(module.resource)
        || reCommon.test(module.resource)
        || reNpm.test(module.resource)
      ) {
        return true;
      }

      return false;
    },
    chunks: entryGroups.student || [],
  },
  {
    name: 'com-teacher',
    minSize: 0,
    minChunks: function (module, count) {
      if (!module.resource || cssFileRe.test(module.resource)) {
        return false;
      }

      if (
        reCommonTeacher.test(module.resource)
        || reCommon.test(module.resource)
        || reNpm.test(module.resource)
      ) {
        return true;
      }

      return false;
    },
    chunks: entryGroups.teacher || [],
  },
  {
    name: 'com-other',
    minSize: 0,
    minChunks: function (module, count) {
      if (!module.resource || cssFileRe.test(module.resource)) {
        return false;
      }

      if (
        reCommonOther.test(module.resource)
        || reCommon.test(module.resource)
        || reNpm.test(module.resource)
      ) {
        return true;
      }

      return false;
    },
    chunks: entryGroups.other || [],
  },
  {
    name: 'common-all',
    minChunks: function (module, count) {
      if (!module.resource || cssFileRe.test(module.resource)) {
        return false;
      }

      if (
        reCommon.test(module.resource)
        || reNpm.test(module.resource)
      ) {
        return true;
      }

      return false;
    },
    chunks: ['com-student', 'com-teacher', 'com-other']
  },
  {
    name: 'vendor',
    minChunks: function (module, count) {
      if (!module.resource || cssFileRe.test(module.resource)) {
        return false;
      }

      if (
        reNpm.test(module.resource)
      ) {
        return true;
      }

      return false;
    },
    chunks: ['common-all']
  },
  {
    name: 'vendor-core',
    minChunks: function (module, count) {
      let re = /node_modules\/.*?(react|react-dom|jquery)/;
      return module.resource
        && re.test(module.resource)
        && !cssFileRe.test(module.resource);
    },
    chunks: ['vendor']
  },
  // manifest
  {
    name: "manifest",
    minChunks: Infinity,
    chunks: ['vendor-core'],
  }
].map(item => {
  return new webpack.optimize.CommonsChunkPlugin(item);
});

let commonChunks = {
  student: ['com-student', 'common-all', 'vendor', 'vendor-core'],
  teacher: ['com-teacher', 'common-all', 'vendor', 'vendor-core'],
  other: ['com-other', 'common-all', 'vendor', 'vendor-core'],
};

// htmlPlugins
let htmlPlugins = [
  new PlaceAssetsPlugin({
    headReplaceExp: /<!-- html-webpack-plugin-css -->/,
    bodyReplaceExp: /<!-- html-webpack-plugin-script -->/,
    tagsJoin: '\n  ',
  })
];

// html files
let groups = Object.keys(entryGroups);
groups.forEach(groupName => {
  entryGroups[groupName].forEach(item => {
    let template = './' + templates[item];
    let filename = template.replace(/.*app\/template\/(.*)\.html$/, '$1.html');
    let chunks = ['manifest']
      .concat(commonChunks[groupName])
      .concat(item);

    htmlPlugins.push(
      new HtmlWebpackPlugin({
        template: template,
        filename: filename,
        chunks: chunks,
        chunksSortMode: 'dependency', //'dependency',
        inject: false
      })
    );
  });
});

// config exports
exports.context = contextPath;
exports.entry = entryObj;
exports.output = {
  path: publicConf.distPath,
  filename: 'js/[name].[hash].js',
  publicPath: publicConf.publicPath,
};

// resolve
exports.resolve = {
  modules: [
    'node_modules',
    path.resolve(contextPath, '../node_modules')
  ],
  extensions: ['.js', '.jsx', '.vue', '.json', '.less'],
  alias: {
    //
  }
};

// definePlugin not useable in html, 
// so use string replace instead
let stringReplaceOptions = [];
Object.keys(defines).forEach(key => {
  stringReplaceOptions.push({
    search: key,
    replace: defines[key],
    flags: 'g'
  });
});

// module
exports.module = {
  rules: [
    {
      test: /\.html$/,
      use: [
        {
          loader: 'html-loader',
          options: {
            attrs: ['img:src'],
            minimize: true,
            removeComments: false,
            collapseWhitespace: false,
            removeAttributeQuotes: false,
            interpolate: 'require',
          }
        },
        {
          loader: 'string-replace-loader',
          options: {
            multiple: stringReplaceOptions
          }
        }
      ]
    },
    {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: Object.assign({}, styleLoaders.loaders, {
          js: 'happypack/loader?id=babel'
        })
      }
    },
    {
      test: /\.less$/,
      use: styleLoaders.loaders.less
    },
    {
      test: /\.css$/,
      use: styleLoaders.loaders.css
    },
    {
      test: /\.scss$/,
      use: styleLoaders.loaders.sass
    },
    {
      test: /\.js$/,
      include: [
        path.resolve(contextPath, "app")
      ],
      use: 'happypack/loader?id=babel'
    },
    {
      test: /\.jsx$/,
      include: [
        path.resolve(contextPath, "app")
      ],
      use: 'happypack/loader?id=babel'
    },
    {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'imgs/[path][name].[hash].[ext]'
      }
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'fonts/[path][name].[hash].[ext]'
      }
    }
  ]
};

// plugins
exports.plugins = [
  new HappyPack({
    id: 'babel',
    threads: 4,
    loaders: [
      'cache-loader',
      babelLoaderOptions
    ]
  }),

  // new webpack.optimize.ModuleConcatenationPlugin(),
  new webpack.DefinePlugin(defines),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
    React: 'react',
    ReactDOM: 'react-dom',
  }),
  extractCss,
  new CopyWebpackPlugin([
    {
      from: path.resolve(contextPath, './root'),
      to: path.resolve(publicConf.distPath),
      ignore: ['.*']
    }
  ])
]
.concat(htmlPlugins)
.concat(commonPlugins)
.concat(styleLoaders.happyPackPlugins);

// production
if (isProduction) {
  exports.plugins = exports.plugins.concat([
    new webpack.HashedModuleIdsPlugin({
      hashDigestLength: 4
    })
  ]);
} else {
  exports.plugins = exports.plugins.concat([
    new webpack.NamedModulesPlugin(),
    new webpack.HotModuleReplacementPlugin()
  ]);
}

// compress
if (publicConf.compress) {
  exports.plugins = exports.plugins.concat([
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      sourceMap: !!publicConf.sourceMap
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: {
        safe: true
      }
    })
  ]);
}
