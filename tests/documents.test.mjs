import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const docs=["project-analysis","architecture-design","implementation-plan","test-acceptance"];
const read=f=>fs.readFileSync(path.join(root,f),"utf8");
test("Four standalone technical document HTML deliverables exist",()=>{
 for(const id of docs){
  const f="demo/documents/"+id+".html",t=read(f);
  assert.match(t,/<!doctype html>/i);
  assert.match(t,/<html lang="zh-CN">/i);
  assert.match(t,/<main class="doc-main">/);
  assert.match(t,/<h1[ >]/);
  assert.ok((t.match(/<section class="doc-section"/g)||[]).length>=7,id+" has too few sections");
  assert.match(t,/<table[ >]/);
  assert.match(t,/<svg viewBox=/);
  assert.match(t,/data-diagram/);
  assert.doesNotMatch(t,/<script\s+[^>]*src\s*=\s*["']?https?:/i);
  assert.doesNotMatch(t,/<link[^>]+href=["']https?:/i);
  assert.doesNotMatch(t,/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  const preview=fs.readFileSync(path.join(root,"demo/documents/assets",id+"-preview.png"));
  assert.ok(preview.byteLength>8000,id+" preview image too small");
  assert.equal(preview.toString("hex",0,8),"89504e470d0a1a0a");
  assert.match(t,/非真实项目|示例|未执行|待评审/);
 }
});
test("Document gallery links all articles and shared offline assets",()=>{
 const gallery=read("demo/documents/index.html");
 for(const id of docs)assert.match(gallery,new RegExp('href="'+id+'\\.html"'));
 for(const f of ["demo/documents/assets/document.css","demo/documents/assets/document.js"])assert.ok(fs.existsSync(path.join(root,f)));
});
test("Article navigation, diagrams and code examples are structurally complete",()=>{
 for(const id of docs){
  const t=read("demo/documents/"+id+".html");
  const ids=[...t.matchAll(/<section class="doc-section" id="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ids)assert.match(t,new RegExp('href="#'+id+'"'));
  assert.match(t,/data-zoom-in/);assert.match(t,/data-zoom-out/);assert.match(t,/data-fit/);assert.match(t,/data-fullscreen/);
  assert.match(t,/<pre><code class="language-/);
 }
});
test("No previous product-UI mockup showcase remains in the public entrypoints",()=>{
 const zh=read("README.zh-CN.md"),en=read("README.md");
 assert.match(zh,/项目分析报告/);assert.match(zh,/系统架构设计方案/);assert.match(zh,/技术实施方案/);assert.match(zh,/测试与验收方案/);
 assert.match(en,/Project analysis/);assert.match(en,/architecture design/i);assert.doesNotMatch(zh,/TV 启动器|StoryOS 工作台演示截图|五个独立案例/);
 assert.doesNotMatch(en,/TV launcher HTML concept|Five offline HTML showcases/);
});


test("Four documents carry second-precision report metadata and the actual personal-mark favicon",()=>{
 for(const id of docs){
  const f="demo/documents/"+id+".html",h=read(f);
  const fav=h.match(/<link rel="icon"[^>]*href="([^"]+)"/);
  assert.ok(fav,id+" missing local icon");
  assert.ok(!/^https?:/i.test(fav[1]),id+" remote favicon");
  const absolute=path.resolve(root,"demo/documents",fav[1]);
  assert.ok(fs.existsSync(absolute),id+" favicon path invalid: "+absolute);
  assert.match(fs.readFileSync(absolute,"utf8"),/<svg/);
  assert.match(h,/<time class="generated-at" datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00">/);
  for(const attr of ["data-zoom-in","data-zoom-out","data-fit","data-fullscreen"]){
   const b=h.match(new RegExp('<button[^>]*'+attr+'[^>]*>.*?<\\/button>'))?.[0];
   assert.ok(b,id+" missing icon button "+attr);
   assert.match(b,/aria-label="[^"]+"/);assert.match(b,/title="[^"]+"/);assert.match(b,/<svg/);
  }
 }
});
test("Public report has source links at the bottom and never treats local paths as external",()=>{
 const h=read("demo/report.html"),at=h.indexOf('id="references"'),footer=h.indexOf('class="page-footer"');
 assert.ok(at>0&&footer>at);
 assert.match(h,/<time id="generated-at" datetime="\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00"/);
 assert.match(h,/<details id="status-multi"/);
 assert.match(h,/<details id="column-picker"/);
 const external=[...h.matchAll(/<a class="external-link" href="([^"]+)" target="_blank" rel="noopener noreferrer"/g)];
 assert.ok(external.length>=2);
 assert.ok(external.every(x=>/^https:\/\//.test(x[1])));
 assert.doesNotMatch(h,/新标签页打开/);
});


test("English README links only English HTML examples and English screenshots",()=>{
  const en=read("README.md"),zh=read("README.zh-CN.md");
  assert.match(en,/Information design, not UI decoration/);
  assert.match(zh,/不是单纯美化 UI/);
  assert.doesNotMatch(en,/GEO|search ranking|SEO/i);
  assert.doesNotMatch(zh,/GEO|搜索排名|SEO/i);
  for(const id of docs){
    const english="demo/documents/en/"+id+".html";
    assert.ok(en.includes("]("+english+")"),"English README missing "+english);
    assert.ok(!zh.includes("]("+english+")"),"Chinese README should not link to English examples");
    assert.ok(zh.includes("](demo/documents/"+id+".html)"),"Chinese README missing Chinese document "+id);
    const englishImage="demo/documents/assets/en-"+id+"-preview.png";
    const chineseImage="demo/documents/assets/"+id+"-preview.png";
    assert.ok(en.includes(englishImage),"English preview missing "+id);
    assert.ok(zh.includes(chineseImage),"Chinese preview missing "+id);
    const h=read(english);
    assert.match(h,/<html lang="en">/);
    assert.match(h,/<main class="doc-main">/);
    assert.ok((h.match(/class="doc-section"/g)||[]).length>=5,"English content too short "+id);
    assert.ok((h.match(/<table>/g)||[]).length>=1,"English evidence table missing "+id);
    assert.doesNotMatch(h,/[一-鿿]/,"English page contains Chinese text "+id);
    const image=fs.readFileSync(path.join(root,englishImage));
    assert.ok(image.length>8000,"English screenshot too small "+id);
    assert.equal(image.toString("hex",0,8),"89504e470d0a1a0a");
  }
});
test("Chinese report demonstrates all ten information-design use cases",()=>{
  const html=read("demo/report.html"),style=read("demo/report-refinements.css");
  const cases=["answer","compare","process","review","plan","test","triage","host","guide","features"];
  for(const id of cases){
    assert.ok(html.includes('id="case-'+id+'"'),"missing case "+id);
    assert.ok(html.includes('href="#case-'+id+'"'),"case navigation missing "+id);
  }
  assert.ok(html.includes('id="showcase"'));
  assert.match(html,/原始回答（反例）/);
  assert.match(html,/class="before-after"/);
  assert.match(html,/id="case-features"/);
  assert.match(html,/class="language-sql"/);
  assert.match(html,/id="status-multi"/);
  assert.match(html,/id="column-picker"/);
  assert.match(html,/id="flow-fullscreen"/);
  assert.match(style,/\.case-directory/);
  const snap=fs.readFileSync(path.join(root,"demo/assets/report-information-design-preview.png"));
  assert.ok(snap.length>8000);
  assert.equal(snap.toString("hex",0,8),"89504e470d0a1a0a");
});
test("Skill focuses on reading comprehension rather than UI decoration",()=>{
 const skill=read("SKILL.md");
 assert.match(skill,/Information Design Skill/);
 assert.match(skill,/walls of text and reading friction/);
 assert.match(skill,/Reader-first transformation procedure/);
 assert.match(skill,/Choose the smallest effective structure/);
 assert.ok(fs.existsSync(path.join(root,"examples/code-review.zh-CN.md")));
 assert.ok(fs.existsSync(path.join(root,"examples/acceptance-plan.zh-CN.md")));
});

test("English case gallery has ten real, English-language information-design examples",()=>{
 const h=read("demo/report.en.html"),en=read("README.md");
 assert.match(h,/<html lang="en">/);
 const ids=["answer","compare","steps","review","planning","test","triage","host","documents","interaction"];
 for(const id of ids){assert.ok(h.includes('id="'+id+'"'),id);assert.ok(h.includes('href="#'+id+'"'),"missing English nav "+id);}
 assert.doesNotMatch(h,/[一-鿿]/);
 assert.match(h,/Before/);
 assert.match(h,/class="language-sql"/);
 assert.match(h,/Not run/);
 assert.ok(en.includes("demo/report.en.html"));
 assert.ok(en.includes("demo/documents/assets/en-report-preview.png"));
 const img=fs.readFileSync(path.join(root,"demo/documents/assets/en-report-preview.png"));
 assert.ok(img.length>8000);
 assert.equal(img.toString("hex",0,8),"89504e470d0a1a0a");
});
