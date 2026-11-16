#!/usr/bin/env node
// No dependencies. Counts observed successful GEN-UI reads/tool invocations, not mere availability.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
import {score} from "./score-review-continuity.mjs";
const sha=text=>crypto.createHash("sha256").update(text).digest("hex");
const hasGenUiRef=p=>/(?:^|[\\/])gen-ui[\\/](?:SKILL\.md|references[\\/][^\\/]+\.md)$/i.test(String(p||""));
export function classify(events){
 const toolUse=new Map(),results=new Map();
 let init=null,result=null,genUiTool=0,otherSkill=0;
 for(const e of events){
  if(e.type==="system"&&e.subtype==="init")init=e;
  if(e.type==="result")result=e;
  if(e.type==="assistant")for(const c of e.message?.content||[])if(c.type==="tool_use"){
   toolUse.set(c.id,c);
   if(c.name==="Skill"){if(c.input?.skill==="gen-ui")genUiTool++;else otherSkill++;}
  }
  if(e.type==="user")for(const c of e.message?.content||[])if(c.type==="tool_result")results.set(c.tool_use_id,c);
 }
 let attemptedRef=0,loadedRef=0,deniedRef=0;
 for(const [id,call]of toolUse){
  if(call.name!=="Read"||!hasGenUiRef(call.input?.file_path))continue;
  attemptedRef++;
  const res=results.get(id);
  if(res&&!res.is_error)loadedRef++;
  else deniedRef++;
 }
 return {model:init?.model||null,status:result?.subtype||"missing",answer:String(result?.result||""),
  genUiTool,otherSkill,attemptedRef,loadedRef,deniedRef,observedActivation:genUiTool>0||loadedRef>0,
  available:(init?.skills||[]).includes("gen-ui")};
}
export function basicNovelScore(def,text){
 const s=text.replace(/\s+/g," ");
 if(def.id==="hash-lineage")return {
  raw19:/19\/20/.test(s),oral20:/20\/20/.test(s),hash:/SHA[\s-]*256/.test(s),
  sourceUnknown:/(?:口头|会议纪要|摘要|纪要).{0,100}(?:无法|不能|不可|没有|未|缺|无材料).{0,50}(?:来源|日志|关联|引用|对应|证明|确认)|(?:SHA[\s-]*256|哈希|哈希一致).{0,70}(?:不能|不足|不构成|不说明|不代表).{0,40}(?:证明|推断|来源|引用|关系)/.test(s),
  noRetest:/(?:没有|未|无).{0,25}(?:重测|复测|重跑|重新扫描|识别测试|扫描测试)|(?:只换|仅换).{0,14}(?:页面|可视化)/.test(s),
  noClosure:/(?:不能|不可|不宜|暂不|尚不能).{0,25}(?:收口|通过|宣布)/.test(s)
 };
 if(def.id==="limited-signoff")return{
  labels:/L7/.test(s)&&/P4/.test(s),
  hours:/48\s*(?:小时|h)/i.test(s),
  trialOnly:/沙盒/.test(s)&&/内部/.test(s),
  preProdFix:/(?:生产|上线|发布).{0,45}(?:前|仍需|必须).{0,24}(?:修复|解决)|(?:修复|解决).{0,20}(?:后才|才能).{0,12}(?:上线|生产)/.test(s),
  verifyPermission:/权限/.test(s)&&/(?:权限).{0,25}(?:尚未|未|没有).{0,12}(?:复验|复测|重跑|验证)|(?:尚未|未|没有).{0,25}(?:重跑|复验|复测|权限验证)|(?:权限).{0,20}(?:复验|复测|重跑|测试).{0,20}(?:未|尚未)/.test(s),
  noProdRelease:/(?:不能|不可|暂不|无法).{0,26}(?:生产|发布|上线|全部问题已关闭|收口)|(?:生产|线上).{0,15}(?:不能|不可|暂不)/.test(s)
 };
 throw Error("unknown novel "+def.id);
}
function records(file){
 const out=[];
 for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){if(!line.trim())continue;try{out.push(JSON.parse(line))}catch{}}
 return out;
}
function aggregate(items){
 const finished=items.filter(x=>x.completed);
 const nums=finished.map(x=>x.chars).sort((a,b)=>a-b);
 return {total:items.length,completed:finished.length,slashRequested:items.filter(x=>x.explicitRequested).length,
  available:items.filter(x=>x.available).length,genUiToolCalls:items.reduce((sum,x)=>sum+x.genUiTool,0),
  otherSkillToolCalls:items.reduce((sum,x)=>sum+x.otherSkill,0),anyObservedActivation:items.filter(x=>x.observedActivation).length,
  loadedReferenceReads:items.reduce((sum,x)=>sum+x.loadedRef,0),deniedReferenceReads:items.reduce((sum,x)=>sum+x.deniedRef,0),
  originalFourScreenPass:items.filter(x=>x.originalScore?.pass).length,
  originalFourTotal:items.filter(x=>x.originalScore).length,medianChars:nums.length?nums.length%2?nums[(nums.length-1)/2]:(nums[nums.length/2-1]+nums[nums.length/2])/2:null};
}
export function analyze(dir,fixtures){
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
 const prev=new Map(fixtures.filter(x=>!["hash-lineage","limited-signoff"].includes(x.id)).map(x=>[x.id,x]));
 const all=new Map(manifest.cases.map(x=>[x.id,x]));
 const rows=[];
 for(const t of manifest.tasks){
  if(sha(t.prompt)!==t.promptHash)throw Error("Prompt fingerprint mismatch "+t.id);
  const file=path.join(dir,t.id,"events.jsonl"),done=path.join(dir,t.id,"process-result.json");
  if(!fs.existsSync(file))throw Error("No event log "+t.id);
  const info=classify(records(file)),proc=fs.existsSync(done)?JSON.parse(fs.readFileSync(done,"utf8")):{exit:null};
  const originalScore=prev.has(t.caseId)?score(prev.get(t.caseId),info.answer):null;
  const novelScore=originalScore?null:basicNovelScore(all.get(t.caseId),info.answer);
  const row={id:t.id,caseId:t.caseId,group:t.group,repeat:t.repeat,explicitRequested:t.prompt.startsWith("/gen-ui "),
    completed:proc.exit===0&&info.status==="success",chars:info.answer.replace(/\s+/g,"").length,
    model:info.model,available:info.available,genUiTool:info.genUiTool,otherSkill:info.otherSkill,
    attemptedRef:info.attemptedRef,loadedRef:info.loadedRef,deniedRef:info.deniedRef,observedActivation:info.observedActivation,
    originalScore:originalScore?{pass:originalScore.pass,evidenceRate:originalScore.evidenceRate,failed:Object.entries(originalScore.checks).filter(([,v])=>!v).map(([k])=>k)}:null,
    novelScore,novelScreenPass:novelScore?Object.values(novelScore).every(Boolean):null};
  rows.push(row);
  fs.writeFileSync(path.join(dir,t.id,"answer.md"),info.answer);
 }
 const groups=Object.fromEntries(["natural","explicit"].map(g=>[g,aggregate(rows.filter(x=>x.group===g))]));
 return {version:"gen-ui-discovery-analysis/v1",frozenCommit:manifest.frozenCommit,note:"Tool invocation and successful file-read evidence are observable activation; slash expansion without observable tool/read is unknown. Heuristics are not semantic certification.",groups,rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.resolve(process.argv[2]||"evals/artifacts/genui-discovery-2026-11-16/matrix");
 const fixtures=JSON.parse(fs.readFileSync(path.resolve("evals/review-continuity-cases.json"),"utf8")).cases;
 const result=analyze(dir,fixtures);
 fs.writeFileSync(path.join(dir,"analysis.json"),JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({groups:result.groups,rows:result.rows.map(x=>({id:x.id,completed:x.completed,observed:x.observedActivation,genUiTool:x.genUiTool,loadedRef:x.loadedRef,deniedRef:x.deniedRef,originalPass:x.originalScore?.pass,novelPass:x.novelScreenPass}))},null,2));
}
