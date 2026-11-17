import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('轻量 Typography 只作用于标注的 HTML 正文，不压缩宽内容',()=>{
 const css=read('assets/typography.css');
 assert.match(css,/main\.genui-typography/);
 const docCss=read('demo/documents/assets/document.css');
 assert.match(docCss,/\.doc-summary>strong\{display:block/);
 assert.doesNotMatch(docCss,/\.doc-summary strong\{display:block/);
 assert.match(css,/\.genui-prose/);
 assert.match(css,/--genui-prose-width:72ch/);
 assert.match(css,/html:lang\(zh\) main\.genui-typography\{--genui-prose-width:62ic\}/);
 assert.match(css,/text-wrap:wrap/);
 assert.match(css,/main\.genui-typography :is\(h1,h2,h3,h4\)/);
 assert.match(css,/max-width:100%;text-wrap:wrap;white-space:normal/);
 assert.doesNotMatch(css,/text-wrap:balance|text-wrap:pretty/);
 assert.doesNotMatch(css,/main\.genui-typography\s+p\{[^}]*text-wrap:balance/s);
 assert.match(css,/line-break:strict/);
 assert.match(css,/--genui-prose-leading:1\.65/);
 assert.match(css,/main\.genui-typography \.genui-article-reading\{[^}]*max-width:min\(100%,var\(--genui-prose-width\)\)/s);
 assert.match(css,/main\.genui-typography :is\(\.genui-prose[^}]*max-width:100%;margin-inline:0/s);
 assert.match(docCss,/\.doc-main :is\(h1,h2,h3,h4\)\{text-wrap:wrap/);
 assert.match(docCss,/\.doc-main \.(?:genui-article-reading)\{/);
 assert.doesNotMatch(css,/\b(?:table|figure|svg|canvas)\s*\{/i);
 assert.match(css,/main\.genui-typography pre\{[^}]*max-width:100%;overflow-x:auto/);
 assert.doesNotMatch(css,/@import|https?:\/\//i);
 assert.match(read('tests/chrome-typography-smoke.mjs'),/table-wrap,\.table-scroll/);
});

test('SKILL 和两类 HTML 合约提供条件加载入口',()=>{
 for(const file of ['SKILL.md','references/html-report-essentials.md','references/html-report-contract.md']){
  assert.match(read(file),/typography\.md/);
 }
 const instructions=read('references/typography.md');
 assert.match(instructions,/chrome-typography-smoke\.mjs --generated/);
 assert.match(instructions,/72ch/);
 assert.match(instructions,/默认按章节自然宽度排版/);
 assert.match(read('references/html-report-essentials.md'),/默认让标题、正文、列表外框与表格共用章节/);
 assert.match(instructions,/不.*单文件|单文件/);
});

for(const [lang,filename] of [['zh-CN','generated-typography-zh.html'],['en','generated-typography-en.html']]){
 test('生成样例 '+lang+' 符合静态交付契约',()=>{
  const rel='tests/fixtures/'+filename,html=read(rel);
  assert.match(html,new RegExp('<html lang="'+lang+'">'));
  assert.match(html,/main class="doc-main genui-typography"/);
  assert.match(html,/assets\/typography\.css/);
  for(const cls of ['genui-prose','table-wrap','diagram'])assert.ok(html.includes(cls));
  const r=spawnSync(process.execPath,['scripts/validate-html-report.mjs',rel],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stdout+'\n'+r.stderr);
 });
}

test('三份规范与 CSS 统一为自然行宽，窄文章只能显式启用',()=>{
 const specs=['references/typography.md','references/html-report-essentials.md','references/html-report-contract.md'];
 for(const f of specs){const s=read(f);assert.match(s,/genui-article-reading/);assert.match(s,/text-wrap:wrap/);}
 const article=read('assets/typography.css'),doc=read('demo/documents/assets/document.css');
 const report=read('demo/report.css'),refresh=read('demo/ui-refresh.css');
 assert.match(article,/\.genui-article-reading\{\s*max-width:min\(100%,var\(--genui-prose-width\)\)/);
 assert.match(doc,/\.genui-article-reading\{max-width:min\(100%,var\(--genui-prose-width\)\)/);
 for(const [f,s] of [['typography.css',article],['document.css',doc],['report.css',report],['ui-refresh.css',refresh]]){
  assert.doesNotMatch(s,/text-wrap:\s*(?:balance|pretty)\b/,f+' must not force early wraps');
 }
 assert.match(doc,/\.doc-main :is\(\.doc-lede,\.doc-summary,[^}]*max-width:100%;margin-inline:0/s);
 assert.doesNotMatch(report,/\.overview-copy p\{max-width:56ch\}/);
 assert.doesNotMatch(refresh,/max-width:min\(100%,var\(--genui-prose-width\)\)/);
 const checks=read('tests/chrome-typography-smoke.mjs');
 assert.match(checks,/narrative blocks share the real chapter width and baseline/);
 assert.match(checks,/Math\.abs\(x\.leftOffset\)<=5/);
});
