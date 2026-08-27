/* 汇总各页项目时段，交叉比对首页卡片、子页、简历三处，找出互相矛盾的地方。
   用法：node tools/check-periods.js */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const rd = p => fs.readFileSync(path.join(root, p), 'utf8');

const TEXT = h => h.replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&[a-z]+;/gi, ' ')
  .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// 简历里的权威时段（人工从 resume.md 摘出，键与首页卡片顺序一致）
const RESUME = {
  'P-01': '2023.10 – 2024.08',
  'P-02': '2024.07 – 2025.04',
  'P-03': '2025.03 – 2025.09',
  'P-04': '2025.07 – 至今',
  'P-05': '2025.03 – 2025.09',
  'P-06': '2025.02 – 2025.05',
  'E-01': '2025.03 – 2025.09'
};

// 首页卡片：prj-no 后面最近的时段
const home = TEXT(rd('index.html'));
const cardPeriod = {};
for (const m of home.matchAll(/(P-\d\d)[\s\S]{0,80}?((?:20|19)\d\d[.\d]*\s*[–-]\s*(?:至今|present|(?:20|19)\d\d[.\d]*))/g)) {
  cardPeriod[m[1]] = cardPeriod[m[1]] || m[2].trim();
}
// E-01 不在项目卡片里，而在「03 工作经历」时间轴：取"骅盛"之前最近的时段
const RE_RANGE = /((?:20|19)\d\d\.\d{1,2}\s*[–-]\s*(?:至今|present|(?:20|19)\d\d\.\d{1,2}))/g;
const iEmp = home.indexOf('骅盛');
if (iEmp > 0) {
  const before = [...home.slice(0, iEmp).matchAll(RE_RANGE)];
  if (before.length) cardPeriod['E-01'] = before[before.length - 1][1].trim();
}

const dirs = { 'P-01': 'project1', 'P-02': 'project2', 'P-03': 'project3', 'P-04': 'project4', 'P-05': 'project5', 'P-06': 'project6', 'E-01': 'experience1' };
const pgPeriod = {};
for (const [k, d] of Object.entries(dirs)) {
  const t = TEXT(rd(path.join(d, 'index.html')));
  const m = t.match(/Period\s+((?:20|19)\d\d[.\d]*\s*[–-]\s*(?:至今|present|(?:20|19)\d\d[.\d]*))/i)
    || t.match(/((?:20|19)\d\d\.\d{1,2}\s*[–-]\s*(?:至今|present|(?:20|19)\d\d\.\d{1,2}))/);
  pgPeriod[k] = m ? m[1].trim() : '(未找到)';
}

// 归一化便于比较：去前导零、统一分隔符
const n = s => (s || '').replace(/\s+/g, '').replace(/[–-]/g, '~').replace(/(\d)\.0(\d)/g, '$1.$2').replace(/\.(\d)\b/g, '.$1');
const same = (a, b) => n(a).replace(/0(?=[1-9]\b)/g, '') === n(b).replace(/0(?=[1-9]\b)/g, '');

console.log('键    简历                     首页卡片                   子页                       一致?');
console.log('—'.repeat(96));
let clash = 0;
for (const k of Object.keys(RESUME)) {
  const r = RESUME[k], h = cardPeriod[k] || '—', p = pgPeriod[k] || '—';
  const okAll = same(r, h) && same(r, p);
  if (!okAll) clash++;
  console.log(k.padEnd(6) + r.padEnd(25) + h.padEnd(27) + p.padEnd(27) + (okAll ? '✓' : '✗ 需核对'));
}

// 旧版（git HEAD）子页时段，用来说明差异是历史遗留还是本次引入
console.log('\n旧版 HEAD 子页时段（对照）：');
for (const [k, d] of Object.entries(dirs)) {
  let oldTxt;
  try { oldTxt = execSync('git show HEAD:' + d + '/index.html', { cwd: root, maxBuffer: 8 << 20 }).toString('utf8'); }
  catch { continue; }
  const t = TEXT(oldTxt);
  const m = t.match(/((?:20|19)\d\d[.\d]*\s*[–-]\s*(?:至今|present|(?:20|19)\d\d[.\d]*))/);
  const v = m ? m[1].trim() : '(未找到)';
  console.log('  ' + k.padEnd(6) + v.padEnd(26) + (same(v, RESUME[k]) ? '与简历一致' : '与简历不符 → 本次已按简历修正'));
}
console.log('\n' + (clash ? '✗ ' + clash + ' 项三方不一致' : '✓ 三处时段一致'));
