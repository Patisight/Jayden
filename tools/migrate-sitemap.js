/* 一次性迁移：移除各页内重复的 #site-map 声明块，改由 theme.js 单一来源提供；
   同时为每个 <body> 写入 data-root（首页 "."，子页 ".."），供 theme.js 拼绝对前缀。
   用法：node tools/migrate-sitemap.js --dry | --write */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const FILES = ['index.html', 'html-template.html',
  'project1/index.html', 'project2/index.html', 'project3/index.html',
  'project4/index.html', 'project5/index.html', 'project6/index.html',
  'experience1/index.html', 'emc1/index.html'];

const dry = !process.argv.includes('--write');

for (const rel of FILES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) { console.log('skip  ' + rel + '（不存在）'); continue; }
  let src = fs.readFileSync(abs, 'utf8');
  const before = src.length;

  const hadMap = /<script type="application\/json" id="site-map">/.test(src);
  src = src.replace(/\n?[ \t]*<script type="application\/json" id="site-map">[\s\S]*?<\/script>/g, '');

  const isHome = rel === 'index.html';
  const isTpl = rel === 'html-template.html';
  const wantRoot = isHome ? '.' : '..';
  let rootSet = false;
  if (/\bdata-root="/.test(src)) {
    src = src.replace(/(<body[^>]*?)\bdata-root="[^"]*"/, '$1data-root="' + wantRoot + '"');
    rootSet = true;
  } else if (/<body\b/.test(src)) {
    src = src.replace(/<body\b([^>]*)>/, '<body data-root="' + wantRoot + '"$1>');
    rootSet = true;
  }

  const removed = before - src.length;
  console.log((dry ? '[dry] ' : '      ') + rel.padEnd(24) +
    '移除 site-map ' + (hadMap ? removed + 'B' : '无') +
    '   data-root=' + (rootSet ? wantRoot : '未命中') + (isTpl ? '  (模板)' : ''));

  if (!dry) fs.writeFileSync(abs, src, 'utf8');
}
console.log('\n' + (dry ? '确认后加 --write。' : '已写入。theme.js 现为跨页条目唯一来源。'));
