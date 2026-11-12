/* GEN-UI compact workflow: connector span responds to actual label glyph widths. */
"use strict";
(() => {
 function layout(root=document.getElementById("flow-svg")){
  if(!root)return false;
  const nodes=[...root.querySelectorAll(".flow-nodes > g")];
  const edges=[...root.querySelectorAll(".flow-edges > path")];
  const chips=[...root.querySelectorAll(".flow-edge-labels > g")];
  if(nodes.length<2||edges.length!==nodes.length-1||chips.length!==edges.length)return false;
  let x=8;
  const measures=nodes.map(group=>{
   const rect=group.querySelector("rect"),texts=[...group.querySelectorAll(":scope > text")];
   if(!rect||!texts.length)return null;
   const originalX=Number(rect.getAttribute("x")),originalW=Number(rect.dataset.originalWidth||(rect.dataset.originalWidth=rect.getAttribute("width")));
   const measured=Math.max(originalW,...texts.map(t=>Math.ceil(t.getComputedTextLength())+24));
   return {group,rect,texts,originalX,width:measured,left:0};
  });
  if(measures.some(x=>!x))return false;
  const labels=chips.map(chip=>{
   const bg=chip.querySelector("rect"),text=chip.querySelector("text");
   if(!bg||!text)return null;
   return {bg,text,width:Math.max(34,Math.ceil(text.getComputedTextLength())+18)};
  });
  if(labels.some(x=>!x))return false;
  for(let i=0;i<measures.length;i++){
   const n=measures[i];n.left=x;
   n.group.setAttribute("transform","translate("+(n.left-n.originalX)+" 0)");
   n.rect.setAttribute("width",n.width);
   n.texts.forEach(t=>t.setAttribute("x",n.originalX+n.width/2));
   x+=n.width;
   if(i<labels.length)x+=Math.max(72,labels[i].width+28);
  }
  for(let i=0;i<edges.length;i++){
   const a=measures[i],b=measures[i+1],label=labels[i];
   const start=a.left+a.width+6,end=b.left-9,center=(start+end)/2;
   edges[i].setAttribute("d","M"+start+" 108 H"+end);
   edges[i].dataset.arrowDirection="right";
   label.bg.setAttribute("x",center-label.width/2);
   label.bg.setAttribute("y","78");
   label.bg.setAttribute("width",label.width);
   label.bg.setAttribute("height","21");
   label.text.setAttribute("x",center);
   label.text.setAttribute("y","92");
   label.bg.dataset.labelWidth=String(label.width);
   edges[i].dataset.labelWidth=String(label.width);
   edges[i].dataset.connectorLength=String(end-start);
  }
  const width=Math.ceil(x+8);
  root.setAttribute("viewBox","0 0 "+width+" 180");
  root.setAttribute("width",String(width));
  // Fit should preserve readable text: oversized diagrams scroll inside the canvas.
  root.style.minWidth=Math.ceil(width*0.9)+"px";
  root.dataset.adaptiveConnections="true";
  if(root.id==="flow-svg")window.GenUIFlow?.refreshBase?.();
  return true;
 }
 const init=()=>{
  layout();
  // Keep the fitted viewBox stable once the zoom/pan controller captures it.
 };
 if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
  window.GenUIFlowLabelLayout={layout};
 }
})();
