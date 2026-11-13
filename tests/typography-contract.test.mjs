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
 assert.match(css,/\.genui-prose/);
 assert.match(css,/--genui-prose-width:72ch/);
 assert.match(css,/--genui-prose-leading:1\.65/);
 assert.match(css,/max-width:min\(100%,var\(--genui-prose-width\)\)/);
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
