(() => {
 const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 function initToc(){
  const links=$$(".toc-list a[href^='#']");if(!links.length)return;
  const sections=links.map(a=>$(a.getAttribute("href"))).filter(Boolean);
  if("IntersectionObserver"in window){
   const io=new IntersectionObserver(entries=>{
    const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];
    if(!visible)return;
    links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+visible.target.id));
   },{rootMargin:"-12% 0px -72% 0px"});
   sections.forEach(section=>io.observe(section));
  }
  links.forEach(a=>a.addEventListener("click",()=>{const d=$(".mobile-toc");if(d)d.open=false;}));
 }
 function initExternalLinks(){
  $$("a[href]").forEach(a=>{
   const href=(a.getAttribute("href")||"").trim();
   if(/^https?:\/\//i.test(href)){a.classList.add("external-link");a.target="_blank";a.rel="noopener noreferrer";}
   else{a.classList.remove("external-link");if(a.target==="_blank")a.removeAttribute("target");}
  });
 }
 document.addEventListener("DOMContentLoaded",()=>{initToc();initExternalLinks();});
})();
