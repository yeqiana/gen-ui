#!/usr/bin/env node
/* Conservative delivery gate for standalone GEN-UI HTML reports. */
import fs from 'node:fs';
import path from 'node:path';
const files=process.argv.slice(2);
if(!files.length){console.error('用法: node scripts/validate-html-report.mjs <report.html> [...]');process.exit(2);}
export function validateHtml(html,sourcePath){
 const issues=[];
 const lang=html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1]||'';
 const sidebar=html.match(/<aside\b[^>]*(?:(?:class=["'][^"']*\bdoc-toc\b[^"']*["'])|(?:id=["']report-sidebar["']))[^>]*>[\s\S]*?<\/aside>/i)?.[0];
 if(!sidebar)issues.push('缺少默认左侧导航容器');
 const nav=sidebar?.match(/<nav\b[^>]*>[\s\S]*?<\/nav>/i)?.[0];
 if(sidebar&&!nav)issues.push('左侧导航缺少 nav 静态结构');
 const toc=nav?.match(/<(?:ul|ol)\b[^>]*class=["'][^"']*\b(?:nav-list|toc-list)\b[^"']*["'][^>]*>[\s\S]*?<\/(?:ul|ol)>/i)?.[0];
 if(nav&&(!toc||!/<a\b[^>]*href=["']#[^"']+["']/i.test(toc)))issues.push('缺少无脚本可用的静态目录链接');
 if(nav){
  const mainMarkup=html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]||"";
  const ids=new Set([...mainMarkup.matchAll(/\bid=["\x27]([^"\x27]+)["\x27]/gi)].map(m=>m[1]));
  for(const m of nav.matchAll(/<a\b([^>]*)>/gi)){
   const href=m[1].match(/\bhref=["\x27]([^"\x27]+)["\x27]/i)?.[1];
   if(!href||!href.startsWith('#')||href.length===1){issues.push('静态目录链接必须指向本页标题');continue;}
   let id;try{id=decodeURIComponent(href.slice(1));}catch{issues.push('静态目录锚点编码错误');continue;}
   if(!ids.has(id))issues.push('静态目录锚点不存在：'+id);
  }
 }
 const scriptPath=html.match(/<script\b[^>]*src=["']([^"']*heading-nav\.js)["']/i)?.[1];
 if(!scriptPath)issues.push('缺少 heading-nav.js 导航增强脚本');
 if(scriptPath && sourcePath){
  const local=scriptPath.split(/[?#]/,1)[0];
  if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(local)||!fs.existsSync(path.resolve(path.dirname(sourcePath),local)))issues.push('导航增强脚本必须为可访问的本地文件');
 }
 for(const button of html.matchAll(/<button\b([^>]*\bclass=["'][^"']*\b(?:genui-action-icon|icon-only)\b[^"']*["'][^>]*)>([\s\S]*?)<\/button>/gi)){
  const attrs=button[1],body=button[2];
  if(!/\baria-label=["'][^"']+["']/i.test(attrs)||!/\btitle=["'][^"']+["']/i.test(attrs)||!/<svg\b/i.test(body))issues.push('图标按钮缺少 aria-label、title 或 SVG');
 }
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
 // 检查离线资源：外链引用允许，页面自动加载的资源必须本地可访问。
 for(const item of html.matchAll(/<(script|link|img|iframe|source|video|audio)\b([^>]*)>/gi)){
  const tag=item[1].toLowerCase(),attrs=item[2];
  const rel=attrs.match(/\brel\s*=\s*(?:(["\x27])([^"\x27]*)\1|([^\s>]+))/i);
  if(tag==='link'&&!/\b(?:stylesheet|icon|shortcut icon|preload|modulepreload)\b/i.test(rel?.[2]??rel?.[3]??''))continue;
  const found=attrs.match(/\b(?:src|href)\s*=\s*(?:(["\x27])([^"\x27]*)\1|([^\s>]+))/i);
  if(!found)continue;
  const url=found[2]??found[3];
  if(/^data:/i.test(url)){
   if(tag!=='img'&&tag!=='link')issues.push('不允许脚本或框架 data URI');
   continue;
  }
  if(/^(?:[a-z][\w+.-]*:|\/\/|\/|\\\\)/i.test(url)){issues.push('自动加载的 '+tag+' 资源不允许外部地址');continue;}
  let name;try{name=decodeURIComponent(url.split(/[?#]/,1)[0]);}catch{issues.push('资源地址编码错误');continue;}
  if(!name||(sourcePath&&!fs.existsSync(path.resolve(path.dirname(sourcePath),name))))issues.push(tag+' 本地资源不存在：'+name);
 }
 // Responsive image source sets must also remain entirely offline.
 for(const item of html.matchAll(/<(?:img|source)\b([^>]*)>/gi)){
  const found=item[1].match(/\bsrcset\s*=\s*(?:(["\x27])([^"\x27]*)\1|([^\s>]+))/i);
  if(!found)continue;
  const value=found[2]??found[3];
  if(value.startsWith('data:'))continue;
  for(const entry of value.split(',').map(x=>x.trim().split(/\s+/)[0]).filter(Boolean)){
   if(/^(?:[a-z][\w+.-]*:|\/\/|\/|\\\\)/i.test(entry)){issues.push('srcset 禁止自动加载外部图片');continue;}
   const name=entry.split(/[?#]/,1)[0];
   if(sourcePath&&!fs.existsSync(path.resolve(path.dirname(sourcePath),name)))issues.push('srcset 本地图片不存在：'+name);
  }
 }
 if(/(?:@import\s+(?:url\()?\s*["\x27]?|url\(\s*["\x27]?)(?:https?:\/\/|\/\/)/i.test(html))issues.push('CSS 禁止远程加载资源');
 return issues;
}
let failed=false;
for(const file of files){const target=path.resolve(file);try{const issues=validateHtml(fs.readFileSync(target,'utf8'),target);console.log((issues.length?'FAIL':'PASS')+' '+file);issues.forEach(i=>console.error('  - '+i));failed||=issues.length>0;}catch(e){failed=true;console.error('FAIL '+file+': '+e.message);}}
if(failed)process.exitCode=1;
