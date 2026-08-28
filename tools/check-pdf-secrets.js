/* PDF 文本层敏感信息扫描：纯文本扫描器会漏掉 PDF，而 PDF 里往往就是简历正稿。
   做法：解压所有 FlateDecode 流，在解压后的字节里找可见文本与目标敏感串。
   用法：node tools/check-pdf-secrets.js [文件或目录...]  默认扫 downloads/ */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const PII = require('./_pii-rules.js');
const root = path.resolve(__dirname, '..');
const ACCEPTED = PII.loadAccepted(root);

const TARGETS = [
  // 检测器内不含任何真实号码字面量：一律用大陆手机号通用形态。
  // PDF 只启用紧凑版 —— 宽松的分隔容忍模式会在坐标/数字流里大量巧合命中。
  ['手机号', PII.CN_MOBILE_TIGHT],
  ['邮箱', /[A-Za-z0-9][A-Za-z0-9._%+-]*@[A-Za-z0-9.-]+\.(?:com|cn|org|net|edu|gov|io|cc|me)(?:\.cn)?\b/gi],
  ['身份证 18 位', PII.CN_ID],
  ['微信标识', /wxid_[a-z0-9]{6,}|weixin\.qq\.com/gi],
];
// 只扫"像文本"的解压块：CID 字体与图像流会产出一堆巧合匹配（如连号 2222… 被当成身份证号）
function printableRatio(b) {
  if (!b.length) return 0;
  let ok = 0;
  for (const c of b) { if ((c >= 32 && c <= 126) || c === 9 || c === 10 || c === 13) ok++; }
  return ok / b.length;
}

function inflateStreams(buf) {
  const out = [];
  const re = /stream\r?\n?/g;
  let m;
  while ((m = re.exec(buf.toString('latin1')))) {
    const start = m.index + m[0].length;
    const end = buf.toString('latin1').indexOf('endstream', start);
    if (end < 0) continue;
    try { out.push(zlib.inflateSync(buf.subarray(start, end))); }
    catch { try { out.push(zlib.inflateRawSync(buf.subarray(start, end))); } catch { /* 非 zlib 流，跳过 */ } }
  }
  return out;
}
// PDF 里 (文本) 数组片段：Tj / TJ 操作数的字面量
function literals(chunk) {
  const s = chunk.toString('latin1');
  return [...s.matchAll(/\(((?:[^()\\]|\\.)*)\)/g)].map(m => m[1]).join('');
}

let args = process.argv.slice(2);
const list = [];
function collect(p) {
  const st = fs.statSync(p);
  if (st.isDirectory()) fs.readdirSync(p).forEach(f => collect(path.join(p, f)));
  else if (/\.pdf$/i.test(p)) list.push(p);
}
if (!args.length) args = ['downloads'];
for (const a of args) {
  const abs = path.isAbsolute(a) ? a : path.join(root, a);
  if (!fs.existsSync(abs)) { console.log('不存在: ' + abs); continue; }
  collect(abs);
}
if (!list.length) { console.log('未找到任何 PDF。'); process.exit(0); }

let hits = 0;
for (const p of list) {
  const rel = path.relative(root, p).replace(/\\/g, '/');
  const buf = fs.readFileSync(p);
  const all = inflateStreams(buf);
  // 只有文本密度高的解压块才参与匹配，避免把字体/图像二进制里的巧合字节当成身份证、邮箱
  const text = all.filter(printableRatioTest).map(literals).join(' ');
  const raw = buf.toString('latin1');
  const found = [];
  for (const [name, re] of TARGETS) {
    // 号码是强特征，未解压的原始字节也值得扫一遍；其余泛化模式只扫文本流以免误报
    const scoped = /手机号/.test(name) ? text + ' ' + raw : text;
    const ms = [...scoped.matchAll(re)].map(x => x[0]);
    // 输出脱敏，避免 CI 日志再次落入号码明文
    const mask = s => { const dd = String(s).replace(/\D/g, ''); return dd.length === 11 ? dd.slice(0, 3) + '****' + dd.slice(7) : s; };
    if (ms.length) found.push({ name, shown: name + ': ' + [...new Set(ms)].slice(0, 4).map(mask).join(', ') });
  }
  // 按「文件 + 命中类型」套用已登记接受的豁免，与文本扫描器同一份清单
  const ack = found.filter(f => PII.isAccepted(ACCEPTED, rel, f.name));
  const bad = found.filter(f => !PII.isAccepted(ACCEPTED, rel, f.name));
  const pdfVer = /%PDF-(\d\.\d)/.exec(buf.toString('latin1').slice(0, 32));
  const tag = bad.length ? 'HIT   ' : ack.length ? 'ACK   ' : 'ok    ';
  console.log(tag + rel.padEnd(42) +
    (pdfVer ? pdfVer[1] + '  ' : '') + (all.length + ' 流 / 文本流 ' + all.filter(printableRatioTest).length + '  ') +
    (bad.length ? '→ ' + bad.map(f => f.shown).join(' | ')
      : ack.length ? '→ 已登记接受: ' + ack.map(f => f.shown).join(' | ')
      : '未见目标敏感串'));
  hits += bad.length;
}
function printableRatioTest(b) { return printableRatio(b) > 0.75; }
console.log('\n' + (hits
  ? '✗ ' + hits + ' 类敏感信息出现在 PDF 文本层/字节中 —— PDF 属于对外发布物，请确认是否有意'
  : '✓ 所有 PDF 未见目标敏感串（注意：若文本被 CID 字体加密压缩，本脚本可能读不到，需人工复核）'));
process.exit(hits ? 1 : 0);
