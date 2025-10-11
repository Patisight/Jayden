$ErrorActionPreference = 'Stop'
$root = 'c:\Users\16438\Desktop\myWebsite'

function Update-File {
  param([string]$Path, [hashtable[]]$Replacements)
  if (!(Test-Path -LiteralPath $Path)) { Write-Host "Skip $Path (not found)"; return }
  $content = Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  foreach ($r in $Replacements) {
    $content = [regex]::Replace($content, $r.Pattern, $r.Replace)
  }
  Set-Content -LiteralPath $Path -Value $content -Encoding UTF8
  Write-Host "Updated: $Path"
}

# 1) 更新根 index.html 的链接到新子目录
Update-File "$root/index.html" @(
  @{ Pattern = 'href\="experience\.html"'; Replace = 'href="experience1/index.html"' },
  @{ Pattern = 'link:\s*"project-project(\d)\.html"'; Replace = 'link: "project$1/index.html"' }
)

# 2) 修正每个项目页的返回链接为 ../index.html?...（位于子目录）
foreach ($i in 1..6) {
  $projPath = "$root/project$i/index.html"
  Update-File $projPath @(
    @{ Pattern = 'href\="index\.html\?'; Replace = 'href="../index.html?' }
  )
}

# 3) 项目1图片路径 sub1/files → files
Update-File "$root/project1/index.html" @(
  @{ Pattern = 'src\="sub1/files/'; Replace = 'src="files/' },
  @{ Pattern = "'sub1/files/"; Replace = "'files/" }
)

# 4) 项目2图片路径 sub2/files → files
Update-File "$root/project2/index.html" @(
  @{ Pattern = 'src\="sub2/files/'; Replace = 'src="files/' },
  @{ Pattern = "'sub2/files/"; Replace = "'files/" }
)

# 5) 项目3-6图片使用 ../myself.jpg（从子目录回到根）
foreach ($i in 3..6) {
  $projPath = "$root/project$i/index.html"
  Update-File $projPath @(
    @{ Pattern = 'src\="myself\.jpg"'; Replace = 'src="../myself.jpg"' },
    @{ Pattern = "'myself\.jpg'"; Replace = "'../myself.jpg'" }
  )
}

# 6) 工作经历页（experience1）返回链接和图片资源（将所有 sub1/files 替换为占位图 ../myself.jpg）
Update-File "$root/experience1/index.html" @(
  @{ Pattern = 'href\="index\.html#experience"'; Replace = 'href="../index.html#experience"' },
  @{ Pattern = 'src\="sub1/files/[^\"]+"'; Replace = 'src="../myself.jpg"' },
  @{ Pattern = "'sub1/files/[^']+'"; Replace = "'../myself.jpg'" }
)