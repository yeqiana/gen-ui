import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {classify,basicNovelScore} from "../evals/score-skill-discovery.mjs";

test("其他 Skill 调用不能算 GEN-UI 激活，拒绝读取不能算成功",()=>{
 const events=[
  {type:"system",subtype:"init",skills:["gen-ui","ai-coding-collaboration"]},
  {type:"assistant",message:{content:[
   {type:"tool_use",id:"s1",name:"Skill",input:{skill:"ai-coding-collaboration"}},
   {type:"tool_use",id:"r1",name:"Read",input:{file_path:"C:\\Users\\tester\\.claude\\skills\\gen-ui\\references\\reading-layers.md"}}
  ]}},
  {type:"user",message:{content:[{type:"tool_result",tool_use_id:"r1",is_error:true,content:"Permission denied"}]}}
 ];
 const r=classify(events);
 assert.equal(r.available,true);
 assert.equal(r.genUiTool,0);
 assert.equal(r.otherSkill,1);
 assert.equal(r.deniedRef,1);
 assert.equal(r.loadedRef,0);
 assert.equal(r.observedActivation,false);
});
test("只有真实 GEN-UI 调用或成功读取其规则才计可观测激活",()=>{
 const base={type:"assistant",message:{content:[{type:"tool_use",id:"read1",name:"Read",input:{file_path:"D:\\repo\\.claude\\skills\\gen-ui\\references\\reading-layers.md"}}]}};
 const yes=classify([base,{type:"user",message:{content:[{type:"tool_result",tool_use_id:"read1",content:"reference contents"}]}}]);
 assert.equal(yes.loadedRef,1);
 assert.equal(yes.observedActivation,true);
 const invoked=classify([{type:"assistant",message:{content:[{type:"tool_use",id:"g",name:"Skill",input:{skill:"gen-ui"}}]}}]);
 assert.equal(invoked.genUiTool,1);
 assert.equal(invoked.observedActivation,true);
});
test("新题将文件同一性与证据来源分开，不擅自放行",()=>{
 const s="不能收口。会议纪要的 20/20 没有来源日志，B 的原始结果是 19/20；SHA-256 相等不能证明纪要引用的是 X 或 Y。本轮未重跑扫描，需补证。";
 const r=basicNovelScore({id:"hash-lineage"},s);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("限定 48 小时沙盒接受并非生产风险豁免",()=>{
 const s="L7 的 48 小时内部沙盒试用获得授权，正式生产发布前必须修复。P4 权限验证尚未重跑，不能说生产安全，生产不能放行。";
 const r=basicNovelScore({id:"limited-signoff"},s);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("核心 Skill 保持轻量，调用指引不要求给整个目录权限",()=>{
 const skill=fs.readFileSync(new URL("../SKILL.md",import.meta.url),"utf8");
 const doc=fs.readFileSync(new URL("../docs/claude-code-skill-loading.md",import.meta.url),"utf8");
 const reading=fs.readFileSync(new URL("../references/reading-layers.md",import.meta.url),"utf8");
 assert.ok(Buffer.byteLength(skill)<=5120);
 assert.match(doc,/--add-dir/);
 assert.match(doc,/\.claude\\skills\\gen-ui/);
 assert.match(doc,/不要授权整个用户主目录/);
 assert.match(reading,/相同 SHA-256 只证明被核对文件内容相同/);
 assert.match(reading,/不能自动证明口头摘要引用它/);
});
