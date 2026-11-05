$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$required = @(
  "SKILL.md",
  "README.md",
  "README.zh-CN.md",
  "LICENSE",
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  "agents/openai.yaml",
  ".github/workflows/validate.yml",
  "docs/integration.md",
  "evals/manual-evaluation.md",
  "references/renderer-contract.md",
  "examples/thread-pool.md",
  "examples/thread-pool.ui.json",
  "demo/index.html",
  "demo/renderer.js",
  "tests/renderer.test.mjs",
  "tests/repository.test.mjs",
  "tests/discovery.test.mjs",
  "docs/faq.md",
  "docs/geo.md",
  "docs/geo.zh-CN.md",
  "evals/discovery-baseline.md",
  "examples/code-review.md",
  "examples/acceptance-plan.md",
  "examples/thread-pool.zh-CN.md",
  "examples/thread-pool.ui.zh-CN.json",
  "CHANGELOG.md",
  "references/html-report-contract.md",
  "demo/report.html",
  "demo/report.js",
  "tests/report.test.mjs"
)
foreach ($name in $required) {
  if (-not (Test-Path -LiteralPath (Join-Path $root $name) -PathType Leaf)) {
    throw ("缺少文件: " + $name)
  }
}
Write-Output ("[PASS] Gen UI 文件结构: " + $required.Count)

$skill = [System.IO.File]::ReadAllText((Join-Path $root "SKILL.md"), [System.Text.Encoding]::UTF8)
if (-not ($skill -match '(?s)\A---\s+name:\s+gen-ui\s+description:\s+\S.+?\s+---')) {
  throw "Skill front matter 缺少 gen-ui 名称或 description"
}
$yaml = [System.IO.File]::ReadAllText((Join-Path $root "agents/openai.yaml"), [System.Text.Encoding]::UTF8)
if ($yaml -notmatch 'display_name:\s+"Gen UI"' -or $yaml -notmatch '\$gen-ui') {
  throw "Agent 元数据与 gen-ui 标识不一致"
}
Write-Output "[PASS] Skill / Agent 元数据"

$jsonPath = Join-Path $root "examples/thread-pool.ui.json"
$json = Get-Content -LiteralPath $jsonPath -Encoding UTF8 -Raw | ConvertFrom-Json
if ($json.version -ne "gen-ui-demo/v1") { throw "演示 JSON 协议版本错误" }
if ($json.controls.Count -lt 1 -or $json.controls.Count -gt 8) { throw "控件数量不合法" }
if ($json.metrics.Count -gt 12) { throw "指标数量不合法" }
$ids = @{}
foreach ($control in $json.controls) {
  if ($control.type -ne "slider" -or $ids.ContainsKey([string]$control.id)) { throw "Slider 类型或 ID 不合法" }
  if ($control.min -ge $control.max -or $control.step -le 0 -or $control.value -lt $control.min -or $control.value -gt $control.max) {
    throw "Slider 数值范围不合法"
  }
  $ids[[string]$control.id] = $true
}
foreach ($metric in $json.metrics) {
  if (-not $ids.ContainsKey([string]$metric.source)) { throw "metric.source 引用未知 slider" }
}
Write-Output "[PASS] 演示 JSON 基础协议"

$node = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $node) {
  throw "需要 Node.js 18+ 才能执行完整验证；请安装后重试"
}
& node --check (Join-Path $root "demo/renderer.js")
if ($LASTEXITCODE -ne 0) { throw "Renderer JS 语法失败" }
Write-Output "[PASS] Renderer JS 语法"
& node --check (Join-Path $root "demo/report.js")
if ($LASTEXITCODE -ne 0) { throw "HTML report JS syntax failed" }
Write-Output "[PASS] HTML report JS syntax"

& node --test (Join-Path $root "tests/renderer.test.mjs") (Join-Path $root "tests/repository.test.mjs") (Join-Path $root "tests/discovery.test.mjs") (Join-Path $root "tests/report.test.mjs")
if ($LASTEXITCODE -ne 0) { throw "Node.js tests failed" }
Write-Output "[PASS] Node.js 协议、交互、仓库规范测试"