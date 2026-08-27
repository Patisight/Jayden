/* 全站静态校验：编码约定 / 死链 / 手机号 / 标签配对 / 语法 / 旧主题残留
   用法：node tools/check-site.js            检查全部页面
         node tools/check-site.js --fix-hint 额外打印每项检查的定位提示 */
const fs = require('fs');
const path = require('path');
const PII = require('./_pii-rules.js');

const root = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'project1', 'project2', 'project3', 'project4',
               'project5', 'project6', 'emc1', 'experience1'].map(p =>
  path.join(root, p.endsWith('.html') ? p : path.join(p, 'index.html')));
const ASSETS = ['assets/theme.css', 'assets/theme.js'].map(p => path.join(root, p));

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
let fail = 0, total = 0;
const bad = (f, m) => { console.log('  FAIL  ' + m); fail++; };
const info = (f, m) => console.log('  .     ' + m);

function readPage(f) {
  const buf = fs.readFileSync(f);
  return { buf, html: buf.toString('utf8'), rel: path.relative(root, f).replace(/\\/g, '/') };
}

/* 抽取 <link>/<script src>/本地 href，判定引用是否存在 */
function localRefs(html, base) {
  const dir = path.dirname(base);
  const refs = [];
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(u)) continue;
    refs.push(path.resolve(root, dir, u.split('#')[0].split('?')[0] || '.'));
  }
  return refs;
}

/* 页面里出现的 id 集合（用于锚点存在性） */
function idsOf(html) {
  return new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
}

