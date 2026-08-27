/* 反向审计：新版页面里出现的"量化事实"，是否在旧版页面或简历中有出处。
   没有出处的数字 = 可能是 agent 编造的，必须人工确认。
   用法：node tools/check-no-invented.js */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const DIRS = {
  'P-01': 'project1', 'P-02': 'project2', 'P-03': 'project3',
  'P-04': 'project4', 'P-05': 'project5', 'P-06': 'project6',
  'T-01': 'emc1', 'E-01': 'experience1'
};

const ENT = { '&gt;': '>', '&lt;': '<', '&amp;': '&', '&nbsp;': ' ', '&times;': '×', '&minus;': '-', '&plusmn;': '±' };
const decode = s => s.replace(/&(?:gt|lt|amp|nbsp|times|minus|plusmn);/gi, m => ENT[m] || m);
const textOnly = h => decode(h.replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');

// 首页也算已核实来源（首页数字是我本人依据简历写的）
const HOME = textOnly(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
const RESUME = fs.readFileSync(path.join(root, 'resume.md'), 'utf8');
const SOURCE = (HOME + ' ' + RESUME).replace(/\s+/g, '');

// 只审计"看起来像硬指标"的片段：带工程单位或比较符的数值
const RE = /(?:[<>≈±]=?\s*)?\d+(?:\.\d+)?\s*(?:dBi|dBm|dB|GHz|MHz|mm|cm|%|V\/m|Ω|°|W)\b|[<>]=?\s*\d+(?:\.\d+)?(?=\s*(?:dB|mm|%|GHz|MHz))/g;

function tokens(txt) {
  const out = new Set();
  for (const m of txt.match(RE) || []) {
    const n = m.replace(/\s+/g, '').replace(/×/g, 'x').toLowerCase();
    if (n.length > 1 && n.length < 24) out.add(n);
  }
  return out;
}
// 允许来源侧写法不同：抽出数字本体做子串匹配
function sourced(tok) {
  const digits = (tok.match(/\d+(?:\.\d+)?/g) || []);
  if (!digits.length) return true;
  const src = SOURCE;
  // 全部数字本体都要在来源里出现，且单位也要能对上
  const unit = (tok.match(/(dbi|dbm|db|ghz|mhz|mm|cm|%|°|w|v\/m|ω)/) || [])[1];
  const unitOk = !unit || src.toLowerCase().includes(unit);
  return unitOk && digits.every(dd => src.includes(dd));
}

let flagged = 0;
for (const [k, d] of Object.entries(DIRS)) {
  const txt = textOnly(fs.readFileSync(path.join(root, d, 'index.html'), 'utf8'));
  let oldTxt = '';
  try { oldTxt = textOnly(execSync('git show HEAD:' + d + '/index.html', { cwd: root, maxBuffer: 8 << 20 }).toString('utf8')); } catch { }
  const oldNorm = oldTxt.replace(/\s+/g, '');

  const toks = [...tokens(txt)];
  // 新页里出现、但在「简历 + 首页 + 该页旧版」三处都找不到出处的量化片段
  const unsupported = toks.filter(t => {
    if (sourced(t)) return false;
    const digits = (t.match(/\d+(?:\.\d+)?/g) || []);
    if (digits.length && digits.every(dd => oldNorm.replace(/\s+/g, '').includes(dd))) return false;
    return true;
  });
  if (unsupported.length) {
    flagged += unsupported.length;
    console.log('CHECK ' + k.padEnd(6) + d.padEnd(13) + '无出处量化片段 ' + unsupported.length + ': ' + unsupported.join('  '));
  } else {
    console.log('ok    ' + k.padEnd(6) + d.padEnd(13) + tokens(txt).size + ' 个量化片段全部可溯源');
  }
}

console.log('\n' + (flagged
  ? '✗ ' + flagged + ' 处需人工确认（脚本无法溯源；可能是合理改写，也可能是编造）'
  : '✓ 未发现无出处的量化数据'));
process.exit(0);
