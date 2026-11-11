#!/usr/bin/env node
/* Conservative delivery gate for standalone GEN-UI HTML reports. */
import fs from 'node:fs';
import path from 'node:path';
const files=process.argv.slice(2);
if(!files.length){console.error('用法: node scripts/validate-html-report.mjs <report.html> [...]');process.exit(2);}
export function validateHtml(html){
 const issues=[];
 const lang=html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]||'';
 const hasSidebar=/<aside\b[^>]*(?:class=["'][^"']*doc-toc|id=["']report-sidebar)[^>]*>/i.test(html);
 if(!hasSidebar)issues.push('缺少默认左侧导航容器');
 if(!/<script\b[^>]*\bsrc=["'][^"']*heading-nav\.js["']/i.test(html))issues.push('缺少 heading-nav.js 导航增强脚本');
 if(!/<main\b[^>]*(?:class=["'][^"']*doc-main|id=["']main)[^>]*>/i.test(html))issues.push('缺少正文 main 容器');
 const headings=[...html.matchAll(/<h([234])\b[^>]*>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),text:m[2].replace(/<[^>]+>/g,'').trim()}));
 if(!headings.length)issues.push('缺少可导航的 H2/H3/H4 标题');
 if(lang.toLowerCase().startsWith('zh')){
  const chinese=/^(?:[一二三四五六七八九十百千]+、|[（(][一二三四五六七八九十百千]+[）)]|[甲乙丙丁戊己庚辛壬癸]、)/;
  const decimal=/^\d+(?:\.\d+)*\.?\s/;
  const kinds=new Set(headings.map(h=>chinese.test(h.text)?'chinese':decimal.test(h.text)?'decimal':'none').filter(k=>k!=='none'));
  if(kinds.size>1)issues.push('标题编号混用中文与十进制体系');
  for(const h of headings){if(decimal.test(h.text)){const dots=h.text.match(/^\d+(?:\.\d+)*/)?.[0].split('.').length||0;if(dots!==h.level-1)issues.push('数字标题层级与 H 标签不一致：'+h.text.slice(0,40));}}
 }
 if(/<time\b[^>]*>[^<]*[+-]\d{2}:\d{2}<\/time>/i.test(html))issues.push('可见时间包含时区偏移');
 return issues;
}
let failed=false;
for(const file of files){const target=path.resolve(file);try{const issues=validateHtml(fs.readFileSync(target,'utf8'));console.log((issues.length?'FAIL':'PASS')+' '+file);issues.forEach(i=>console.error('  - '+i));failed||=issues.length>0;}catch(e){failed=true;console.error('FAIL '+file+': '+e.message);}}
if(failed)process.exitCode=1;
