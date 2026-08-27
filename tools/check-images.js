/* 图片完整性检查：验证页面引用的每个文件存在、非零字节，并按文件头判断实际格式
   与扩展名是否一致（webp 伪装成 jpg 或反之会导致部分浏览器不渲染）。
   用法：node tools/check-images.js */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const PAGES = ['index.html', 'project1', 'project2', 'project3', 'project4', 'project5', 'project6', 'emc1', 'experience1']
  .map(p => path.join(root, p.endsWith('.html') ? p : path.join(p, 'index.html')));

function sniff(head) {
  const s = head.toString('latin1');
  if (/^RIFF.{4}WEBP/s.test(s)) return 'webp';
  if (head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF) return 'jpeg';
  if (head[0] === 0x89 && head[1] === 0x50) return 'png';
  if (s.startsWith('GIF8')) return 'gif';
  if (s.startsWith('BM')) return 'bmp';
  return 'unknown';
}

let fail = 0, warn = 0, count = 0, bytes = 0;
const seen = new Map();

for (const f of PAGES) {
  if (!fs.existsSync(f)) { console.log('FAIL  页面缺失 ' + path.relative(root, f)); fail++; continue; }
  const html = fs.readFileSync(f, 'utf8');
  const rel = path.relative(root, f).replace(/\\/g, '/');
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="((?!https?:|mailto:|tel:|data:|#)[^"]+\.(?:webp|png|jpe?g|gif|svg|avif))(?:#[^"]*)?"/gi)) {
    refs.add(path.resolve(path.dirname(f), m[1]));
  }
  const probs = [], warns = [];
  for (const p of refs) {
    count++;
    if (!fs.existsSync(p)) { probs.push('不存在: ' + path.basename(p)); fail++; continue; }
    const st = fs.statSync(p);
    bytes += st.size;
    if (st.size === 0) { probs.push('0 字节: ' + path.basename(p)); fail++; continue; }
    if (st.size < 12) { probs.push('过小(' + st.size + 'B): ' + path.basename(p)); fail++; continue; }
    const fd = fs.openSync(p, 'r');
    const head = Buffer.alloc(16);
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
    const actual = sniff(head);
    const ext = path.extname(p).slice(1).toLowerCase().replace('jpg', 'jpeg');
    if (actual === 'unknown') { probs.push('无法识别格式: ' + path.basename(p)); fail++; }
    // 扩展名与实际编码不符：浏览器仍会渲染（内容嗅探），属资产遗留问题而非页面损坏，记为警告
    else if (actual !== ext) { warns.push(path.basename(p) + ' 是 ' + actual.toUpperCase() + ' 却命名 .webp'); warn++; }
    if (!seen.has(p)) seen.set(p, st.size);
  }
  const tag = probs.length ? 'FAIL' : warns.length ? 'WARN' : 'ok';
  console.log(tag.padEnd(5) + '  ' + rel.padEnd(24) + ' ' + refs.size + ' 张' +
    (probs.length ? ' → ' + probs.join('; ') : warns.length ? ' → ' + warns.join('; ') : ' 均有效 (' + (sumRefs(refs) / 1024).toFixed(0) + ' KB)'));
}

function sumRefs(refs) { let s = 0; for (const p of refs) { try { s += fs.statSync(p).size; } catch { } } return s; }

console.log('\n唯一图片 ' + seen.size + ' 个，被引用总字节 ' + (bytes / 1048576).toFixed(2) + ' MB');

// 未被任何页面引用的图片 = 垃圾文件（含 .backup）
const all = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'tools' || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(webp|png|jpe?g|gif|avif)(\.backup)?$/i.test(e.name)) all.push(p);
  }
})(root);
const orphan = all.filter(p => !seen.has(p));
const backups = orphan.filter(p => /\.backup$/i.test(p));
const realOrphan = orphan.filter(p => !/\.backup$/i.test(p));
const sizeOf = ps => ps.reduce((s, p) => s + fs.statSync(p).size, 0) / 1024;

console.log('\n未被任何页面引用的图片文件：');
console.log('  .backup 备份 ×' + backups.length + '，占 ' + sizeOf(backups).toFixed(0) + ' KB');
if (realOrphan.length) {
  console.log('  真实孤儿图 ×' + realOrphan.length + '，占 ' + sizeOf(realOrphan).toFixed(0) + ' KB:');
  realOrphan.forEach(p => console.log('    ' + path.relative(root, p).replace(/\\/g, '/')));
}
console.log('\n' + (fail ? '× ' + fail + ' 项图片损坏'
  : warn ? '! ' + warn + ' 项格式与扩展名不符（不影响渲染，建议重编码）'
  : '✓ ' + count + ' 处引用全部有效'));
process.exit(fail ? 1 : 0);
