#!/usr/bin/env node
// Offline-only preparation/validation. No model calls, no automatic semantic scores.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const canonical = value => JSON.stringify(value);
const fail = message => {throw new Error(message)};
const safeId = value => /^[a-z0-9][a-z0-9-]{0,80}$/.test(value);
const median = xs => {if(!xs.length)return null;const a=[...xs].sort((x,y)=>x-y);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2};
function shuffled(xs,seed){const a=[...xs];let n=crypto.createHash('sha256').update(String(seed)).digest().readUInt32LE(0); for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function writeJson(f,v){fs.writeFileSync(f,JSON.stringify(v,null,2)+'\n')}
function guardedDir(p){if(fs.existsSync(p)&&fs.readdirSync(p).length)fail('Output directory must be new or empty: '+p);fs.mkdirSync(p,{recursive:true})}
function safeText(s){if(typeof s!=='string'||!s.trim())fail('Missing text');return s}
export function prepareBlind({root,output,seed='genui-blind-study-v1',readings=[]}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
 if(!Array.isArray(manifest.tasks))fail('Missing manifest tasks');
 const unique=new Set();const seenCases=new Set();const entries=[];
 for(const task of manifest.tasks){if(!safeId(task.id)||unique.has(task.id))fail('Invalid or duplicate task id');unique.add(task.id);
  const file=path.join(root,task.id,'answer.md');const answer=safeText(fs.readFileSync(file,'utf8'));
  if(/(?:C:\\Users\\|\/Users\/|API[_-]?KEY|Bearer\s+[A-Za-z0-9_.-]{16,})/i.test(answer))fail('Potential sensitive content in answer '+task.id);
  if(!['natural','explicit','baseline'].includes(task.group))fail('Unknown group');
  const caseId=task.caseId;if(!safeId(caseId))fail('Unsafe case id');seenCases.add(caseId);
  entries.push({id:task.id,caseId,group:task.group,repeat:task.repeat,answer,hash:sha(answer)});
 }
 if(!entries.length)fail('No answers');
 const byCase=Object.groupBy?Object.groupBy(entries,e=>e.caseId):Object.fromEntries([...seenCases].map(id=>[id,entries.filter(e=>e.caseId===id)]));
 const order=[];for(const caseId of [...seenCases].sort()){const rows=shuffled(byCase[caseId],seed+':'+caseId);rows.forEach((entry,i)=>order.push({...entry,blindId:caseId+'-'+String(i+1).padStart(2,'0')}))}
 const blind=shuffled(order,seed+':global');
 const readingIds=new Set();const readingManifest=readings.map((r,i)=>{if(!safeId(r.id)||readingIds.has(r.id))fail('Invalid reading id'); readingIds.add(r.id);if(!Array.isArray(r.questions)||!r.questions.length)fail('Reading questions required');const source=safeText(r.source);const normalized={id:r.id,source,questions:r.questions.map(q=>({id:q.id,question:safeText(q.question)}))}; if(normalized.questions.some(q=>!safeId(q.id))||new Set(normalized.questions.map(q=>q.id)).size!==normalized.questions.length)fail('Duplicate/unsafe question ids');return {...normalized,sourceHash:sha(source),ordinal:i+1}});
 guardedDir(output);fs.mkdirSync(path.join(output,'answers'));
 for(const x of blind){fs.writeFileSync(path.join(output,'answers',x.blindId+'.md'),x.answer)}
 const publicRows=blind.map(({blindId,caseId,hash})=>({blindId,caseId,sha256:hash}));
 const sheet={schema:'genui-blind-review-sheet/v1',instructions:'先独立阅读回答，再核对题面和来源。不得使用组别或自动初筛作为评分依据。unknown 表示无法判断，不可计为通过。',rows:publicRows.map(({blindId,caseId,sha256})=>({blindId,caseId,sha256,reviewer:'',scores:{conclusion:null,evidenceBoundary:null,omissionDetection:null,decisionSafety:null},criticalErrors:[],notes:'',durationSec:null}))};
 writeJson(path.join(output,'blind-manifest.json'),{schema:'genui-blind-manifest/v1',sourceCommit:manifest.frozenCommit,seedHash:sha(seed),count:publicRows.length,items:publicRows});
 writeJson(path.join(output,'blind-review-sheet.json'),sheet);
 writeJson(path.join(output,'reading-tasks.json'),{schema:'genui-reading-tasks/v1',questionsWithoutAnswers:true,items:readingManifest.map(({id,source,questions,sourceHash})=>({id,source,sourceHash,questions}))});
 writeJson(path.join(output,'SEALED-KEY-DO-NOT-SHARE.json'),{schema:'genui-blind-key/v1',rows:blind.map(({blindId,id,group,repeat,caseId,hash})=>({blindId,sourceId:id,group,repeat,caseId,sha256:hash}))});
 return {count:publicRows.length,readingTasks:readingManifest.length,warning:'The sealed key is LOCAL ONLY. Do not publish it or expose it to reviewers.'};
}
export function scoreReviews(sheet,{minReviewers=2}={}){
 if(sheet.schema!=='genui-blind-review-sheet/v1'||!Array.isArray(sheet.rows))fail('Invalid review sheet');
 const allowed=new Set([0,1,2]);const by=new Map();for(const row of sheet.rows){if(!safeId(row.blindId))fail('Unsafe blind id');if(!row.reviewer||!row.reviewer.trim())continue;for(const [k,v] of Object.entries(row.scores||{})){if(!['conclusion','evidenceBoundary','omissionDetection','decisionSafety'].includes(k)||!allowed.has(v))fail('Score must be 0, 1 or 2: '+k)}if(Object.keys(row.scores||{}).length!==4)fail('Missing score category');if(row.durationSec!==null&&(!Number.isFinite(row.durationSec)||row.durationSec<0))fail('Invalid duration');const list=by.get(row.blindId)||[];if(list.some(x=>x.reviewer===row.reviewer))fail('Duplicate reviewer');list.push(row);by.set(row.blindId,list)}
 const complete=[...by].filter(([,r])=>r.length>=minReviewers);const disputes=complete.filter(([,rows])=>{const scores=rows.map(r=>canonical(r.scores));return new Set(scores).size>1});
 return {reviewedAnswers:by.size,multiReviewed:complete.length,disagreementCount:disputes.length,pendingAdjudication:disputes.map(([id])=>id),medianReviewSeconds:median([...by.values()].flat().map(r=>r.durationSec).filter(Number.isFinite)),note:'Blind scores cannot be attributed to groups until adjudication is frozen and the key is unsealed.'}
}
export function scoreReadingTrials(trials){
 if(!Array.isArray(trials))fail('Trials must be an array');
 const seen=new Set(),grouped={};
 for(const t of trials){
  if(!safeId(t.taskId)||!safeId(t.variant)||!safeId(t.participantId))fail('Invalid trial identifiers');
  const key=[t.participantId,t.taskId].join(':');
  if(seen.has(key))fail('Repeated source for one reader (potential learning bias)');
  seen.add(key);
  const read=t.readingSec??t.durationSec, answer=t.answerSec??null;
  if(!Number.isFinite(read)||read<0)fail('Invalid reading duration');
  if(answer!==null&&(!Number.isFinite(answer)||answer<0))fail('Invalid answer duration');
  if(!Array.isArray(t.answers)||!Array.isArray(t.grades)||t.answers.length!==t.grades.length||!t.grades.length)fail('Each answer requires a grade');
  if(t.grades.some(x=>![0,1].includes(x)))fail('Grades are 0 or 1, adjudicated externally');
  (grouped[t.variant]??=[]).push({...t,readingSec:read,answerSec:answer});
 }
 return Object.fromEntries(Object.entries(grouped).map(([variant,rows])=>{
  const correct=rows.reduce((sum,row)=>sum+row.grades.reduce((a,b)=>a+b,0),0);
  const questions=rows.reduce((sum,row)=>sum+row.grades.length,0);
  const answerTimes=rows.map(x=>x.answerSec).filter(Number.isFinite);
  return [variant,{trials:rows.length,medianSeconds:median(rows.map(x=>x.readingSec)),medianReadingSeconds:median(rows.map(x=>x.readingSec)),medianAnswerSeconds:median(answerTimes),answerTimeSamples:answerTimes.length,correct,questions,accuracy:correct/questions}];
 }));
}
const self=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(self){try{const [cmd,...args]=process.argv.slice(2);if(cmd==='prepare'){const [root,output,seed]=args;console.log(JSON.stringify(prepareBlind({root:path.resolve(root),output:path.resolve(output),seed}),null,2))}else if(cmd==='reviews'){const data=JSON.parse(fs.readFileSync(args[0],'utf8'));console.log(JSON.stringify(scoreReviews(data),null,2))}else if(cmd==='reading'){const data=JSON.parse(fs.readFileSync(args[0],'utf8'));console.log(JSON.stringify(scoreReadingTrials(data.trials),null,2))}else fail('Usage: prepare ROOT OUT [SEED] | reviews SHEET | reading TRIALS')}catch(e){console.error(e.message);process.exitCode=1}}
