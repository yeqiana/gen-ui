import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {evaluate, flagsWrongCoverageUpperBound} from "../evals/score-fresh-semantic.mjs";
import {classify} from "../evals/score-skill-discovery.mjs";

const fixture=JSON.parse(fs.readFileSync(new URL("../evals/semantic-fresh-cases-2026-11-16.json",import.meta.url),"utf8"));
test("固定题库均为新案例且包含多轮评审、范围授权和短解释",()=>{
 assert.equal(fixture.version,"fresh-semantic/v1");
 assert.equal(fixture.cases.length,5);
 assert.equal(new Set(fixture.cases.map(x=>x.id)).size,fixture.cases.length);
 for(const c of fixture.cases){assert.ok(c.prompt.length>40,c.id);assert.ok(c.must.length>=2,c.id)}
 assert.ok(fixture.cases.some(x=>x.category==="continuity"));
 assert.ok(fixture.cases.some(x=>x.category==="density"));
});
test("可观测成功调用必须是 gen-ui；其他 Skill 不混算，失败读取不算加载",()=>{
 const es=[
  {type:"system",subtype:"init",skills:["gen-ui"]},
  {type:"assistant",message:{content:[
   {type:"tool_use",id:"a",name:"Skill",input:{skill:"code-pact"}},
   {type:"tool_use",id:"b",name:"Read",input:{file_path:"D:\\skills\\gen-ui\\references\\reading-layers.md"}}
  ]}},
  {type:"user",message:{content:[{type:"tool_result",tool_use_id:"b",is_error:true,content:"Permission denied"}]}}
 ];
 const a=classify(es);
 assert.equal(a.genUiTool,0);
 assert.equal(a.otherSkill,1);
 assert.equal(a.loadedRef,0);
 assert.equal(a.deniedRef,1);
 assert.equal(a.observedActivation,false);
});
test("来源一致不能证明会议的运行归属",()=>{
 const answer="暂不收口：口头声明20/20，日志记录19/20。X和Y的SHA-256相同，不能证明会议纪要引用的是X，也不能确认同一次运行。失败根因未知。";
 const r=evaluate("artifact-provenance",answer);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("内部授权不会外推至对外 Beta，代码合并不等于安全验证",()=>{
 const answer="不能放行对外Beta。I7只获得36小时、内部员工、预发布环境授权，对外前须修复。A4安全负向用例未执行，生产越权是否实际发生无法确认。";
 const r=evaluate("limited-beta-approval",answer);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("45/45 是已测通过率，45/60 是覆盖率；未测不是失败",()=>{
 const answer="不能宣称全部100%通过。实际45/45已测通过，全范围覆盖45/60。余下15份未测，其中5份排期、10份状态不明，未测不是失败，也不算通过。";
 const r=evaluate("partial-coverage",answer);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("续接时不把第4轮文档当执行证据，也不擅自接受风险",()=>{
 const answer="不能收口。T1修复代码已提交但缺断电恢复测试；T2实现状态未确认仍需证据；T3并发注入2/5失败且根因未知。用户未接受风险，待补实测。";
 const r=evaluate("cross-round",answer);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});
test("简单 RAG 问题只用短答而非表格或 HTML",()=>{
 const answer="Embedding 把文本转换成语义向量，决定信息怎样表示。向量索引组织这些向量以加速近邻检索，决定怎样高效找到相关内容。";
 const r=evaluate("rag-short-answer",answer);
 assert.ok(Object.values(r).every(Boolean),JSON.stringify(r));
});

test("后验算术警报：不能把已测覆盖率当成未测全部通过后的上限",()=>{
 const bad="全范围通过率无法计算：15份没有执行记录，通过数上限是45/60=75%，这是假设未测全过的上限。";
 const good="已测覆盖率45/60=75%；如果剩余15份全部通过，最终才可能为60/60=100%，当前不能预先认定通过。";
 assert.equal(flagsWrongCoverageUpperBound(bad),true);
 assert.equal(flagsWrongCoverageUpperBound(good),false);
});
