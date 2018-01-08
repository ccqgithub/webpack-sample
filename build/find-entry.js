const path = require('path');
const fs = require('fs');

/**
 * 递归查找webpack entry文件
 * let entryConfigs = findEntry({
 *   contextPath: '',
 *   entryDirs: [],
 *   group: (p) => 'main',
 *   template: (p) => {
 *     return p.replace(/.*app\/script\/entry\/(.*)\.(js|jsx)$/, 'app/template/$1.html')
 *   }
 * });
 * 
 * return Object:
 * {
 *   entries: {
 *     'entry/a.js': 'entry/a.js'
 *   },
 *   entryGroups: {
 *     react: ['entry/a.js'],
 *     vue: ['entry/b.js'],
 *     main: ['entry/c.js'],
 *   },
 *   templates: {
 *     'entry/a.js': 'template/a.html'
 *   }
 * }
 */
module.exports = function findEntry(conf) {
  let contextPath = conf.contextPath;
  let entryDirs = conf.entryDirs;
  let group = conf.group;
  let template = conf.template;
  let files = [];

  if (!contextPath) 
    throw new Error('find entry errir: no contextPath');

  if (!entryDirs) 
    throw new Error('find entry errir: no entryDirs');

  if (!group) 
    throw new Error('find entry errir: no group');
  
  if (!template) 
    throw new Error('find entry errir: no template');

    // 遍历文件夹搜寻 entry 文件
  const walk = (p, files = []) => {
    let dirList = fs.readdirSync(p);

    dirList.forEach((item) => {
      let sPath = path.join(p, item);
      let stat = fs.lstatSync(sPath);

      if (stat.isDirectory()) {
        walk(sPath, files);
      } else if (stat.isFile()) {
        files.push(path.posix.relative(contextPath, sPath));
      }
    });
  }

  // 收集入口文件
  entryDirs.forEach(dir => walk(dir, files));

  let entryGroups = {};
  let templates = {};
  let entries = {};

  files.forEach(file => {
    let groupName = group(file) || 'main';
    let tpl = template(file);

    if (!entryGroups[groupName]) entryGroups[groupName] = [];
    entryGroups[groupName].push(file);

    entries[file] = file;
    templates[file] = tpl;
  });

  return {
    entries: entries, 
    entryGroups: entryGroups,
    templates: templates
  };
}
