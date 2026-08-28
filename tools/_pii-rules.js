/* PII 检测规则（共享）
   原则：检测器里绝不出现任何真实个人信息字面量 —— 否则公开仓库本身就成了泄露源。
   一律用「中国大陆手机号通用形态」匹配，既能拦住换号，也不会把号码写进代码。 */
'use strict';

// 11 位大陆手机号：1 开头，第二位 3-9，共 9 位尾号
const CN_MOBILE = /(?<!\d)1[3-9]\d(?:[\s-]?\d){9}(?!\d)/g;
// 紧凑 11 位（无分隔），误报率远低于宽松版
const CN_MOBILE_TIGHT = /(?<!\d)1[3-9]\d{9}(?!\d)/g;
const TEL_HREF = /href\s*=\s*["']tel:/gi;
// 身份证 18 位（排除连号等二进制巧合）
const CN_ID = /(?<!\d)(?!((\d)\2{17}))\d{17}[\dXx](?!\d)/g;

function findPII(text) {
  const out = [];
  const seen = new Set();
  const push = (kind, raw) => {
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length !== 11) return;
    const key = kind + digits;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ kind, digits, masked: digits.slice(0, 3) + '****' + digits.slice(7) });
  };
  for (const m of text.matchAll(CN_MOBILE_TIGHT)) push('手机号', m[0]);
  for (const m of text.matchAll(CN_MOBILE)) push('手机号', m[0]);
  return out;
}

/* 已接受风险：按「文件 + 命中类型」豁免，绝不按号码值豁免（含哈希）。
   只覆盖登记过的具体文件；同一号码出现在别处仍然报红。 */
function loadAccepted(root) {
  try {
    const p = require('path').join(root, 'tools', 'pii-accepted.json');
    return JSON.parse(require('fs').readFileSync(p, 'utf8')).accepted || [];
  } catch { return []; }
}
function isAccepted(accepted, rel, kind) {
  const n = String(rel).replace(/\\/g, '/');
  return accepted.some(a => a.kind === kind &&
    (n === a.file || n.endsWith('/' + a.file) || n.endsWith(a.file)));
}

module.exports = { CN_MOBILE, CN_MOBILE_TIGHT, TEL_HREF, CN_ID, findPII, loadAccepted, isAccepted };
