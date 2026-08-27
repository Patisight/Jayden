/* 一条命令跑完全部校验。任一环节失败即以非 0 退出。
   用法：node tools/check-all.js            全部（含真实 Chrome 渲染，较慢）
         node tools/check-all.js --fast     跳过渲染校验（纯静态，秒级）
         node tools/check-all.js project2   渲染校验只跑指定页 */
const { execFileSync } = require('child_process');
const path = require('path');

const here = __dirname;
const args = process.argv.slice(2);
const fast = args.includes('--fast');
const pages = args.filter(a => !a.startsWith('--'));

const steps = [
  ['静态校验 · 编码 / 死链 / 语法 / 主题一致性', 'check-site.js', []],
  ['模板契约校验', 'check-template.js', []],
  ['图片完整性与格式一致性', 'check-images.js', []],
  ['内容回归 · 旧版指标数字是否丢失（advisory）', 'check-facts-kept.js', []],
  ['内容一致性 · 简历 / 首页 / 子页 三方时段', 'check-periods.js', []],
];
if (!fast) {
  steps.push(['渲染校验 · 动画分支（启动 headless Chrome）', 'verify-render.js', pages]);
  steps.push(['渲染校验 · prefers-reduced-motion 降级分支', 'verify-render.js', ['--reduced'].concat(pages)]);
}

const results = [];
let bad = 0;
for (const [label, script, extra] of steps) {
  console.log('\n' + '─'.repeat(64));
  console.log('▸ ' + label);
  console.log('─'.repeat(64));
  try {
    execFileSync(process.execPath, [path.join(here, script)].concat(extra), { stdio: 'inherit' });
    results.push(['PASS', label]);
  } catch (e) {
    if (e.status === 2) results.push(['SKIP', label + '（环境缺依赖）']);
    else results.push(['FAIL', label]);
    bad++;
  }
}

console.log('\n' + '═'.repeat(64));
for (const [s, l] of results) console.log((s === 'PASS' ? '✓ ' : s === 'SKIP' ? '– ' : '✗ ') + s.padEnd(5) + l);
console.log('═'.repeat(64));
console.log(bad ? '\n× ' + bad + ' 个环节未通过' : '\n✓ 全部环节通过' + (fast ? '（--fast：未做渲染校验）' : ''));
process.exit(bad ? 1 : 0);
