/* 校验 html-template.html 自身合法性：标签配对、属性引号、契约 id 齐备。
   模板引用了尚不存在的示例图片，因此不做断链检查。
   用法：node tools/check-template.js */
const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'html-template.html');
const html = fs.readFileSync(file, 'utf8');
const buf = fs.readFileSync(file);

let fail = 0;
const chk = (label, got, want) => {
  const pass = String(got) === String(want);
  if (!pass) { fail++; console.log('FAIL  ' + label + ' = ' + JSON.stringify(got) + ' (期望 ' + JSON.stringify(want) + ')'); }
  else console.log('ok    ' + label + ' = ' + JSON.stringify(got));
};

// 先剥离注释：模板的 [契约] 说明里会字面提到 <h1>、onclick 等，不能算违规
const strip = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
const htmlTag = strip.match(/<html\b[^>]*>/);

chk('UTF-8 无 BOM', buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, false);
chk('charset 在前 1024 字节', html.slice(0, 1024).includes('charset="UTF-8"'), true);
chk('lang="zh-CN"', htmlTag ? /lang="zh-CN"/.test(htmlTag[0]) : false, true);
chk('唯一 h1', (strip.match(/<h1[\s>]/g) || []).length, 1);
chk('无 emoji', /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u.test(strip), false);
chk('无内联事件', /\bon(?:click|load|change)\s*=/i.test(strip), false);

const unbal = [];
for (const t of ['section', 'div', 'span', 'a', 'article', 'ul', 'li', 'svg', 'header', 'footer', 'main', 'nav', 'p', 'h1', 'h2', 'h5', 'button', 'dl', 'dt', 'dd', 'kbd']) {
  const o = (strip.match(new RegExp('<' + t + '(\\s|>)', 'g')) || []).length;
  const c = (strip.match(new RegExp('</' + t + '>', 'g')) || []).length;
  if (o !== c) unbal.push(t + ':' + o + '/' + c);
}
chk('标签配对', unbal.join(' ') || 'balanced', 'balanced');

let qBad = 0, gBad = 0;
for (const m of strip.matchAll(/<[a-zA-Z][^>]*>/g)) {
  if ((m[0].match(/"/g) || []).length % 2) qBad++;
  if ([...m[0].matchAll(/\b[a-zA-Z-]+="([^"]*)"/g)].some(a => /[<>]/.test(a[1]))) gBad++;
}
chk('属性引号成对', qBad, 0);
chk('属性值无裸 < >', gBad, 0);

// theme.js 接线点必须全部存在，否则模板生成的页面会静默失能
// site-map 已收归 theme.js 单一来源；页面改为声明 data-root
const NEED = ['rulerFill', 'hd', 'palOpen', 'palette', 'palInput', 'palList',
              'hudSec', 'hudName', 'hudPct', 'topBtn'];
const have = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
const missing = NEED.filter(id => !have.has(id));
chk('theme.js 接线 id 齐备', missing.join(',') || 'all', 'all');
chk('data-root 已声明', /\bdata-root="[^"]+"/.test(html), true);
chk('不应再有页面级 site-map 副本', /id="site-map"/.test(html), false);
for (const cls of ['data-gallery', 'gal-stage', 'gal-name', 'gal-count', 'gal-thumbs', 'gal-cap', 'data-hud', 'data-nav', 'sec-idx', 'sec-t']) {
  chk('标记契约 .' + cls, html.includes(cls), true);
}
chk('引用 theme.css', html.includes('assets/theme.css'), true);
chk('引用 theme.js', html.includes('assets/theme.js'), true);
chk('有 noscript 降级', html.includes('<noscript>'), true);

console.log('\n' + (fail ? '× ' + fail + ' 项不符' : '✓ 模板合法，契约完整'));
process.exit(fail ? 1 : 0);
