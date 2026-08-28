/* 公开站点敏感信息扫描：仓库会以 public GitHub Pages 发布，任何个人标识、
   雇主信息、本机绝对路径、第三方缓存目录都应在上线前被拦下。
   用法：node tools/check-secrets.js */
const fs = require('fs');
const path = require('path');
const PII = require('./_pii-rules.js');
const root = path.resolve(__dirname, '..');

// 目录级：整个目录都不该出现在仓库里
const BAD_DIR = /(^|[\\/])(xwechat_files|WeChat Files|node_modules|\.git)([\\/]|$)/i;
// 内容级：模式 -> [风险说明, 级别]。high=公开前必须处理，review=确认是否有意
const RULES = [
  [PII.CN_MOBILE_TIGHT, '手机号', 'high'],
  [/tel:/i, '电话链接', 'high'],
  [/C:Users16438|C:\/Users\/16438/i, '本机绝对路径（含用户名目录）', 'high'],
  [/xwechat|wxid_[a-z0-9]+|WeChat Files/i, '微信缓存目录痕迹', 'high'],
  [/员工编号|工号|身份证|入职编号/, '人事标识字段', 'high'],
  [/api[_-]?key|secret|password|token\s*[:=]/i, '疑似凭据', 'high'],
  [/sk-[A-Za-z0-9\-\.]{16,}/, '疑似 API Key', 'high'],
  [/GJB\s*15\d[BC]?[^<\n]{0,20}(限值|任务书|型号)/, '疑似涉密任务细节', 'high'],
  [/程锦阳|Patisight/i, '姓名/ID', 'review'],
  [/利正|骅盛|八院|上海航天/, '雇主名称', 'review'],
];
// 允许出现姓名的文件（个人站本就署名）
const NAME_OK = /index\.html|theme|README|resume\.md|experience1|emc1|html-template/i;

const skip = p => BAD_DIR.test(p) || /[\\/]\.git[\\/]/.test(p) || /node_modules/.test(p);
// 检测器自身必然包含被检测的模式（含 _pii-rules.js 里的 tel:/手机号规则），
// 泛化规则对它们豁免，但真实号码检测绝不豁免
const IS_DETECTOR = /tools[\\/](?:_|check-|verify-|bump-type|bulk_update)/i;

const hits = [];
const scanned = new Set();
let skipped = 0;
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (skip(path.relative(root, p))) continue;
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(html?|css|js|json|md|py|ps1|txt|yml|yaml)$/i.test(e.name)) continue;
    let txt;
    try { txt = fs.readFileSync(p, 'utf8'); } catch { continue; }
    const rel = path.relative(root, p).replace(/\\/g, '/');
    scanned.add(rel);
    // 检测器文件跳过泛化规则（其正则本身就会命中），但绝不跳过真实号码检测——
    // 此前正是这条豁免让我把号码写进了 4 个公开脚本而毫无察觉
    if (IS_DETECTOR.test(rel)) {
      skipped++;
      PII.findPII(txt).forEach(x => hits.push({
        rel, ln: 0, why: '手机号（检测器内不应出现真实号码字面量）', lvl: 'high', snip: x.masked
      }));
      continue;
    }
    txt.split(/\r?\n/).forEach((line, i) => {
      for (const [re, why, lvl] of RULES) {
        if (!re.test(line)) continue;
        if (why === '姓名/ID' && NAME_OK.test(rel)) continue;
        hits.push({ rel, ln: i + 1, why, lvl, snip: line.trim().slice(0, 88) });
      }
    });
  }
}
walk(root);

const ACCEPTED = PII.loadAccepted(root);
// 命中分类：已登记接受 > 高危 > 待确认。已接受项不再拦门禁，但仍列出可审计
const isAcc = h => PII.isAccepted(ACCEPTED, h.rel, h.why);
const ACK = hits.filter(h => h.lvl === 'high' && isAcc(h));
const HIGH = hits.filter(h => h.lvl === 'high' && !isAcc(h));
const LOW = hits.filter(h => h.lvl === 'review');

console.log('=== 高危：公开前必须处理 ===');
if (!HIGH.length) console.log('  无');
HIGH.slice(0, 40).forEach(h => console.log('  ' + h.rel + ':' + h.ln + '  [' + h.why + ']  ' + h.snip));
if (HIGH.length > 40) console.log('  …另有 ' + (HIGH.length - 40) + ' 处');

console.log('\n=== 待确认：是否有意展示 ===');
const byWhy = {};
LOW.forEach(h => { (byWhy[h.why] = byWhy[h.why] || new Set()).add(h.rel); });
for (const [w, s] of Object.entries(byWhy)) {
  console.log('  ' + w + '：' + s.size + ' 个文件  ' + [...s].slice(0, 6).join(', ') + (s.size > 6 ? ' …' : ''));
}
if (!LOW.length) console.log('  无');

console.log('\n=== 已登记接受（tools/pii-accepted.json，按文件+类型豁免）===');
if (!ACCEPTED.length) console.log('  清单为空');
ACCEPTED.forEach(a => console.log('  ' + a.file + '  [' + a.kind + ']  ' + (a.note || '')));
const unused = ACCEPTED.filter(a => {
  // 只在本工具确实扫描过的文件里判断"未命中"：PDF 条目归 check-pdf-secrets 负责，
  // 在这里报"未命中"是假警报
  if (!scanned.has(a.file)) return false;
  return !ACK.some(h => h.rel === a.file);
});
if (ACK.length) console.log('  → 本次实际豁免 ' + ACK.length + ' 处命中');
if (unused.length) console.log('  ! ' + unused.length + ' 条登记未命中（文件可能已改名/删除，建议清理）');

console.log('\n扫描完成：' + HIGH.length + ' 处高危，' + LOW.length + ' 处待确认，' + ACK.length +
  ' 处已豁免（跳过 ' + skipped + ' 个检测器自身文件）');
process.exit(HIGH.length ? 1 : 0);
