# HTML编码防乱码最佳实践指南

## 1. 文件编码设置

### 1.1 保存文件时的编码格式
- **必须使用**: UTF-8 无BOM (UTF-8 without BOM)
- **避免使用**: UTF-8 with BOM, ANSI, GBK等其他编码

### 1.2 编辑器设置
- Visual Studio Code: 右下角显示编码格式，点击可切换为"UTF-8"
- Notepad++: 编码 → 转为UTF-8无BOM编码
- Sublime Text: File → Save with Encoding → UTF-8

## 2. HTML头部设置

### 2.1 必需的meta标签
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>页面标题</title>
</head>
```

### 2.2 关键要点
- `<meta charset="UTF-8">` 必须在`<head>`标签内的前1024字节
- `lang="zh-CN"` 属性帮助浏览器正确处理中文
- 双重声明charset确保兼容性

## 3. 服务器配置

### 3.1 HTTP响应头
```
Content-Type: text/html; charset=UTF-8
```

### 3.2 .htaccess配置 (Apache)
```apache
AddDefaultCharset UTF-8
<IfModule mod_mime.c>
    AddCharset UTF-8 .html .css .js
</IfModule>
```

### 3.3 Nginx配置
```nginx
charset utf-8;
```

## 4. 常见乱码原因及解决方案

### 4.1 文件保存编码不一致
**问题**: 文件以GBK保存，但声明为UTF-8
**解决**: 重新以UTF-8无BOM格式保存文件

### 4.2 BOM字符干扰
**问题**: UTF-8 BOM在某些环境下显示为乱码
**解决**: 使用UTF-8无BOM格式

### 4.3 服务器编码设置错误
**问题**: 服务器返回错误的Content-Type头
**解决**: 配置服务器正确返回UTF-8编码头

### 4.4 数据库编码不匹配
**问题**: 数据库使用latin1，网页使用UTF-8
**解决**: 统一使用UTF-8编码

## 5. 检查和验证

### 5.1 浏览器开发者工具
- F12 → Network → 查看Response Headers中的Content-Type
- Console中输入: `document.characterSet` 查看当前编码

### 5.2 在线工具
- W3C Markup Validator
- 浏览器编码检测工具

### 5.3 PowerShell检查脚本
```powershell
# 检查文件BOM
Get-ChildItem -Recurse -Filter "*.html" | ForEach-Object {
    $encoding = Get-Content $_.FullName -Encoding Byte -TotalCount 3
    $bom = ""
    if ($encoding.Length -ge 3 -and $encoding[0] -eq 239 -and $encoding[1] -eq 187 -and $encoding[2] -eq 191) {
        $bom = "UTF-8 BOM (需要移除)"
    } else {
        $bom = "UTF-8 无BOM (正确)"
    }
    Write-Output "$($_.Name): $bom"
}
```

## 6. 预防措施

### 6.1 开发环境统一
- 团队使用相同的编辑器设置
- 建立代码规范和检查流程
- 使用版本控制时注意编码设置

### 6.2 自动化检查
- 在构建过程中加入编码检查
- 使用linter工具检查HTML格式
- 定期运行编码验证脚本

### 6.3 测试覆盖
- 在不同浏览器中测试中文显示
- 测试不同操作系统的兼容性
- 验证移动端显示效果

## 7. 应急处理

### 7.1 发现乱码时的处理步骤
1. 确认文件保存编码格式
2. 检查HTML头部meta标签
3. 验证服务器响应头
4. 清除浏览器缓存重新测试
5. 使用开发者工具诊断

### 7.2 批量修复工具
- 使用编辑器的批量替换功能
- 编写脚本批量转换文件编码
- 使用专业的编码转换工具

## 8. 当前项目状态

✅ 所有HTML文件已设置正确的charset meta标签
✅ 所有HTML文件已设置正确的lang属性
✅ 所有HTML文件使用UTF-8无BOM编码
✅ 已创建标准HTML模板供未来使用

### 8.1 自动化检查（推荐，替代手工逐项核对）

一条命令跑完全部环节：`node tools/check-all.js`（加 `--fast` 只跑静态、秒级）。也可按需单跑下列脚本：

```powershell
node tools/check-site.js                       # 编码约定 / 死链 / 标签配对 / 语法 / 主题一致性
node tools/verify-render.js                    # 真实启动 headless Chrome，断言 JS 执行后的 DOM
node tools/verify-render.js --reduced           # 同上，但强制 prefers-reduced-motion 降级分支
node tools/check-images.js                     # 图片存在性、非零字节、扩展名与实际格式是否一致
node tools/check-template.js                   # 模板自身合法 + theme.js 依赖的 id/class 契约齐备
node tools/check-facts-kept.js                 # 对比 git HEAD，旧版指标数字是否在改写中消失（advisory）
node tools/check-periods.js                    # 简历 / 首页 / 子页 三处项目时段是否互相矛盾
```

`check-site.js` 会逐页输出 `ok` / `FAIL`，任一 FAIL 以非 0 退出码结束，可直接接进 CI 或 git pre-commit 钩子。

### 8.2 共享设计系统（2026-08 起）

全站样式与交互已收敛到两个文件，**页面不再各自内联一套 CSS**：

| 文件 | 职责 |
| --- | --- |
| `assets/theme.css` | 设计令牌（`--ink-*` `--line-*` `--cu` `--sig` 等）与全部共享组件样式 |
| `assets/theme.js` | 行为层：滚动进度、导航高亮、HUD、命令面板、滚动揭示、图档与灯箱 |
| `html-template.html` | 新建内容页的骨架，`[契约]` 注释标出 theme.js 依赖的 id / class |

由此新增两条编码约定：

1. **不要在页面里重定义调色板。** 颜色、字体、间距一律引用 `:root` 令牌；页面专属样式只写覆写。
2. **不要写内联事件处理器。** 图档切换、灯箱缩放等交互全部由 `theme.js` 按标记契约接线；页面只提供 `<div class="gal" data-gallery>` 这类结构。

第 2 条的原因：内联 `onclick` 会让每页重复一份约 120 行的图片切换脚本，重构前 7 个子页共 117 处（25/17/16/13/13/13/20），改一处交互要动 7 个文件。

**建议**:
- 保持当前的编码设置不变
- 新建文件时使用提供的模板
- 定期运行编码检查脚本
- 在部署前进行编码验证测试