/* 离线 SVG 图表，使用统一主题色与适量多彩分类。 */
(function(){
 "use strict";
 const NS="http://www.w3.org/2000/svg";
 const palette=["#5470c6","#91cc75","#fac858","#ee6666","#73c0de","#3ba272","#fc8452","#9a60b4"];
 const statusColors=["#67c23a","#f56c6c","#e6a23c"];
 const node=(name,attrs,content)=>{
  const el=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs||{}))el.setAttribute(key,String(value));
  if(content!==undefined)el.textContent=String(content);
  return el;
 };
 function svg(viewBox,label){
  const el=node("svg",{viewBox,role:"img","aria-label":label,class:"report-chart-svg"});
  el.append(node("title",{},label));return el;
 }
 function caption(text){const e=document.createElement("figcaption");e.textContent=text;return e;}
 function label(svg,text,x,y,extra={}){
  svg.append(node("text",{x,y,fill:"#606266","font-size":11,"font-family":"system-ui, sans-serif",...extra},text));
 }
 function noData(target,title,viewBox,x,y){
  const plot=svg(viewBox,title);label(plot,"暂无符合条件的数据",x,y,{"text-anchor":"middle",fill:"#909399","font-size":13});
  target.replaceChildren(plot,caption("没有符合条件的记录"));return true;
 }
 function pie(target,stats){
  const total=stats.total;
  const data=[["成功",stats.success],["失败",stats.failure],["待处理",stats.pending]];
  if(!total)return noData(target,"状态构成","0 0 350 220",175,110);
  const plot=svg("0 0 350 220","状态构成："+data.map(d=>d[0]+d[1]+"条").join("，"));
  const cx=115,cy=106,r=73,circumference=2*Math.PI*r;
  plot.append(node("circle",{cx,cy,r,fill:"none",stroke:"#f0f2f5","stroke-width":27}));
  let angle=0;
  data.forEach(([name,count],i)=>{
   if(!count)return;
   const percentage=count/total;
   const slice=node("circle",{cx,cy,r,fill:"none",stroke:statusColors[i],
    "stroke-width":27,"stroke-dasharray":(circumference*percentage)+" "+circumference,
    "stroke-dashoffset":-circumference*angle,"transform":"rotate(-90 115 106)","stroke-linecap":"butt"});
   slice.append(node("title",{},name+": "+count+" 条，占 "+(percentage*100).toFixed(1)+"%"));
   plot.append(slice);angle+=percentage;
  });
  label(plot,"总记录",cx,103,{"text-anchor":"middle","font-size":12,fill:"#909399"});
  label(plot,total,cx,126,{"text-anchor":"middle","font-size":24,"font-weight":750,fill:"#303133"});
  data.forEach(([name,count],i)=>{
   const y=65+i*42;plot.append(node("rect",{x:231,y:y-10,width:10,height:10,rx:2,fill:statusColors[i]}));
   label(plot,name,249,y,{fill:"#606266","font-size":12});
   label(plot,count,319,y,{"text-anchor":"end",fill:"#303133","font-size":12,"font-weight":650});
  });
  target.replaceChildren(plot,caption("各状态占比 · 按当前筛选结果"));
 }
 function bar(target,groups){
  if(!groups.length)return noData(target,"模块记录数量","0 0 430 235",215,108);
  const max=Math.max(1,...groups.map(g=>g[1]));
  const chart=svg("0 0 430 235","模块记录数量："+groups.map(g=>g[0]+g[1]+"条").join("，"));
  const baseY=183,top=24,chartH=148;
  for(let i=0;i<=4;i++){
   const y=baseY-(i*chartH/4);
   chart.append(node("line",{x1:30,x2:416,y1:y,y2:y,stroke:"#ebeef5","stroke-width":1}));
   label(chart,Math.round(max*i/4),24,y+4,{"text-anchor":"end",fill:"#a8abb2","font-size":9});
  }
  const spacing=380/groups.length;
  groups.forEach(([name,count],i)=>{
   const w=Math.min(44,spacing-13),x=38+i*spacing+(spacing-w)/2,h=chartH*count/max;
   const rect=node("rect",{x,y:baseY-h,width:w,height:h,rx:4,fill:palette[i%palette.length]});
   rect.append(node("title",{},name+": "+count+" 条"));chart.append(rect);
   label(chart,count,x+w/2,baseY-h-7,{"text-anchor":"middle","font-size":11,fill:"#606266"});
   label(chart,name.slice(0,5),x+w/2,207,{"text-anchor":"middle","font-size":9,fill:"#909399"});
  });
  target.replaceChildren(chart,caption("模块记录数量对比"));
 }
 function line(target,series,total){
  if(!total)return noData(target,"批次走势","0 0 430 235",215,108);
  const plot=svg("0 0 430 235","执行批次走势："+series.map(x=>x.batch+"批"+x.count+"条").join("，"));
  const ymax=Math.max(1,...series.map(x=>x.count)),baseY=182,top=29,height=145;
  for(let i=0;i<=4;i++){
   const y=baseY-i*height/4;
   plot.append(node("line",{x1:34,x2:408,y1:y,y2:y,stroke:"#ebeef5","stroke-width":1}));
   label(plot,Math.round(ymax*i/4),25,y+4,{"text-anchor":"end","font-size":9,fill:"#a8abb2"});
  }
  const x=i=>39+i*32.7,y=count=>baseY-height*count/ymax;
  const path=series.map((entry,i)=>(i?"L":"M")+x(i).toFixed(2)+","+y(entry.count).toFixed(2)).join(" ");
  const area=path+" L "+x(series.length-1)+","+baseY+" L "+x(0)+","+baseY+" Z";
  plot.append(node("path",{d:area,fill:"#ecf5ff",stroke:"none"}));
  plot.append(node("path",{d:path,fill:"none",stroke:"#409eff","stroke-width":3,"stroke-linejoin":"round","stroke-linecap":"round"}));
  series.forEach((entry,i)=>{
   const point=node("circle",{cx:x(i),cy:y(entry.count),r:4,fill:"#fff",stroke:"#409eff","stroke-width":2});
   point.append(node("title",{},"第 "+entry.batch+" 批："+entry.count+" 条"));plot.append(point);
   label(plot,entry.batch,x(i),209,{"text-anchor":"middle","font-size":9,fill:"#909399"});
  });
  target.replaceChildren(plot,caption("按执行批次排序的记录数"));
 }
 window.GenUICharts={pie,bar,line,palette};
})();
