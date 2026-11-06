/* 离线页码组件：保留语义化按钮，兼容键盘及窄屏。 */
(function(){
 "use strict";
 function render(container,paging,onChange){
  if(!container)return;
  const pages=paging.pages,current=paging.page;
  const proposed=new Set([1,pages,current]);
  for(let n=current-2;n<=current+2;n++)if(n>=1&&n<=pages)proposed.add(n);
  if(current<=3)for(let n=1;n<=Math.min(5,pages);n++)proposed.add(n);
  if(current>=pages-2)for(let n=Math.max(1,pages-4);n<=pages;n++)proposed.add(n);
  const numbers=[...proposed].sort((a,b)=>a-b);
  container.replaceChildren();
  let previous=0;
  for(const n of numbers){
   if(n-previous>1){
    const gap=document.createElement("span");gap.className="page-gap";gap.textContent="…";gap.setAttribute("aria-hidden","true");container.append(gap);
   }
   const button=document.createElement("button");
   button.type="button";button.className="page-number";button.textContent=String(n);
   button.setAttribute("aria-label","第 "+n+" 页");
   if(n===current)button.setAttribute("aria-current","page");
   button.addEventListener("click",()=>onChange(n));
   container.append(button);previous=n;
  }
 }
 window.GenUIPager={render};
})();
