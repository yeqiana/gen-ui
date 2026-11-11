import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const run=(html)=>{const tmp=new URL('tests/.genui-delivery-temp.html',root);try{fs.writeFileSync(tmp,html);return spawnSync(process.execPath,['scripts/validate-html-report.mjs','tests/.genui-delivery-temp.html'],{cwd:root,encoding:'utf8'});}finally{fs.rmSync(tmp,{force:true});}};
const base=(headings,extra='')=>'<html lang="zh-CN"><aside class="doc-toc"></aside><main class="doc-main">'+headings+'</main><script src="assets/heading-nav.js"></script>'+extra+'</html>';
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
