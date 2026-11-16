#!/usr/bin/env node
// Deterministic diagnostic checks only: a "screen pass" is NOT semantic correctness.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {classify} from "./score-skill-discovery.mjs";

const sha=b=>crypto.createHash("sha256").update(b).digest("hex");
const rule=(s,r)=>r.test(s);
/** Post-hoc diagnostic only; does not change the frozen primary screen pass. */
export function flagsWrongCoverageUpperBound(text){
 const s=text.replace(/\s+/g," ");
 return /(?:假设|若|如果).{0,30}(?:未测|剩余|15).{0,30}(?:全过|通过|成功)/.test(s) && /(?:上限|最多).{0,40}(?:45\/60|75\s*%)|(?:45\/60|75\s*%).{0,40}(?:上限|最多)/.test(s);
}
export function evaluate(caseId,answer){
 const t=answer.replace(/\s+/g," ");
 const c={
  "artifact-provenance":()=>{
   return {
    hasBothCounts:rule(t,/20\/20/)&&rule(t,/19\/20/),
    namesHash:rule(t,/SHA[\s-]*256|哈希/i),
    rejectsUnprovenLink:rule(t,/(?:不能|无法|不足|未|不应).{0,48}(?:证明|确认|推断|归属|关联|引用).{0,30}(?:同一次|来源|会议|口头|X|Y)|(?:纪要|口头|来源).{0,65}(?:未|无|缺|无法).{0,30}(?:关联|引用|对应|证明|绑定|确认|出处)/),
    noClosure:rule(t,/(?:不能|不可|暂不|尚不能|不宜).{0,30}(?:收口|全部通过|验收|宣称)|(?:收口|全面通过).{0,20}(?:不成立|未满足)/),
    rootCauseUnknown:rule(t,/(?:根因|原因).{0,30}(?:不明|未知|未确认|不能确定|没有证据|无法判断|不可确认)|(?:不应|不能|不可).{0,20}(?:推断|猜测).{0,20}(?:失败原因|根因)/)
   };
  },
  "limited-beta-approval":()=>({
   idCoverage:rule(t,/I7/)&&rule(t,/A4/),
   window:rule(t,/36\s*(?:小时|h)/i),
   internalOnly:rule(t,/(?:内部|员工)/)&&rule(t,/(?:预发布|预生产)/),
   betaNotReleased:rule(t,/(?:不能|不可|尚不能|暂不|不应).{0,30}(?:Beta|对外|发布|放行|上线)|(?:对外|Beta).{0,20}(?:不能|暂不|不可)/i),
   negativeTestsPending:rule(t,/(?:未|没有|尚未).{0,18}(?:执行|重跑|复验|验证).{0,18}(?:负向|权限|用例)|(?:负向|权限).{0,22}(?:未|没有|尚未).{0,18}(?:执行|重跑|复验|验证)/)
  }),
  "partial-coverage":()=>({
   counts:rule(t,/45\/45/)&&rule(t,/45\/60/),
   untested15:rule(t,/15\s*份?/),
   scheduled5:rule(t,/5\s*份?/),
   unknown10:rule(t,/10\s*份?/),
   notAllPassed:rule(t,/(?:不能|不可|不应|暂不).{0,32}(?:100%|全部|全面|宣称|收口)|(?:100%|全部).{0,27}(?:不成立|不能|不足)/),
   untestedNotFail:rule(t,/(?:未测|未执行|未覆盖|缺执行记录).{0,34}(?:不等于|不能|并非|不是).{0,18}(?:失败|不通过)|(?:不能|不应|不可).{0,25}(?:把|将).{0,18}(?:未测|未执行).{0,15}(?:失败|不通过)/)
  }),
  "cross-round":()=>({
   issueIds:rule(t,/T1/)&&rule(t,/T2/)&&rule(t,/T3/),
   failedInjection:rule(t,/2\/5/),
   remainsOpen:rule(t,/(?:不能|不可|尚不能|暂不).{0,32}(?:收口|验收|通过|全部完成|完成)/),
   t2Unknown:rule(t,/T2.{0,80}(?:未确认|未知|不明|缺|待验证|无法证明)/),
   noImplicitConsent:!rule(t,/(?:已获|已经|用户已).{0,12}(?:接受|豁免).{0,15}(?:所有|全部|缺陷|风险)/)
  }),
  "rag-short-answer":()=>({
   embedding:rule(t,/Embedding|嵌入|向量表示/i),
   index:rule(t,/索引/),
   difference:rule(t,/(?:表达|生成|映射|表示|转换|编码|语义)/)&&rule(t,/(?:查询|检索|搜索|最近邻|查找|加速)/),
   short:answer.replace(/\s/g,"").length<=250,
   noTableOrHTML:!rule(answer,/^\s*#{1,6}\s|\|\s*[-:]{3}|<html|<table/mi)
  })
 };
 if(!Object.hasOwn(c,caseId))throw Error("Unknown semantic case "+caseId);
 return c[caseId]();
}
function parseEvents(file){
 const es=[];for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){if(!line.trim())continue;try{es.push(JSON.parse(line))}catch{}}
 return es;
}
function summarize(rows){
 const done=rows.filter(x=>x.completed);const lengths=done.map(x=>x.nonSpaceChars).sort((a,b)=>a-b);
 return {sessions:rows.length,completed:done.length,genUiToolCalls:rows.reduce((a,x)=>a+x.genUiTool,0),
  successfulRefReads:rows.reduce((a,x)=>a+x.loadedRef,0),blockedRefReads:rows.reduce((a,x)=>a+x.deniedRef,0),
  observedRuleLoads:rows.filter(x=>x.loadedRef>0).length,skillListed:rows.filter(x=>x.skillAvailable).length,
  screenPass:rows.filter(x=>x.screenPass).length,
  medianChars:lengths.length?(lengths.length%2?lengths[(lengths.length-1)/2]:(lengths[lengths.length/2-1]+lengths[lengths.length/2])/2):null};
}
export function evaluateRun(root,fixturesFile){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,"manifest.json"),"utf8"));
 const raw=fs.readFileSync(fixturesFile);if(sha(raw)!==manifest.fixtureHash)throw Error("Fixture content modified");
 const fixture=JSON.parse(raw),byId=new Map(fixture.cases.map(c=>[c.id,c]));const rows=[];
 for(const task of manifest.tasks){
  if(sha(task.prompt)!==task.promptHash)throw Error("Task prompt changed "+task.id);
  const folder=path.join(root,task.id),f=path.join(folder,"events.jsonl"),done=path.join(folder,"process-result.json");
  if(!fs.existsSync(f)||!fs.existsSync(done))throw Error("Incomplete "+task.id);
  const trace=classify(parseEvents(f)),proc=JSON.parse(fs.readFileSync(done,"utf8")),answer=trace.answer||"";
  const checks=evaluate(task.caseId,answer);
  const row={id:task.id,caseId:task.caseId,group:task.group,repeat:task.repeat,
   completed:proc.exit===0&&trace.status==="success",status:trace.status,exit:proc.exit,model:trace.model,
   skillAvailable:trace.available,genUiTool:trace.genUiTool,otherSkill:trace.otherSkill,
   loadedRef:trace.loadedRef,deniedRef:trace.deniedRef,attemptedRef:trace.attemptedRef,
   nonSpaceChars:answer.replace(/\s/g,"").length,checks,screenPass:Object.values(checks).every(Boolean)};
  rows.push(row);fs.writeFileSync(path.join(folder,"answer.md"),answer);
 }
 return {schema:"genui-fresh-semantic-score/v1",commit:manifest.frozenCommit,
  caveat:"Lexical diagnostic checks only. Models may produce correct synonyms or false inferences despite green checks. Inspect content manually before claiming quality gains.",
  byGroup:Object.fromEntries(["natural","explicit","baseline"].map(k=>[k,summarize(rows.filter(x=>x.group===k))])),
  byCase:Object.fromEntries(fixture.cases.map(c=>[c.id,Object.fromEntries(["natural","explicit","baseline"].map(k=>[k,summarize(rows.filter(x=>x.group===k&&x.caseId===c.id))]))])),
  rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.resolve(process.argv[2]||"evals/artifacts/fresh-semantic-2026-11-16");
 const cases=path.resolve(process.argv[3]||"evals/semantic-fresh-cases-2026-11-16.json");
 const r=evaluateRun(dir,cases);fs.writeFileSync(path.join(dir,"scored.json"),JSON.stringify(r,null,2)+"\n");
 console.log(JSON.stringify({groups:r.byGroup,byCase:r.byCase},null,2));
}