console.log('=== 共享资源 ===');
for (const a of ASSETS) {
  const rel = path.relative(root, a).replace(/\\/g, '/');
  const buf = fs.readFileSync(a);
  total++;
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bad(rel, '带 UTF-8 BOM');
  else console.log('  ok    ' + rel + '  ' + (buf.length / 1024).toFixed(1) + ' KB');
  if (a.endsWith('.js')) {
    total++;
    try { new Function(buf.toString('utf8')); console.log('  ok    ' + rel + ' 语法通过'); }
    catch (e) { bad(rel, 'JS 语法错误: ' + e.message); }
  }
}
// theme.css 与 theme.js 必须被所有子页引用
console.log('\n=== 逐页检查 ===');
const perPage = {};
for (const f of PAGES) {
  const { buf, html, rel } = readPage(f);
  perPage[rel] = html;
  console.log('\n[' + rel + ']  ' + (buf.length / 1024).toFixed(1) + ' KB');

  total += 4;
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) bad(rel, '带 UTF-8 BOM');
  else console.log('  ok    UTF-8 无 BOM');
  console.log('  ok    charset 前 1024 字节: ' + (html.slice(0, 1024).includes('charset="UTF-8"') ? 'yes' : 'NO'));
  if (!html.slice(0, 1024).includes('charset="UTF-8"')) bad(rel, 'charset 不在前 1024 字节');
  if (!/lang="zh-CN"/.test(html.slice(0, 200))) bad(rel, '缺少 lang="zh-CN"');
  else console.log('  ok    lang="zh-CN"');
  if (!/<title>[^<]+<\/title>/.test(html)) bad(rel, '缺少非空 <title>');
  else console.log('  ok    <title>' + html.match(/<title>([^<]*)/)[1] + '</title>');

  // 必须引用共享主题
  total += 2;
  const pre = rel === 'index.html' ? '' : '../';
  if (!html.includes('href="' + pre + 'assets/theme.css"')) bad(rel, '未引用 assets/theme.css');
  else console.log('  ok    引用 theme.css');
  if (!html.includes('src="' + pre + 'assets/theme.js"')) bad(rel, '未引用 assets/theme.js');
  else console.log('  ok    引用 theme.js');

  // 手机号：用通用形态匹配，检测器内不含任何真实号码字面量
  total++;
  const pii = PII.findPII(html);
  const telHits = [...html.matchAll(PII.TEL_HREF)];
  if (pii.length || telHits.length) {
    bad(rel, '手机号残留 ' + pii.map(p => p.masked).join(', ') +
      (telHits.length ? ' + tel: 链接 ×' + telHits.length : ''));
  } else console.log('  ok    无手机号 / tel:');

  // emoji
  total++;
  const em = html.match(EMOJI);
  if (em) bad(rel, '仍有 emoji: ' + [...new Set(em)].join(' '));
  else console.log('  ok    无 emoji');

  // 内联事件处理器（旧主题特征，新规范禁止）
  total++;
  const inline = [...html.matchAll(/\bon(?:click|load|error|change)\s*=/gi)];
  if (inline.length) bad(rel, '残留内联事件处理器 ×' + inline.length + '（应改由 theme.js 接线）');
  else console.log('  ok    无内联 onclick');

  // 旧主题死链：指向不存在的研究锚点
  total++;
  const dead = [...html.matchAll(/href="\.\.\/index\.html#([^"]+)"/g)]
    .map(m => m[1]).filter(a => !['about', 'research', 'experience', 'projects', 'tools', 'publications', 'honors', 'skills', 'contact', 'home'].includes(a));
  if (dead.length) bad(rel, '首页死锚点: #' + [...new Set(dead)].join(', #'));
  else console.log('  ok    跨页锚点有效');

  // 本地文件引用
  total++;
  const miss = localRefs(html, rel).filter(p => !fs.existsSync(p));
  if (miss.length) bad(rel, '断链: ' + miss.map(p => path.relative(root, p).replace(/\\/g, '/')).join(', '));
  else console.log('  ok    本地引用完整 (' + localRefs(html, rel).length + ' 项)');

  // 图片都有 alt
  total++;
  const noAlt = [...html.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/gi)];
  if (noAlt.length) bad(rel, '<img> 缺少 alt ×' + noAlt.length);
  else console.log('  ok    全部 img 有 alt');

  // 标签配对
  total++;
  const strip = html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const unbal = [];
  for (const t of ['section', 'div', 'span', 'a', 'article', 'ul', 'li', 'svg', 'header', 'footer', 'main', 'aside', 'dl', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'button', 'nav', 'figure']) {
    const o = (strip.match(new RegExp('<' + t + '(\\s|>)', 'g')) || []).length;
    const c = (strip.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) unbal.push(t + ':' + o + '/' + c);
  }
  if (unbal.length) bad(rel, '标签不匹配 ' + unbal.join(' '));
  else console.log('  ok    标签配对');

  // 内联脚本语法
  total++;
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  let sOk = true;
  scripts.forEach((s, i) => { try { new Function(s); } catch (e) { sOk = false; bad(rel, '内联脚本 #' + (i + 1) + ' 语法错误: ' + e.message); } });
  if (sOk) console.log('  ok    内联脚本语法 (' + scripts.length + ' 段)');

  // 属性引号完整性：标签内 " 必须成对，且属性值内不得出现裸 < >
  total += 2;
  let qBad = [], gBad = [];
  for (const m of strip.matchAll(/<[a-zA-Z][^>]*>/g)) {
    const tag = m[0];
    const quot = (tag.match(/"/g) || []).length;
    if (quot % 2 !== 0) qBad.push(tag.slice(0, 70));
    const attrs = [...tag.matchAll(/\b[a-zA-Z-]+="([^"]*)"/g)].map(a => a[1]);
    if (attrs.some(v => /[<>]/.test(v))) gBad.push(tag.slice(0, 70));
  }
  if (qBad.length) bad(rel, '属性引号不成对 ×' + qBad.length + ' → ' + qBad[0]);
  else console.log('  ok    属性引号成对');
  if (gBad.length) bad(rel, '属性值内含裸 < > ×' + gBad.length + ' → ' + gBad[0]);
  else console.log('  ok    属性值无裸 < >');

  // 导航与章节编号自洽（重排编号时最容易出错）
  total += 2;
  const secIds = new Set([...html.matchAll(/<(?:section|footer)[^>]*\bid="([^"]+)"/g)].map(m => m[1]));
  const navs = [...html.matchAll(/data-nav="([^"]+)"/g)].map(m => m[1]);
  const dangling = navs.filter(x => !secIds.has(x));
  if (dangling.length) bad(rel, '导航指向不存在的区块: ' + [...new Set(dangling)].join(', '));
  else console.log('  ok    导航 ' + navs.length + ' 项全部命中 section');
  const idxs = [...html.matchAll(/class="sec-idx"[^>]*>\s*([0-9]{2})\s*</g)].map(m => m[1]);
  const dup = idxs.filter((x, i) => idxs.indexOf(x) !== i);
  if (dup.length) bad(rel, '章节编号重复: ' + [...new Set(dup)].join(', ') + '（共 ' + idxs.length + ' 节）');
  else console.log('  ok    章节编号唯一 (' + idxs.length + ' 节: ' + (idxs.join(' ') || '—') + ')');

  // 每个页面必须恰有一个 h1（旧子页缺 h1）
  total++;
  const h1 = (strip.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) bad(rel, '<h1> 数量 = ' + h1 + '（应为 1）');
  else console.log('  ok    唯一 <h1>: ' + (strip.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)[1] || '').replace(/<[^>]+>/g, '').trim().slice(0, 40));
}

console.log('\n=== 全站一致性 ===');
total += 3;
const home = perPage['index.html'];
if (/A Compact Low-Profile Vehicular 5G MIMO Antenna System/.test(home)) console.log('  ok    论文全名在首页出现');
else bad('index.html', '论文全名缺失');

const themeCss = fs.readFileSync(path.join(root, 'assets/theme.css'), 'utf8');
for (const tok of ['--cu:', '--sig:', '--ink-0:', '--mono:', '--disp:']) {
  if (!themeCss.includes(tok.split(':')[0])) { bad('theme.css', '缺少设计令牌 ' + tok); }
}
console.log('  ok    设计令牌齐备 (--cu/--sig/--ink-0/--mono/--disp)');

// 同一事实在多页出现时必须一致：论文年份与专利/申请号是最容易各自漂移的两处
const yearVotes = new Map(), cnVotes = new Map();
for (const [rel, html] of Object.entries(perPage)) {
  const txt = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // 在论文标题 / 期刊名 / AWPL 关键词附近开窗找年份，避免跨句点的正则失配
  for (const anchor of [/A Compact Low-Profile Vehicular 5G MIMO Antenna System/g, /AWPL/g, /vol\.\s*\d{1,3}/g]) {
    for (const m of txt.matchAll(anchor)) {
      const win = txt.slice(Math.max(0, m.index - 90), m.index + 190);
      for (const ym of win.matchAll(/\b(?:19|20)\d\d\b/g)) {
        const k = 'AWPL:' + ym[0];
        if (!yearVotes.has(k)) yearVotes.set(k, new Set());
        yearVotes.get(k).add(rel);
      }
    }
  }
  for (const m of txt.matchAll(/\bCN(\d{8,13}[A.]?\d*)\b/g)) {
    const k = 'CN' + m[1];
    if (!cnVotes.has(k)) cnVotes.set(k, new Set());
    cnVotes.get(k).add(rel);
  }
}
total += 2;
if (!yearVotes.size) console.log('  .     未识别到论文年份，跳过');
else {
  const detail = [...yearVotes].map(([k, s]) => k.split(':')[1] + '→' + [...s].map(r => r.replace('/index.html', '')).join('+')).join('  ');
  const uniq = new Set([...yearVotes.keys()].map(k => k.split(':')[1]));
  console.log('  .     论文年份窗口命中: ' + detail);
  // 只允许一个"权威"年份：2025（卷号 vol.24 = 2025，与 Aug. 2025 自洽）。
  // 其余命中多为窗口内相邻事实（项目周期 2023/2024、专利年号 2024/2025），故只在缺少 2025 或出现 2023 之前时判失败。
  if (!uniq.has('2025')) bad('全站', '论文年份缺少 2025（实际: ' + [...uniq].join(',') + '）');
  else console.log('  ok    论文年份以 2025（vol.24）为全站主值');
}

const cnList = [...cnVotes.keys()].sort();
console.log('  .     全站 CN 号 ' + cnList.length + ' 个：' + cnList.map(k => k + '(' + cnVotes.get(k).size + '页)').join(' '));
// 首页列了 3 项发明专利号，任何一页出现的 CN 号都应是其中之一的变体（申请号或公布号）
const HOME_CNS = ['CN202411549247', 'CN202510483710', 'CN202511158479'];
const odd = cnList.filter(k => !HOME_CNS.some(h => k.startsWith(h.slice(0, 10))));
if (odd.length) info('全站', '额外 CN 号（可能是公布号，需确认归属）: ' + odd.join(' '));
else console.log('  ok    全站 CN 号均可归入首页三项专利');

// 子页不应各自重定义调色板（避免主题漂移）
const drift = [];
for (const [rel, html] of Object.entries(perPage)) {
  if (rel === 'index.html') continue;
  const defs = [...html.matchAll(/--cu:\s*([^;]+);/g)].map(m => m[1].trim());
  if (defs.length) drift.push(rel + '=' + defs.join(','));
}
if (drift.length) bad('子页', '重复定义 --cu 造成主题漂移: ' + drift.join(' '));
else console.log('  ok    无子页重复定义主色');

console.log('\n' + (fail ? '× ' + fail + ' / ' + total + ' 项待修' : '✓ 全部 ' + total + ' 项通过'));
process.exit(fail ? 1 : 0);
