#!/usr/bin/env node
// Offline output diagnostics. Not a semantic judge or a reader-timing experiment.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const med=xs=>{if(!xs.length)return null;xs.sort((a,b)=>a-b);return xs.length%2?xs[(xs.length-1)/2]:(xs[xs.length/2-1]+xs[xs.length/2])/2};
const facts={
 'semantic-evaluation':[
  {name:'45-of-60-coverage',regex:/45\s*\/\s*60\s*(?:[＝=]\s*)?75\s*%/},
  {name:'60-of-60-possible',regex:/60\s*\/\s*60\s*(?:[＝=]\s*)?100\s*%/},
  {name:'lexical-is-not-semantic',regex:/(?:初筛|词项).{0,95}(?:不代表|不能|不等于).{0,20}(?:语义|正确)/s},
  {name:'cannot-claim-superiority',regex:/(?:不足|不能|无法).{0,70}(?:证明|推断).{0,40}(?:普遍|显著|优势)/s}
 ],
 'review-continuity':[
  {name:'R2-unknown-not-unimplemented',regex:/R2.{0,100}(?:不再|不能|未).{0,35}(?:断言|认定|证明|未实现|实现)/s},
  {name:'N1-production-condition',regex:/N1.{0,90}(?:生产前置|生产阻断|生产前.*修复)/s},
  {name:'12-vs-11',regex:/12\s*\/\s*12.{0,50}11\s*\/\s*12/s},
  {name:'last-version-4-cases-unverified',regex:/(?:末版|最终).{0,100}(?:未重跑|不能.*4\s*\/\s*4|未.*全量|未.*完整)/s}
 ],
 'html-stability':[
  {name:'controlled-3-of-3',regex:/3\s*\/\s*3/},
  {name:'chrome-179-of-179',regex:/179\s*\/\s*179/},
  {name:'typography-18-of-18',regex:/18\s*\/\s*18/},
  {name:'not-production-verification',regex:/(?:业务|方案).{0,38}(?:未经|未|不代表|不能).{0,60}(?:生产|验证)|(?:HTML|验收).{0,35}(?:不能|不代表).{0,55}(?:业务|生产)/s}
 ]
};
export function scoreFolder(root){
 const state=JSON.parse(fs.readFileSync(path.join(root,'run-full-state.json'),'utf8'));
 const rows=[];
 for(const task of state.tasks){
  const file=path.join(root,task.id,'answer.md');const answer=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
  const events=path.join(root,task.id,'events.jsonl');let terminal=false,agentMsg=false,unknown=false;
  if(fs.existsSync(events))for(const line of fs.readFileSync(events,'utf8').split(/\r?\n/)){
   if(!line.trim())continue;let ev;try{ev=JSON.parse(line)}catch{continue}
   if(ev.type==='turn.completed')terminal=true;
   if(ev.type==='item.completed'&&ev.item?.type==='agent_message')agentMsg=true;
   if(ev.type==='item.completed'&&/Unknown command|Not logged in/i.test(String(ev.item?.text||ev.item?.message||'')))unknown=true;
  }
  const valid=task.exitCode===0&&task.exitKind==='exit'&&terminal&&agentMsg&&answer.trim().length>=120&&!unknown;
  const checks=(facts[task.caseId]||[]).map(x=>({name:x.name,present:x.regex.test(answer)}));
  rows.push({id:task.id,group:task.group,caseId:task.caseId,valid,seconds:task.seconds,chars:answer.replace(/\s/g,'').length,checks,presentCount:checks.filter(x=>x.present).length,checkCount:checks.length});
 }
 const groups={};for(const name of ['baseline','explicit']){const r=rows.filter(x=>x.group===name),valid=r.filter(x=>x.valid);groups[name]={attempts:r.length,valid:valid.length,medianGenerationSeconds:med(valid.map(x=>x.seconds)),medianNonspaceChars:med(valid.map(x=>x.chars)),diagnosticFlagsMatched:valid.reduce((a,x)=>a+x.presentCount,0),diagnosticFlagsTotal:valid.reduce((a,x)=>a+x.checkCount,0)}}
 return {schema:'genui-codex-reading-diagnostic/v1',groups,rows,disclaimer:'Flags only inspect text and can be fooled. Six model generations are not blinded human ratings or timed reading trials. Generation duration is not reading duration.'};
}
const self=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(self){const root=path.resolve(process.argv[2]||'evals/artifacts/real-reading-pilot-2026-11-16/codex-native');try{const data=scoreFolder(root);fs.writeFileSync(path.join(root,'scored.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({groups:data.groups,rows:data.rows.map(({id,valid,presentCount,checkCount})=>({id,valid,flags:presentCount+'/'+checkCount}))},null,2))}catch(e){console.error(e.message);process.exitCode=1}}
