/* 对比 git HEAD 旧版与当前新版，检查"事实性 token"是否丢失，并打印旧页上下文供人工判断。
   agent 只能自查自己那一页，看不到回归；此脚本专门抓这个。
   用法：node tools/check-facts-kept.js [--ctx]   加 --ctx 打印旧页中该 token 的所在句子
   依赖 git，非 git 仓库时退出码 2。 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const PAGES = ['project1', 'project2', 'project3', 'project4', 'project5', 'project6', 'experience1'];
const WANT_CTX = process.argv.includes('--ctx');

try { execSync('git rev-parse HEAD', { cwd: root, stdio: 'pipe' }); }
catch { console.error('非 git 仓库或无 HEAD，跳过。'); process.exit(2); }

const ENT = { '&gt;': '>', '&lt;': '<', '&amp;': '&', '&nbsp;': ' ', '&plusmn;': '±', '&times;': '×', '&minus;': '-', '&Omega;': 'Ω', '&deg;': '°' };
function decode(s) {
  return s.replace(/&(?:gt|lt|amp|nbsp|plusmn|times|minus|Omega|deg);/gi, m => ENT[m] || m)
          .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
}
// 去掉标签与脚本样式，只留文本层，避免抓到 class/CSS 里的数字
function textOnly(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/g, ' ')
                   .replace(/<style[\s\S]*?<\/style>/g, ' ')
                   .replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ');
}

// 只保留"确实带单位或有量纲含义"的片段，过滤 >0 / <1 这类噪声
const UNITS = '(?:dBi?|MHz|GHz|mm|cm|V\\/m|W|Ω|°|%)';
const PATTERNS = [
  new RegExp('\\d+(?:\\.\\d+)?\\s*' + UNITS + '\\b', 'g'),
  new RegExp('[<>≈±]=?\\s?\\d+(?:\\.\\d+)?\\s*' + UNITS, 'g'),
  /[<>≈±]=?\s?\d+(?:\.\d+)?(?=\s|$)/g,
  /CN\d{4,}\s*\d{4,}\.\d/g,
  /\d+\s*[×x]\s*\d+(?:\s*[×x]\s*\d+)?\s*mm/gi,
  /\bVSWR\b|\bRHCP\b|\bAWPL\b|\bBNN\b|\bPSO\b|\bCNAS\b|\bLNA\b|\bP1dB\b|\bJFIF\b/g,
  /IEEE|Antennas and Wireless Propagation Letters|Compact Low-Profile Vehicular/g,
  /\d{4}\.\d{1,2}/g
];

function norm(m) {
  return m.replace(/\s+/g, '').replace(/[×x]/gi, 'x').replace(/[–-]/g, '-').toLowerCase();
}
function facts(txt) {
  const s = new Set();
  for (const re of PATTERNS) for (const m of txt.match(re) || []) {
    const n = norm(m);
    // 丢弃无量纲的孤立符号数字（>0 <1 =2 等）与纯年份小节号
    if (/^[<>≈±]?-?\d{1,2}$/.test(n)) continue;
    if (n.length > 1 && n.length < 44) s.add(n);
  }
  return s;
}
function ctxOf(oldRaw, token) {
  if (!WANT_CTX) return '';
  const i = oldRaw.toLowerCase().replace(/\s+/g, '').indexOf(token);
  if (i < 0) return '';
  return oldRaw.slice(Math.max(0, i - 60), i + 60).replace(/\s+/g, ' ');
}

let needReview = 0;
for (const p of PAGES) {
  let oldRaw;
  try { oldRaw = execSync('git show HEAD:' + p + '/index.html', { cwd: root, maxBuffer: 8 << 20 }).toString('utf8'); }
  catch { console.log('SKIP  ' + p); continue; }
  const newRaw = fs.readFileSync(path.join(root, p, 'index.html'), 'utf8');
  const A = textOnly(oldRaw), B = textOnly(newRaw);
  const before = facts(A), after = facts(B);
  const gone = [...before].filter(t => !after.has(t));
  // 宽松匹配：允许新版换了写法，只要数字本体还在文本里
  const truly = gone.filter(t => {
    const digits = (t.match(/\d+(?:\.\d+)?/g) || []);
    if (!digits.length) return !B.toLowerCase().includes(t.replace(/[<>≈±]=?/, ''));
    return digits.every(dd => !B.replace(/\s+/g, '').toLowerCase().includes(dd));
  });
  needReview += truly.length;
  console.log((truly.length ? 'REVIEW' : 'ok').padEnd(7) + p.padEnd(13) +
    '旧文本事实 ' + String(before.size).padStart(3) + ' → 新 ' + String(after.size).padStart(3) +
    '   数字本体完全消失 ' + truly.length + (truly.length ? ': ' + truly.join('  ') : ''));
  if (truly.length && WANT_CTX) truly.forEach(t => {
    const c = ctxOf(A, t);
    if (c) console.log('         …' + c + '…');
  });
}
console.log('\n' + (needReview
  ? '需人工确认 ' + needReview + ' 处（数字在新版文本中完全不存在；多为措辞重构或确实遗漏）'
  : '✓ 旧版所有含数字的事实在新版中仍可寻址，无硬性遗漏'));
process.exit(0);
