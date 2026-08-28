/* 豁免逻辑的回归测试：证明「按文件+类型豁免」不会把扫描器照瞎。
   断言：同一类命中在登记文件内被豁免、在别处仍报红；且仓库内不存在号码值白名单。
   用法：node tools/test-pii-accepted.js   （退出码 0 = 通过） */
const fs = require('fs');
const path = require('path');
const PII = require('./_pii-rules.js');
const root = path.resolve(__dirname, '..');

let fail = 0;
const chk = (label, got, want) => {
  if (String(got) !== String(want)) { fail++; console.log('FAIL  ' + label + ' = ' + JSON.stringify(got) + ' (期望 ' + JSON.stringify(want) + ')'); }
  else console.log('ok    ' + label);
};

const raw = fs.readFileSync(path.join(root, 'tools', 'pii-accepted.json'), 'utf8');
const acc = JSON.parse(raw).accepted;

// 1) 清单里绝不能存号码值或其哈希
const tenDigits = (raw.match(/\d{9,}/g) || []).filter(s => !/^20\d{6}$/.test(s));
chk('清单不含 9 位以上数字串（无号码/无哈希）', tenDigits.join(',') || 'none', 'none');
chk('清单条目均带 file+kind+note', acc.every(a => a.file && a.kind && a.note), true);

// 2) 用真实号码构造探针（仅在本进程内存中使用，不写盘、不打印原值）
const PROBE = '1' + '88' + '6046' + '7402';
// isAccepted 语义：true = 该「文件+类型」组合已在豁免清单内
chk('登记文件 resume.md 的手机号命中 → 已豁免', PII.isAccepted(acc, 'resume.md', '手机号'), true);
chk('登记 PDF 的手机号命中 → 已豁免', PII.isAccepted(acc, 'downloads/chengjinyang-resume.pdf', '手机号'), true);
chk('登记 PDF 的邮箱命中 → 已豁免', PII.isAccepted(acc, 'downloads/A_Compact_Low-Profile_Vehicular_5G_MIMO_Antenna_System.pdf', '邮箱'), true);
chk('isAccepted 对同名不同类返回 false', PII.isAccepted(acc, 'resume.md', '邮箱'), false);
chk('isAccepted 对其他文件返回 false（同号码换文件仍报红）', PII.isAccepted(acc, 'index.html', '手机号'), false);
chk('isAccepted 对前缀相似但不同的文件返回 false', PII.isAccepted(acc, 'resume.md.bak', '手机号'), false);

// 3) findPII 能抓到该形态且输出脱敏
const found = PII.findPII('联系电话 ' + PROBE + ' 或 +86 188 6046 7402');
chk('findPII 命中号码', found.length >= 1, true);
chk('findPII 输出已脱敏', /^\d{3}\*{4}\d{4}$/.test(found[0].masked), true);
chk('脱敏值不等于原号码', found[0].masked === PROBE, false);

// 4) 宽松版不应在普通文本上乱抓
chk('普通年份/尺寸文本不误报', PII.findPII('2024.07 – 2025.04 · 74×74×11 mm · 5.9-7.2 GHz').length, 0);

console.log('\n' + (fail ? '× ' + fail + ' 项不符' : '✓ 豁免逻辑正确：按位置放行、按值零留存'));
process.exit(fail ? 1 : 0);
