/* 渲染校验：对每个页面真实启动 headless Chrome，导出 JS 执行后的 DOM 并断言。
   用法：node tools/verify-render.js            全部页面（动画分支）
         node tools/verify-render.js --reduced  强制 prefers-reduced-motion
   需要本机 Google Chrome；不可用时以前提失败退出并说明。 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const PII = require('./_pii-rules.js');

const root = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'project1', 'project2', 'project3', 'project4',
               'project5', 'project6', 'emc1', 'experience1'];
// 演示页走另一套断言：关心 iframe 是否指向真实存在的应用页、披露是否到位
const DEMOS = ['demos/optimizer', 'demos/spectrometer', 'demos/hall-thruster'];
const REDUCED = process.argv.includes('--reduced');
// 只校验指定页面：node tools/verify-render.js index.html project6
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));
const PAGES_ALL = PAGES;
const PAGES_SEL = ONLY.length ? PAGES_ALL.filter(p => ONLY.some(o => p === o || o === p + '/')) : PAGES_ALL;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  'google-chrome', 'chromium'
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find(p => { try { return fs.existsSync(p) || p === 'google-chrome' || p === 'chromium'; } catch { return false; } });
if (!chrome) {
  console.error('未找到 Chrome/Chromium，无法做渲染校验。设置 CHROME_PATH 后重试。');
  console.error('注意：这不代表页面有问题，只是本机缺少校验工具。');
  process.exit(2);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jayden-render-'));
let fail = 0, checks = 0;

function dump(rel) {
  // 允许传 "path/to/x.html?a=1"：查询串不属于磁盘路径，但必须留在 file:// URL 上
  const qi = rel.indexOf('?');
  const relPath = qi < 0 ? rel : rel.slice(0, qi);
  const query = qi < 0 ? '' : rel.slice(qi);
  const file = path.join(root, relPath.endsWith('.html') ? relPath : path.join(relPath, 'index.html'));
  const out = path.join(tmp, relPath.replace(/[\\/]/g, '_') + '.html');
  const err = path.join(tmp, relPath.replace(/[\\/]/g, '_') + '.log');
  const args = ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    '--window-size=1500,20000', '--virtual-time-budget=9000',
    '--enable-logging=stderr', '--v=0', '--dump-dom',
    'file:///' + file.replace(/\\/g, '/') + query];
  if (REDUCED) args.splice(1, 0, '--force-prefers-reduced-motion');
  const fd = fs.openSync(err, 'w');
  try { execFileSync(chrome, args, { stdio: ['ignore', fs.openSync(out, 'w'), fd], timeout: 120000 }); }
  catch (e) { /* Chrome 常以非 0 退出，DOM 仍已写出 */ }
  finally { fs.closeSync(fd); }
  return { dom: fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '', log: fs.readFileSync(err, 'utf8') };
}

const chk = (page, label, got, want) => {
  checks++;
  const pass = String(got) === String(want);
  if (!pass) { fail++; console.log('  FAIL  [' + page + '] ' + label + ' = ' + JSON.stringify(got) + ' (期望 ' + JSON.stringify(want) + ')'); }
  return pass;
};

