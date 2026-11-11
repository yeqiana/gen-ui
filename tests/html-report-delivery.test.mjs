import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const run=html=>{const temp=fs.mkdtempSync(path.join(os.tmpdir(),'genui-html-'));try{const file=path.join(temp,'report.html');fs.writeFileSync(file,html);fs.mkdirSync(path.join(temp,'assets'));fs.copyFileSync(new URL('../assets/heading-nav.js',import.meta.url),path.join(temp,'assets','heading-nav.js'));return spawnSync(process.execPath,['scripts/validate-html-report.mjs',file],{cwd:root,encoding:'utf8'});}finally{fs.rmSync(temp,{recursive:true,force:true});}};
const base=(headings,extra='')=>'<html lang="zh-CN"><aside class="doc-toc"><nav aria-label="目录"><ul class="toc-list"><li><a href="#chapter">章节</a></li></ul></nav></aside><main class="doc-main">'+headings.replace('<h2>','<h2 id="chapter">')+'</main><script src="assets/heading-nav.js"></script>'+extra+'</html>';
test('交付门禁拒绝缺失导航、混用编号、数字层级错误及可见时区',()=>{
 assert.notEqual(run('<html><main><h2>一、背景</h2></main></html>').status,0);
 assert.notEqual(run(base('<h2>一、背景</h2><h3>1.1 细节</h3>')).status,0);
 assert.notEqual(run(base('<h2>1. 背景</h2><h3>1.1.1 错误层级</h3>')).status,0);
 assert.notEqual(run(base('<h2>一、背景</h2>','<time>2026-11-11 10:00:00+08:00</time>')).status,0);
});
test('交付门禁允许统一中文与十进制编号',()=>{
 assert.equal(run(base('<h2>一、背景</h2><h3>（一） 范围</h3>')).status,0);
 assert.equal(run(base('<h2>1. 背景</h2><h3>1.1 范围</h3><h4>1.1.1 细节</h4>')).status,0);
});

test('无脚本静态目录需真实存在于左侧 aside 的 nav 中',()=>{
 const content='<h2 id="chapter">一、背景</h2>';
 assert.notEqual(run(base(content).replace('<nav aria-label="目录">','<div aria-label="目录">').replace('</nav>','</div>')).status,0);
 assert.notEqual(run(base(content).replace('<li><a href="#chapter">章节</a></li>','')).status,0);
 assert.equal(run(base(content)).status,0);
});

test('图标操作必须具备可访问名称、提示及 SVG 图形',()=>{
 const report=base('<h2>一、背景</h2>');
 assert.notEqual(run(report.replace('</main>','<button class="icon-only" title="关闭"><svg viewBox="0 0 20 20"></svg></button></main>')).status,0);
 assert.notEqual(run(report.replace('</main>','<button class="genui-action-icon" aria-label="关闭" title="关闭">×</button></main>')).status,0);
 assert.equal(run(report.replace('</main>','<button class="genui-action-icon" aria-label="关闭" title="关闭"><svg viewBox="0 0 20 20"></svg></button></main>')).status,0);
});

test('导航脚本路径必须实际存在且不可依赖远程资源',()=>{
 const html=base('<h2>一、背景</h2>');
 assert.notEqual(run(html.replace('assets/heading-nav.js','missing/heading-nav.js')).status,0);
 assert.notEqual(run(html.replace('assets/heading-nav.js','https://example.org/heading-nav.js')).status,0);
 assert.equal(run(html).status,0);
});

test('不存在的目录锚点与离线资源必须拒绝',()=>{
 const html=base('<h2>一、背景</h2>');
 assert.notEqual(run(html.replace('href="#chapter"','href="#unknown"')).status,0);
 assert.notEqual(run(html.replace('href="#chapter"','href="#%ZZ"')).status,0);
 assert.notEqual(run(html.replace('</main>','<img src="missing-image.png"></main>')).status,0);
 assert.notEqual(run(html.replace('</html>','<script src="https://example.com/code.js"></script></html>')).status,0);
 assert.notEqual(run(html.replace('</html>','<link rel="stylesheet" href="https://example.com/x.css"></html>')).status,0);
 assert.notEqual(run(html.replace('</html>','<iframe src="https://example.com/"></iframe></html>')).status,0);
 assert.notEqual(run(html.replace('</html>','<style>.x{background:url(https://example.com/a.png)}</style></html>')).status,0);
 assert.equal(run(html.replace('</html>','<a href="https://github.com">查看源码</a></html>')).status,0);
});
test('unquoted src and srcset are not a network escape hatch',()=>{
 const html=base('<h2>一、背景</h2>');
 assert.notEqual(run(html.replace('</html>','<script src=https://example.com/x.js></script></html>')).status,0);
 assert.notEqual(run(html.replace('</html>','<link rel=stylesheet href=https://example.com/x.css></html>')).status,0);
 assert.notEqual(run(html.replace('</html>','<img srcset="https://example.com/img.png 2x"></html>')).status,0);
});