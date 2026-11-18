// Deterministic offline renderer for structurally checked unseen-source candidates.
// This is NOT a model generator and cannot assert independent semantic correctness.
import fs from "node:fs";
import path from "node:path";
const escape=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
function quoteList(ev){
 return ev.map(e=>"<li><code>"+escape(e.file)+"</code>：<q>"+escape(e.quote)+"</q></li>").join("");
}
export function renderPanorama(c,metadata,root){
 if(!metadata||c.id!==metadata.id)throw Error("Mismatched source metadata");
 const b=fs.readFileSync(path.join(root,"demo/documents/assets/product-panorama-case.css"),"utf8");
 const t=fs.readFileSync(path.join(root,"assets/product-panorama-svg-theme.css"),"utf8");
 if(/@import\b|url\s*\(/i.test(b+t))throw Error("Remote CSS dependencies are forbidden");
 const styles=b+"\n"+t;
 const moduleCount=c.layers.reduce((n,l)=>n+l.modules.length,0);
 const bands=c.layers.map(l=>
  '<div class="panorama-band" data-panorama-layer="'+escape(l.title)+'">'
   +'<div class="panorama-band-label">'+escape(l.title)+'</div>'
   +'<div class="panorama-band-content"><div class="panorama-band-title">来源对应的能力</div>'
   +'<div class="panorama-modules">'+l.modules.map(m=>'<div class="panorama-chip" title="'+escape(m.id)+'">'+escape(m.title)+'</div>').join("")+'</div>'
   +'</div></div>').join("");
 const evidence=c.layers.map(l=>l.modules.map(m=>
   "<li><strong>"+escape(l.title)+" / "+escape(m.title)+"</strong><ul>"+quoteList(m.evidence)+"</ul></li>"
 ).join("")).join("");
 const relations=c.relations.length
  ? '<table><caption>有来源依据的关系（不自动推断更多连线）</caption><thead><tr><th>模块</th><th>关系</th><th>目标</th><th>证据</th></tr></thead><tbody>'
   +c.relations.map(r=>'<tr><td>'+escape(r.from)+'</td><td>'+escape(r.type)+(r.condition!==undefined?'（'+escape(r.condition)+'）':'')+'</td><td>'+escape(r.to)+'</td><td><ul>'+quoteList(r.evidence)+'</ul></td></tr>').join("")
   +'</tbody></table>'
  :'<p class="notice">缺少足够的已核实关系证据：不绘制跨模块箭头。</p>';
 const localStyles=[
  "html{box-sizing:border-box;background:#fff}*,*::before,*::after{box-sizing:inherit}",
  "body{max-width:1180px;margin:0 auto;padding:23px 18px;color:#344054;font:14px/1.75 system-ui,'Microsoft YaHei',sans-serif;overflow-wrap:break-word}",
  "h1{font-size:23px;line-height:1.4;text-wrap:balance;max-width:100%;margin:0 0 12px}h2{font-size:17px;margin:25px 0 8px}",
  "header>p{margin:6px 0 12px}header small{color:#667085}",
  ".notice{padding:9px 12px;background:#f8fafc;border-left:3px solid #3a83f7;color:#475467}",
  ".genui-product-panorama{min-width:0;margin:22px 0}",
  ".genui-product-panorama .panorama-scroll{max-width:100%;width:100%}",
  ".genui-product-panorama .panorama-board{min-width:1000px}",
  ".genui-product-panorama .panorama-grid{grid-template-columns:1fr}",
  ".genui-product-panorama .panorama-modules{grid-template-columns:repeat(4,minmax(0,1fr))}",
  ".genui-product-panorama .panorama-gateway{margin:0 0 7px}",
  "table{border-collapse:collapse;max-width:100%;width:100%;font-size:12px;overflow-wrap:anywhere}",
  "th,td{padding:8px;border:1px solid #dfe5ed;text-align:left;vertical-align:top}th{background:#f8fafc}",
  "caption{text-align:left;font-weight:650;padding-bottom:8px}",
  ".evidence{margin:14px 0;padding:12px 18px;border:1px solid #dfe5ed;border-radius:8px}.evidence summary{font-weight:700;cursor:pointer}",
  "code{font-size:12px;background:#f4f6fb;padding:1px 3px}",
  "@media(max-width:540px){body{padding:15px 10px}h1{font-size:21px}table{display:block;overflow-x:auto}}",
  "@media print{@page{size:A3 landscape}body{max-width:none}.genui-product-panorama .panorama-scroll{overflow:visible}.genui-product-panorama .panorama-board{min-width:0}}"
 ].join("\n");
 return '<!doctype html><html lang="zh"><head>'
  +'<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; object-src \'none\'; base-uri \'none\'">'
  +'<title>'+escape(c.id)+' · 待独立语义复核的架构图</title>'
  +'<style>'+styles+"\n"+localStyles+'</style></head><body>'
  +'<header><h1>'+escape(c.id)+' · 产品能力全景图</h1>'
  +'<p class="notice">此图仅根据已提交文档映射模块；来源引文结构检查不等于独立语义审查、生产部署核实或 Skill 激活验证。</p>'
  +'<p><small>来源提交：<code>'+escape(metadata.commit.slice(0,12))+'</code>｜文档：'+metadata.sources.map(f=>'<code>'+escape(f.file)+'</code>').join("、")+'｜状态：'+escape(c.status)+'</small></p>'
  +'<p>'+escape(c.notes||"无额外证据说明")+'</p></header>'
  +'<section class="genui-product-panorama" data-unseen-panorama="'+escape(c.id)+'">'
  +'<h2 class="panorama-heading">来源对应的能力分层</h2>'
  +'<p class="panorama-lede">根据真实文档组织 '+c.layers.length+' 层、'+moduleCount+' 个模块；没有来源的产品入口、侧栏和关系均不虚构。</p>'
  +'<div class="panorama-scroll" role="region" tabindex="0" aria-label="架构全景：窄屏在图内横向滚动"><div class="panorama-board">'
  +'<div class="panorama-grid"><div class="panorama-body"><div class="panorama-gateway">Skill 文档能力映射 · 非运行时 API 入口</div>'+bands+'</div></div>'
  +'<div class="panorama-legend">已校验文件引文存在，不代表来源语义支持已经独立复核</div></div></div></section>'
  +'<section><h2>模块之间的关系</h2>'+relations+'</section>'
  +'<details class="evidence"><summary>查看每个模块的引用证据</summary><ol>'+evidence+'</ol></details>'
  +'<footer><p><small>结构校验不代表真实模型执行、语义正确、生产上线或真人阅读效率验证。</small></p></footer>'
  +'</body></html>';
}