for (const rel of PAGES_SEL) {
  const { dom, log } = dump(rel);
  console.log('\n[' + rel + ']');
  if (!dom || dom.length < 500) { fail++; console.log('  FAIL  未取到渲染 DOM'); continue; }
  // 剥离脚本源码，避免把 JS 字符串字面量当成元素（引用检查须用未剥离的 dom）
  const d = dom.replace(/<script[\s\S]*?<\/script>/g, '');

  chk(rel, '有渲染内容', d.length > 9000, true);
  chk(rel, '存在唯一 h1', (d.match(/<h1[\s>]/g) || []).length, 1);
  chk(rel, '存在多个 h2 区块', (d.match(/<h2[\s>]/g) || []).length >= 3, true);
  chk(rel, '引用 theme.css', dom.includes('assets/theme.css'), true);
  chk(rel, '引用 theme.js', dom.includes('assets/theme.js'), true);
  chk(rel, '手机号未出现', PII.findPII(dom).length + [...dom.matchAll(/href=["']tel:/gi)].length, 0);
  chk(rel, '无内联事件', /\bon(?:click|load|change)\s*=/i.test(d), false);

  // theme.js 是否真的执行：进度条写入 style、揭示类被加、HUD 被填
  chk(rel, 'theme.js 已执行 (rulerFill 写入宽度)', /id="rulerFill"[^>]*style="width:/.test(d), true);
  chk(rel, 'theme.js 已执行 (.rv 揭示)', (d.match(/class="[^"]*\brv\b[^"]*\bin\b/g) || []).length > 0, true);
  chk(rel, 'theme.js 已执行 (HUD 已写入)', /id="hudName">[^<]{2,}/.test(d), true);
  chk(rel, '命令面板已填充条目', (d.match(/<li data-h="/g) || []).length >= 5, true);

  // 计数器：动画分支依赖 rAF 与虚拟时间的相对时序，同配置下可能早可能晚，
  // 因此该分支只断言「不超过目标」；终值断言留给确定性的 reduced 分支，避免闪断门禁
  const cts = [...d.matchAll(/data-count="(\d+)">([^<]*)</g)];
  if (cts.length) {
    const over = cts.filter(m => +m[2] > +m[1]);
    chk(rel, '计数器无上溢', over.length, 0);
    if (REDUCED) chk(rel, 'reduced 下计数器等于终值',
      cts.map(m => m[2]).join(','), cts.map(m => m[1]).join(','));
  }

  // 图档契约（仅当该页确实声明 data-gallery；emc1 一类页用内联 SVG 框图，无照片）
  if (rel !== 'index.html') {
    const hasGal = d.includes('data-gallery');
    chk(rel, '有照片图档或有内联框图', hasGal || /<svg class="bx"/.test(d), true);
    if (hasGal) {
      const stage = (d.match(/<div class="gal-stage[\s\S]*?(?=<div class="gal-thumbs")/) || [''])[0];
      const n = (stage.match(/<img\b/g) || []).length;
      const thumbs = (d.match(/<div class="gal-thumbs"[\s\S]*?<\/div>/) || [''])[0];
      chk(rel, '图档有图片', n >= 1, true);
      chk(rel, '缩略图由 JS 生成 (数量匹配)', (thumbs.match(/<button/g) || []).length, n);
      chk(rel, '图名已由 JS 写入', /class="gal-name">[^<]+</.test(d), true);
      chk(rel, '计数已由 JS 写入', /class="gal-count ct">\d\d \/ \d\d</.test(d), true);
      chk(rel, '灯箱由 JS 注入', d.includes('id="lb"') && d.includes('id="lbImg"'), true);
      chk(rel, 'stage 可键盘聚焦', /class="gal-stage"[^>]*tabindex="0"/.test(d), true);
    } else {
      console.log('  .     本页无照片图档，以 SVG 框图表达，跳过图档断言');
    }
    chk(rel, '规格表存在', (d.match(/<dl class="spec-tbl/g) || []).length >= 1, true);
    chk(rel, '面包屑回首页', d.includes('href="../"'), true);
    chk(rel, '无死锚点', /#research-(antenna|rf|ai)/.test(d), false);
  } else {
    // 首页专属
    const pE = (d.match(/id="patE" d="([^"]*)"/) || [])[1] || '';
    chk(rel, 'E 面方向图由 JS 采样', (pE.match(/L/g) || []).length, 240);
    chk(rel, '频段带由 JS 生成', (d.match(/<div class="row[ "]/g) || []).length, 12);
    chk(rel, '论文全名', dom.includes('A Compact Low-Profile Vehicular 5G MIMO Antenna System'), true);
    chk(rel, '能力条已填充', (d.match(/<i class="fl"[^>]*style="width:/g) || []).length, 20);
  }

  const errs = log.split(/\r?\n/).filter(l => /Uncaught|ReferenceError|TypeError|SyntaxError/i.test(l));
  if (errs.length) { fail++; console.log('  FAIL  运行时错误: ' + errs.join(' | ')); }
  else console.log('  ok    运行时错误 0 · DOM ' + (d.length / 1024).toFixed(1) + ' KB');
}

/* ---------- 演示页：包装页 + 内嵌应用页 ---------- */
if (!ONLY.length) {
  console.log('\n════ 演示页 ════');
  for (const rel of DEMOS) {
    const wrapper = path.join(root, rel, 'index.html');
    if (!fs.existsSync(wrapper)) { chk(rel, '包装页存在', false, true); continue; }
    const { dom, log } = dump(rel);
    const d = dom.replace(/<script[\s\S]*?<\/script>/g, '');
    console.log('\n[' + rel + ']');
    chk(rel, '唯一 h1', (d.match(/<h1[\s>]/g) || []).length, 1);
    chk(rel, '引用 theme.css', dom.includes('assets/theme.css'), true);
    chk(rel, '有披露条 .demo-bar', d.includes('class="demo-bar"'), true);
    chk(rel, '披露说明可运行性', /模拟|复刻|可交互|无后端|需联网/.test(d), true);
    chk(rel, '有面包屑回首页', /<a href="\.\.\/\.\.\/">/.test(d), true);
    chk(rel, '无内联事件', /\bon(?:click|load|change)\s*=/i.test(d), false);
    chk(rel, '无手机号', PII.findPII(dom).length, 0);

    // iframe 目标必须真实存在且自身可跑（剥掉 ?query / #hash，它们不是路径的一部分）
    const src = (d.match(/<iframe[^>]*src="([^"]+)"/) || [])[1];
    const cleanSrc = src ? src.split('#')[0].split('?')[0] : null;
    const qs = src && src.includes('?') ? src.slice(src.indexOf('?')) : '';
    const appAbs = cleanSrc ? path.resolve(path.dirname(wrapper), cleanSrc) : null;
    chk(rel, 'iframe 指向的文件存在', appAbs && fs.existsSync(appAbs), true);
    if (appAbs && fs.existsSync(appAbs)) {
      const appRelPath = path.relative(root, appAbs).replace(/\\/g, '/');
      const a = dump(appRelPath + qs);
      const ad = a.dom.replace(/<script[\s\S]*?<\/script>/g, '');
      const aerr = a.log.split(/\r?\n/).filter(l => /Uncaught|ReferenceError|TypeError|SyntaxError/i.test(l));
      chk(rel, '应用页渲染出内容', ad.length > 8000, true);
      chk(rel, '应用页无 JS 异常', aerr.length, 0);
      console.log('  .     应用页 ' + appRelPath + ' · DOM ' + (ad.length / 1024).toFixed(1) + ' KB');
    }
  }
}

console.log('\n模式: ' + (REDUCED ? 'prefers-reduced-motion' : '动画默认') +
            '\n' + (fail ? '× ' + fail + ' / ' + checks + ' 项不符' : '✓ ' + checks + ' 项全部通过'));
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { }
process.exit(fail ? 1 : 0);
