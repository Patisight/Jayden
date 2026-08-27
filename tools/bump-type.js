/* 字号地板提升：把过小的 rem 字号抬到可读地板。
   用法：node tools/bump-type.js --dry     只打印将要改的行（默认）
         node tools/bump-type.js --write   实际写入
   规则：
     < 0.80rem  -> 0.80rem   （微标签/数据，中文可读下限）
     0.80-0.94  -> 0.95rem   （卡片描述等次级正文）
   例外（保持小巧的纯装饰件，见 KEEP） */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');

const FILES = ['assets/theme.css', 'index.html', 'project1/index.html', 'project2/index.html',
  'project3/index.html', 'project4/index.html', 'project5/index.html', 'project6/index.html',
  'experience1/index.html'];

// 这些选择器上下文里允许保留更小字号（仪器读数类装饰件）
const KEEP = [/\.hud\b/, /gal-thumbs\s+i/, /band-key/, /\.ruler/, /scope\s*\.lbl/];

const dry = !process.argv.includes('--write');
const ROOT_PX = 17;              // html 根字号，配合下方地板一起决定最终像素
const FLOOR = 0.80, MID = 0.95;
let changed = 0, files = 0;
const report = [];

for (const rel of FILES) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) continue;
  const src = fs.readFileSync(abs, 'utf8');
  const lines = src.split('\n');
  const out = [];
  let sel = '';           // 最近一个以 { 结尾的选择器行（多行规则的正确归属）
  let touched = 0;
  lines.forEach((line, i) => {
    const t = line.trim();
    // 只有当某行以 { 结尾时才是选择器；单行规则的选择器取该行本身
    if (/\{\s*$/.test(t)) sel = t.replace(/\{\s*$/, '');
    const m = t.match(/font-size:\s*([0-9.]+)rem/);
    if (m) {
      const v = parseFloat(m[1]);
      const owner = (/\{\s*$/.test(t) ? t.split('{')[0] : sel);
      const keep = KEEP.some(re => re.test(owner) || re.test(t));
      let to = null;
      if (!keep && v < FLOOR) to = FLOOR;
      else if (!keep && v < MID) to = MID;
      if (to !== null && to !== v) {
        out.push(line.replace(/font-size:\s*[0-9.]+rem/, 'font-size: ' + to + 'rem'));
        touched++; changed++;
        report.push({ rel, ln: i + 1, owner, from: v, to,
          px: (v * 16).toFixed(1) + '→' + (to * ROOT_PX).toFixed(1) });
        return;
      }
    }
    out.push(line);
  });
  if (touched) {
    files++;
    if (!dry) fs.writeFileSync(abs, out.join('\n'), 'utf8');
  }
}
for (const r of report) {
  console.log(('  ' + r.rel).padEnd(26) + 'L' + String(r.ln).padEnd(5) +
    (r.from + '→' + r.to + 'rem').padEnd(14) + ('@16→@' + ROOT_PX + 'px ' + r.px).padEnd(20) +
    r.owner.slice(0, 52));
}
console.log('\n' + (dry ? '[dry-run] ' : '') + '涉及 ' + files + ' 个文件，' + changed + ' 处字号' +
  (dry ? '。确认后加 --write 落盘（同时需手工设 html{font-size:' + ROOT_PX + 'px}）。' : '已写入。'));
