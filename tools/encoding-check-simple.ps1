# HTML Encoding Check Script
param(
    [string]$Path = "..",
    [switch]$Detailed = $false
)

Write-Host "=== HTML File Encoding Check ===" -ForegroundColor Green
Write-Host "Checking path: $((Get-Item $Path).FullName)" -ForegroundColor Yellow
Write-Host ""

$htmlFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.html"
$totalFiles = $htmlFiles.Count
$issueCount = 0

Write-Host "Found $totalFiles HTML files" -ForegroundColor Cyan
Write-Host ""

foreach ($file in $htmlFiles) {
    $relativePath = $file.FullName.Replace((Get-Item $Path).FullName, "").TrimStart('\')
    $hasIssues = $false
    $issues = @()
    
    # Check BOM
    $encoding = Get-Content $file.FullName -Encoding Byte -TotalCount 3 -ErrorAction SilentlyContinue
    if ($encoding.Length -ge 3 -and $encoding[0] -eq 239 -and $encoding[1] -eq 187 -and $encoding[2] -eq 191) {
        $issues += "Contains UTF-8 BOM (should remove)"
        $hasIssues = $true
    }
    
    # Check file content
    $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    if ($content) {
        # Check charset meta tag
        if ($content -notmatch 'charset\s*=\s*["`'']?UTF-8["`'']?') {
            $issues += "Missing or incorrect charset meta tag"
            $hasIssues = $true
        }
        
        # Check lang attribute
        if ($content -notmatch 'lang\s*=\s*["`'']zh-CN["`'']') {
            $issues += "Missing or incorrect lang attribute"
            $hasIssues = $true
        }
    } else {
        $issues += "Cannot read file content"
        $hasIssues = $true
    }
    
    # Output results
    if ($hasIssues) {
        Write-Host "X $relativePath" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   - $issue" -ForegroundColor Yellow
        }
        $issueCount++
    } else {
        if ($Detailed) {
            Write-Host "OK $relativePath" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Green
Write-Host "Total files: $totalFiles" -ForegroundColor Cyan
Write-Host "Files with issues: $issueCount" -ForegroundColor $(if ($issueCount -eq 0) { "Green" } else { "Red" })
Write-Host "OK files: $($totalFiles - $issueCount)" -ForegroundColor Green

if ($issueCount -eq 0) {
    Write-Host ""
    Write-Host "All HTML files have correct encoding settings!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Found $issueCount files that need fixing" -ForegroundColor Yellow
}