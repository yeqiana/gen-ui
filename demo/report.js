/* Gen UI HTML report example: data is untrusted, no network or model-side execution. */
(function () {
"use strict";
const SIZES=[20,50,100], STATUSES=["success","failure","pending"], SVG="http://www.w3.org/2000/svg";
function object(x){return !!x && typeof x==="object" && !Array.isArray(x)}
function keys(x,allowed){if(!object(x))throw Error("Expected object");for(const k of Object.keys(x))if(!allowed.includes(k))throw Error("Unknown field: "+k)}
function text(x,max){if(typeof x!=="string"||!x.trim()||x.length>max)throw Error("Invalid text")}
function validateReport(x){
  keys(x,["version","title","rows"]);
  if(x.version!=="gen-ui-html-report/v1")throw Error("Unsupported report version");
  text(x.title,100);
  if(!Array.isArray(x.rows)||x.rows.length>1000)throw Error("Maximum 1000 rows");
  const ids=new Set();
  x.rows.forEach(row=>{
    keys(row,["id","module","status","durationMs","batch"]);
    text(row.id,40);text(row.module,40);
    if(ids.has(row.id))throw Error("Duplicate id");ids.add(row.id);
    if(!STATUSES.includes(row.status))throw Error("Unknown status");
    if(typeof row.durationMs!=="number"||!Number.isFinite(row.durationMs)||row.durationMs<0||row.durationMs>1000000)throw Error("Invalid duration");
    if(!Number.isInteger(row.batch)||row.batch<1||row.batch>12)throw Error("Invalid batch");
  });
  return x;
}
function filterRows(rows,f){
 const q=String(f.query||"").toLowerCase().trim();
 return rows.filter(row=>(!q||row.id.toLowerCase().includes(q)||row.module.toLowerCase().includes(q))&&
   (!f.status||f.status==="all"||f.status===row.status)&&(!f.slowOnly||row.durationMs>f.threshold));
}
function paginateRows(rows,page,size){
 if(!SIZES.includes(size))throw Error("Page size must be 20, 50 or 100");
 const pages=Math.max(1,Math.ceil(rows.length/size)),current=Math.max(1,Math.min(pages,Math.trunc(page)||1)),start=(current-1)*size;
 return {rows:rows.slice(start,start+size),page:current,pages,total:rows.length,first:rows.length?start+1:0,last:Math.min(start+size,rows.length)};
}
function summarize(rows,threshold){
 const r={total:rows.length,success:0,failure:0,pending:0,slow:0};
 for(const row of rows){r[row.status]++;if(row.durationMs>threshold)r.slow++}return r;
}
function groupModules(rows){
 const m=new Map();for(const row of rows)m.set(row.module,(m.get(row.module)||0)+1);
 const list=[...m].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
 return list.length<=8?list:[...list.slice(0,7),["Other",list.slice(7).reduce((s,r)=>s+r[1],0)]];
}
function batchSeries(rows){
 const out=Array.from({length:12},(_,i)=>({batch:i+1,count:0}));for(const r of rows)out[r.batch-1].count++;return out;
}
function sample(){
 const modules=["Gateway","Auth","Billing","Workflow"];
 return {version:"gen-ui-html-report/v1",title:"Build Verification Report — Sample Data",
 rows:Array.from({length:67},(_,i)=>({id:"T-"+String(i+1).padStart(3,"0"),module:modules[i%4],
 status:i%11===0?"failure":i%13===0?"pending":"success",durationMs:90+(i*71)%1050,batch:i%12+1}))};
}
if(typeof module!=="undefined"&&module.exports)module.exports={SIZES,validateReport,filterRows,paginateRows,summarize,groupModules,batchSeries,sample};
if(typeof document==="undefined")return;
const app=document.querySelector("[data-report-app]");if(!app)return;
const id=x=>document.getElementById(x);
function node(tag,label,className){const n=document.createElement(tag);if(label!==undefined)n.textContent=String(label);if(className)n.className=className;return n}
function shape(tag,attrs,label){const n=document.createElementNS(SVG,tag);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(label!==undefined)n.textContent=String(label);return n}
function graph(viewBox,description){return shape("svg",{viewBox,role:"img","aria-label":description})}
let report=sample(),page=1;
const f={query:"",status:"all",slowOnly:false,threshold:600,size:20};
function pie(rows){
 const s=summarize(rows,f.threshold),parts=[["success",s.success,"#16803a"],["failure",s.failure,"#b42318"],["pending",s.pending,"#64748b"]];
 const g=graph("0 0 300 200","Status: "+parts.map(p=>p[0]+" "+p[1]).join(", "));let a=-Math.PI/2; if(!s.total)g.append(shape("text",{x:93,y:97,"text-anchor":"middle",fill:"#58677b","font-size":12},"No data"));
 for(const [name,count,color] of parts){if(!count)continue;const sweep=2*Math.PI*count/s.total;
 if(count===s.total)g.append(shape("circle",{cx:93,cy:95,r:72,fill:color}));
 else{const x1=93+72*Math.cos(a),y1=95+72*Math.sin(a),x2=93+72*Math.cos(a+sweep),y2=95+72*Math.sin(a+sweep);
 g.append(shape("path",{d:"M 93 95 L "+x1+" "+y1+" A 72 72 0 "+(sweep>Math.PI?1:0)+" 1 "+x2+" "+y2+" Z",fill:color}))}a+=sweep}
 parts.forEach((p,i)=>{g.append(shape("rect",{x:185,y:42+44*i,width:10,height:10,fill:p[2]}));
 g.append(shape("text",{x:202,y:51+44*i,fill:"#283548","font-size":12},p[0]+": "+p[1]))});
 id("pie").replaceChildren(g,node("figcaption","Status distribution; reflects current filters"));
}
function bar(rows){
 const groups=groupModules(rows),max=Math.max(1,...groups.map(x=>x[1])),g=graph("0 0 420 200","Module counts: "+groups.map(x=>x.join(" ")).join(", ")),slot=380/Math.max(groups.length,1); if(!groups.length){g.append(shape("text",{x:210,y:100,"text-anchor":"middle",fill:"#58677b","font-size":12},"No data"));id("bar").replaceChildren(g,node("figcaption","No matching records"));return;}
 groups.forEach(([name,count],i)=>{const x=18+i*slot,w=Math.min(36,slot-8),h=126*count/max;
 g.append(shape("rect",{x,y:157-h,width:w,height:h,rx:2,fill:"#475cbb"}));
 g.append(shape("text",{x:x+w/2,y:152-h,fill:"#283548","text-anchor":"middle","font-size":11},count));
 g.append(shape("text",{x:x+w/2,y:178,fill:"#465467","text-anchor":"middle","font-size":10},name.slice(0,9)))});
 g.append(shape("line",{x1:12,x2:411,y1:157,y2:157,stroke:"#a0aaba"}));
 id("bar").replaceChildren(g,node("figcaption","Counts by module; top seven + Other if needed"));
}
function line(rows){
 const data=batchSeries(rows),max=Math.max(1,...data.map(x=>x.count)),g=graph("0 0 420 200","Batch counts: "+data.map(x=>x.batch+"="+x.count).join(", "));
 const x=b=>30+(b-1)*33,y=v=>153-120*v/max; if(!rows.length){g.append(shape("text",{x:210,y:85,"text-anchor":"middle",fill:"#58677b","font-size":12},"No data"));id("line").replaceChildren(g,node("figcaption","No matching records"));return;}
 g.append(shape("line",{x1:25,x2:400,y1:153,y2:153,stroke:"#a0aaba"}));
 g.append(shape("path",{d:data.map((p,i)=>(i?"L ":"M ")+x(p.batch)+" "+y(p.count)).join(" "),fill:"none",stroke:"#475cbb","stroke-width":3}));
 data.forEach(p=>{g.append(shape("circle",{cx:x(p.batch),cy:y(p.count),r:3,fill:"#364bb0"}));
 g.append(shape("text",{x:x(p.batch),y:174,"text-anchor":"middle","font-size":10,fill:"#465467"},p.batch))});
 id("line").replaceChildren(g,node("figcaption","Records by batch (1–12)"));
}
function render(){
 const rows=filterRows(report.rows,f),stats=summarize(rows,f.threshold);
 id("report-title").textContent=report.title;
 for(const key of ["total","success","failure","pending","slow"])id("count-"+key).textContent=stats[key].toLocaleString("en-US");
 id("filter-count").textContent="Showing "+rows.length+" of "+report.rows.length+" records";
 id("threshold-value").textContent=f.threshold+" ms";
 const result=paginateRows(rows,page,f.size);page=result.page;const body=id("report-rows");body.replaceChildren();
 for(const row of result.rows){const tr=node("tr"),st=node("td");st.append(node("span",row.status,"status "+row.status));
 tr.append(node("td",row.id),node("td",row.module),st,node("td",row.durationMs+" ms"),node("td","Batch "+row.batch));body.append(tr)}
 if(!result.rows.length){const tr=node("tr"),td=node("td","No matching rows");td.colSpan=5;tr.append(td);body.append(tr)}
 id("page-info").textContent=result.first+"–"+result.last+" of "+result.total+" · page "+page+"/"+result.pages;
 id("previous").disabled=page===1;id("next").disabled=page===result.pages;pie(rows);bar(rows);line(rows);
}
function bind(name,type,fn){id(name).addEventListener(type,fn)}
bind("keyword","input",e=>{f.query=e.target.value;page=1;render()});
bind("status","change",e=>{f.status=e.target.value;page=1;render()});
bind("slow-only","change",e=>{f.slowOnly=e.target.checked;page=1;render()});
bind("threshold","input",e=>{f.threshold=Number(e.target.value);page=1;render()});
bind("page-size","change",e=>{const v=Number(e.target.value);if(!SIZES.includes(v))return;f.size=v;page=1;render()});
bind("previous","click",()=>{page--;render()});bind("next","click",()=>{page++;render()});
bind("nav-mode","change",e=>{app.dataset.navigation=e.target.value==="top"?"top":"left"});
const json=id("report-json");json.value=JSON.stringify(report,null,2);
bind("apply-json","click",()=>{const status=id("json-status");try{
 if(json.value.length>200000)throw Error("Input exceeds 200,000 characters");
 const data=validateReport(JSON.parse(json.value));report=data;page=1;render();
 status.textContent="Validated and rendered locally; no network request.";status.dataset.kind="ok";
 }catch(error){status.textContent="Invalid report JSON: "+String(error.message||error);status.dataset.kind="error"}});
render();
})();
