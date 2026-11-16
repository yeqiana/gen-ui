#!/usr/bin/env node
// Deterministic screening heuristics; not a substitute for human semantic review.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";
const hash=s=>crypto.createHash("sha256").update(s).digest("hex");
const compact=s=>s.replace(/\s+/g," ").replace(/[*_]/g,"");
export function evidence(text,item){
 const s=compact(text);
 const patterns={
  "根因尚未确认":/(?:根因|原因).{0,14}(?:未|尚未|不明|未知|无法|没有).{0,15}(?:确认|确定|明确|定位)|根因未明|原因不明/,
  "7 天":/7\s*[天日]/,
  "第 3 轮":/第\s*3\s*轮|第三轮/,
  "验签测试":/验签.{0,8}(?:测试|复验|重跑)|签名验证/,
  "SHA-256":/SHA[\s-]*256|哈希校验/i
 };
 return patterns[item]?patterns[item].test(s):s.includes(item);
}
const decision=text=>/(?:不能|不可|无法|暂不|尚不).{0,38}(?:收口|完成验收|宣布.*完成|发布|结束)|(?:收口|生产发布).{0,22}(?:不具备|暂不可|不能|未达到)|未达到.{0,25}收口条件/.test(compact(text).slice(0,360));
const falseR2=text=>text.split(/[\r\n。]+/).some(line=>{
 if(!/R2/.test(line)||!/未实现|尚未实现|没有实现/.test(line))return false;
 if(/(?:不等于|不代表|不能断言|不能认定|尚不能确认|无法确认|并非|不能说).{0,25}(?:未实现|没有实现)/.test(line))return false;
 return /R2.{0,45}(?:未实现|尚未实现|没有实现)/.test(line);
});
function gates(id,text){
 const s=compact(text);
 switch(id){
 case "review-not-closed": return {
  noClosure:decision(text),
  R1NotAllVerified:/断点恢复/.test(s)&&/未做|未进行|缺|尚未|未测|待验证/.test(s),
  R2UnknownImplementation:!falseR2(text),
  R3Failure:/1\/3/.test(s)&&/失败|迟到写回/.test(s),
  noAssumedConsent:!/用户.{0,15}(?:已经|已).{0,10}接受.{0,8}(?:全部|所有)缺陷/.test(s)};
 case "scoped-risk-consent":return{
  noProductionClosure:decision(text),
  trialBoundary:/N1/.test(s)&&/7\s*[天日]/.test(s)&&/内部试用/.test(s),
  N1ProductionPrerequisite:/(?:正式生产|生产发布|生产上线|生产).{0,58}(?:仍需|必须|需要|需).{0,12}(?:修复|解决)|(?:正式上线|生产|上线)前.{0,45}(?:修复|解决)|N1.{0,48}生产(?:侧)?(?:仍未修复|阻断)|N1.{0,40}修复前.{0,25}(?:生产|发布)/.test(s),
  noFalseN1NonBlock:!/N1[^。\n]{0,70}(?:不构成|不属于).{0,22}生产(?:发布)?(?:阻断|障碍)|N1[^。\n]{0,70}不影响.{0,15}生产(?:收口|发布)/.test(text),
  C2Unverified:/C2/.test(s)&&/验签|签名验证/.test(s)&&/(?:尚未|未|缺|没有).{0,22}(?:重跑|复验|验签|测试|记录)|(?:重跑|复验).{0,16}(?:未|尚未|待)/.test(s),
  demoNotValidation:/(?:演示|展示).{0,35}(?:不等于|不代表|并非|不能|不构成).{0,20}(?:验证|验收|测试)/.test(s)};
 case "contradictory-evidence":return{
  noClosure:decision(text),
  logPrevails:/(?:原始日志|原始记录).{0,60}11\/12|11\/12.{0,60}(?:原始日志|原始记录)/.test(s),
  noNewTest:/(?:第\s*3\s*轮|第三轮|本轮).{0,85}(?:没有|无|未).{0,25}(?:新增|新的|新)?(?:识别测试|测试|复测)|(?:未|没有).{0,15}(?:新增|重新).{0,20}(?:识别测试|复测)|(?:只换|仅改|只改).{0,15}(?:界面|页面).{0,22}(?:无|未|没有).{0,15}(?:测试|复测)/.test(s),
  noInventedCause:!/(?:因为|由于|根因是|原因是).{0,16}(?:二维码.{0,4}损坏|图片.{0,4}模糊|污损|分辨率不足)/.test(s)};
 case "simple-density":return{
  topics:/\bMCP\b/i.test(s)&&/\bSkill\b/i.test(s),
  keyConcepts:/工具|数据源|外部|接口/.test(s)&&/流程|方法|指令|知识|步骤|规范/.test(s),
  short:text.replace(/\s+/g,"").length<=240&&text.split(/[。！？]/).filter(x=>x.trim()).length<=4,
  noDashboard:!/^#{1,6}\s/m.test(text)&&!/\|\s*[-:]{3}/.test(text)&&!/<(?:html|table|details)\b/i.test(text)};
 default:throw Error("Unknown fixture "+id);
 }
}
export function score(def,text){
 const retained=def.mustRetain.map(item=>({item,found:evidence(text,item)})),checks=gates(def.id,text);
 const count=retained.filter(x=>x.found).length,rate=count/retained.length;
 const chars=text.replace(/\s+/g,"").length;
 return {pass:!!text.trim()&&rate>=.85&&Object.values(checks).every(Boolean),
  evidenceCount:count,evidenceTotal:retained.length,evidenceRate:rate,retained,checks,chars,
  headings:(text.match(/^#{1,6}\s/gm)||[]).length};
}
function parseLog(file){
 if(!fs.existsSync(file))return {};
 let init={},result={},invokedSkill=false,readReadingLayers=false;
 for(const line of fs.readFileSync(file,"utf8").split(/\r?\n/)){
  let e;try{e=JSON.parse(line)}catch{continue}
  if(e.type==="system"&&e.subtype==="init")init=e;
  if(e.type==="result")result=e;
  if(e.type==="assistant")for(const c of e.message?.content||[]){
   if(c.type==="tool_use"&&c.name==="Skill")invokedSkill=true;
   if(c.type==="tool_use"&&c.name==="Read"&&/reading-layers\.md/i.test(String(c.input?.file_path||"")))readReadingLayers=true;
  }
 }
 return {text:result.result||"",model:init.model||null,turns:result.num_turns||0,
  costUsd:result.total_cost_usd??null,status:result.subtype||"missing",invokedSkill,readReadingLayers};
}
const median=arr=>{const s=[...arr].sort((a,b)=>a-b);return s.length?(s.length%2?s[(s.length-1)/2]:(s[s.length/2-1]+s[s.length/2])/2):null;};
const aggregate=arr=>({total:arr.length,completed:arr.filter(x=>x.completed).length,
 screenPass:arr.filter(x=>x.screenPass).length,
 evidenceItems:arr.reduce((a,x)=>a+x.evidenceCount,0),
 evidenceTotal:arr.reduce((a,x)=>a+x.evidenceTotal,0),
 evidenceRate:arr.reduce((a,x)=>a+x.evidenceCount,0)/Math.max(1,arr.reduce((a,x)=>a+x.evidenceTotal,0)),
 medianChars:median(arr.filter(x=>x.completed).map(x=>x.chars)),
 skillInvoked:arr.filter(x=>x.invokedSkill).length,readReadingLayers:arr.filter(x=>x.readReadingLayers).length});
export function scoreDirectory(directory,caseFile){
 const manifest=JSON.parse(fs.readFileSync(path.join(directory,"manifest.json"),"utf8"));
 const cases=JSON.parse(fs.readFileSync(caseFile,"utf8")).cases,byId=new Map(cases.map(x=>[x.id,x])),rows=[];
 for(const task of manifest.tasks){
  const def=byId.get(task.caseId);
  if(!def||hash(def.prompt)!==task.promptSha256)throw Error("Prompt identity mismatch "+task.id);
  const loc=path.join(directory,task.id),data=parseLog(path.join(loc,"events.jsonl"));
  const f=path.join(loc,"process-result.json");
  const proc=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,"utf8")):{exit:null};
  const completed=proc.exit===0&&data.status==="success";
  const rated=score(def,data.text||"");
  rows.push({id:task.id,caseId:task.caseId,group:task.group,repeat:task.repeat,
   completed,screenPass:completed&&rated.pass,...rated,model:data.model,status:data.status,turns:data.turns,
   costUsd:data.costUsd,invokedSkill:data.invokedSkill,readReadingLayers:data.readReadingLayers});
  fs.writeFileSync(path.join(loc,"answer.md"),data.text||"");
 }
 return {version:"gen-ui-reading-stability-score/v1",commit:manifest.commit,
  note:"Regex/token retention and length metrics are automatic heuristics, NOT proof of semantic correctness.",
  groups:Object.fromEntries(["skill","control"].map(g=>[g,aggregate(rows.filter(x=>x.group===g))])),
  cases:Object.fromEntries(cases.map(c=>[c.id,Object.fromEntries(["skill","control"].map(g=>[g,aggregate(rows.filter(x=>x.caseId===c.id&&x.group===g))]))])),
  models:[...new Set(rows.map(x=>x.model))],rows};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const dir=path.resolve(process.argv[2]||"evals/artifacts/reading-stability-2026-11-16");
 const cases=path.resolve(process.argv[3]||"evals/review-continuity-cases.json");
 const result=scoreDirectory(dir,cases);
 fs.writeFileSync(path.join(dir,"scored.json"),JSON.stringify(result,null,2)+"\n");
 console.log(JSON.stringify({groups:result.groups,cases:result.cases,models:result.models},null,2));
}
