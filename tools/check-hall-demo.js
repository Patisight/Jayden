/* 霍尔推力器 3D 演示页的结构不变量核验（不依赖 shell 引号）
   用法：node tools/check-hall-demo.js [文件路径] */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.join(root, 'demos/hall-thruster/app/index.html');

if (!fs.existsSync(file)) {
  console.error('找不到文件: ' + path.relative(root, file));
  process.exit(2);
}
const buf = fs.readFileSync(file);
const t = buf.toString('utf8');
const lines = t.split(/\r?\n/);
let fail = 0;
const chk = (label, got, want) => {
  const pass = String(got) === String(want);
  if (!pass) { fail++; console.log('FAIL  ' + label + ' = ' + JSON.stringify(got) + ' (期望 ' + JSON.stringify(want) + ')'); }
  else console.log('ok    ' + label + ' = ' + JSON.stringify(got));
};

console.log('核验目标: ' + path.relative(root, file).replace(/\\/g, '/') +
  '  ' + (buf.length / 1024).toFixed(1) + ' KB / ' + lines.length + ' 行\n');

chk('UTF-8 无 BOM', buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF, false);
chk('charset 在前 1024 字节', t.slice(0, 1024).includes('charset="UTF-8"'), true);
chk('importmap 存在', /"importmap"/.test(t), true);
chk('pin 到 three r160', /three@0\.160\./.test(t), true);
// 单文件自包含：不得引用任何本地相对资源（data:/http(s):/# 除外）
const localRefs = [...t.matchAll(/(?:src|href)\s*=\s*"(?!data:|https?:|#|mailto:)([^"]+)"/g)].map(m => m[1]);
chk('无本地相对依赖（仍可双击打开）', localRefs.join(', ') || 'none', 'none');
// 无新增构建期依赖
chk('无打包器/构建配置引用', /vite\.config|webpack|package\.json|node_modules/.test(t), false);

// animate() 主循环内不得有每帧分配
function block(startRe, maxLines) {
  const i = lines.findIndex(l => startRe.test(l));
  if (i < 0) return null;
  let depth = 0, seen = false;
  for (let j = i; j < Math.min(lines.length, i + maxLines); j++) {
    for (const c of lines[j]) { if (c === '{') { depth++; seen = true; } else if (c === '}') depth--; }
    if (seen && depth <= 0) return { from: i + 1, to: j + 1, text: lines.slice(i, j + 1).join('\n') };
  }
  return { from: i + 1, to: -1, text: lines.slice(i, i + maxLines).join('\n') };
}
const anim = block(/function\s+animate\s*\(/, 400);
chk('定位到 animate()', !!anim, true);
if (anim) {
  console.log('      animate() 行区间 ' + anim.from + '–' + anim.to);
  chk('animate 内无 new THREE.', (anim.text.match(/new\s+THREE\./g) || []).length, 0);
  chk('animate 内无 .clone()', (anim.text.match(/\.clone\(\)/g) || []).length, 0);
  chk('animate 内无数组字面量赋给 clippingPlanes',
    (anim.text.match(/clippingPlanes\s*=\s*\[/g) || []).length, 0);
}
// 三项修复的特征标记
chk('存在画质档位表', /QUALITY\s*=/.test(t), true);
chk('存在弱机启发式', /WEAK|gpuClass/.test(t), true);
chk('存在性能自适应', /perfTick|fpsWin|frameCost/.test(t), true);
chk('存在 renderOrder 分层', (t.match(/renderOrder\s*=/g) || []).length >= 6, true);
chk('存在 dispose 清理', /disposeAll|\.dispose\(\)/.test(t), true);
chk('存在径向磁场控制点表', /FIELD_PROF/.test(t), true);

// 敏感：不得带出本机路径或真实凭据
const pii = require('./_pii-rules.js');
chk('无手机号', pii.findPII(t).length, 0);
chk('无本机绝对路径', /C:[\\/]+Users[\\/]+16438/i.test(t), false);
chk('无微信缓存痕迹', /xwechat|wxid_/i.test(t), false);

console.log('\n' + (fail ? '× ' + fail + ' 项不符' : '✓ 结构不变量全部成立'));
process.exit(fail ? 1 : 0);
