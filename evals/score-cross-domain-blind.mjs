#!/usr/bin/env node
// Offline model-blind review aggregation. Ratings are model opinions, NOT human proof.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {scoreReviews} from './blind-reading-study.mjs';
const fail=m=>{throw Error(m)};
const names=['conclusion','evidenceBoundary','omissionDetection','decisionSafety'];
export function summarizeModelBlind({manifest,key,jobs}){
 if(manifest.schema!=='genui-blind-manifest/v1'||!Array.isArray(manifest.items)||!Array.isArray(key.rows))fail('Invalid blind bundle');
 if(manifest.items.length<2||manifest.items.length!==key.rows.length)fail('Incomplete or mismatched blind bundle');
 const expected=new Map(manifest.items.map(x=>[x.blindId,x]));if(expected.size!==manifest.items.length)fail('Duplicate blind IDs');
 const sealed=new Map(key.rows.map(x=>[x.blindId,x]));if(sealed.size!==expected.size)fail('Sealed mapping mismatch');
 for(const [id,pub] of expected){const priv=sealed.get(id);if(!priv||pub.caseId!==priv.caseId||pub.sha256!==priv.sha256||!['baseline','explicit'].includes(priv.group))fail('Tampered or mismatched sealed key: '+id)}
 const rows=[];const seenJobs=new Set();for(const job of jobs){
  if(!['r1','r2'].includes(job.reviewer)||!job.caseId||!Array.isArray(job.ratings)||job.ratings.length!==2)fail('Invalid reviewer task');
  const taskId=job.caseId+':'+job.reviewer;if(seenJobs.has(taskId))fail('Duplicate reviewer task');seenJobs.add(taskId);
  const caseIds=manifest.items.filter(x=>x.caseId===job.caseId).map(x=>x.blindId);
  if(caseIds.length!==2)fail('Case must have exactly two blinded versions');
  const seen=new Set();for(const rate of job.ratings){
   if(!caseIds.includes(rate.blindId)||seen.has(rate.blindId))fail('Reviewer answered the wrong IDs');seen.add(rate.blindId);
   if(!rate.scores||Object.keys(rate.scores).length!==4||names.some(k=>!Number.isInteger(rate.scores[k])||rate.scores[k]<0||rate.scores[k]>2))fail('Invalid score rubric');
   if(!Array.isArray(rate.criticalErrors)||rate.criticalErrors.some(e=>typeof e!=='string')||typeof rate.notes!=='string')fail('Missing review evidence');
   rows.push({blindId:rate.blindId,reviewer:job.reviewer,scores:rate.scores,criticalErrors:rate.criticalErrors,notes:rate.notes,durationSec:null});
  }
 }
 const sheet={schema:'genui-blind-review-sheet/v1',rows};const coverage=scoreReviews(sheet);
 if(coverage.multiReviewed!==expected.size||rows.length!==expected.size*2)fail('Missing independent model reviewer scores');
 const groups={};for(const group of ['baseline','explicit']){
  const inGroup=rows.filter(r=>sealed.get(r.blindId).group===group);const total=inGroup.reduce((sum,r)=>sum+names.reduce((n,k)=>n+r.scores[k],0),0);
  groups[group]={answers:inGroup.length/2,reviewerRatings:inGroup.length,rubricPoints:total,maximumPoints:inGroup.length*names.length*2,criticalErrors:inGroup.reduce((sum,r)=>sum+r.criticalErrors.length,0)};
 }
 return {schema:'genui-blind-model-score/v1',anonymizedAnswers:expected.size,independentModelReviewers:2,reviewerRatings:rows.length,disagreementCount:coverage.disagreementCount,groups,warning:'Same-model blinded reviews are not human independent adjudication. All-maximum scores produce a ceiling effect, not proof of equivalent correctness or skill superiority.'};
}
export function loadAndScore(root){const blind=path.join(root,'blind'),out=path.join(root,'judge-output');const man=JSON.parse(fs.readFileSync(path.join(blind,'blind-manifest.json'),'utf8')),key=JSON.parse(fs.readFileSync(path.join(blind,'SEALED-KEY-DO-NOT-SHARE.json'),'utf8')),state=JSON.parse(fs.readFileSync(path.join(out,'run-judge-state.json'),'utf8'));
 if(state.tasks.length!==6||state.tasks.some(x=>x.exitCode!==0||x.exitKind!=='exit'))fail('Incomplete model judge run');
 const jobs=state.tasks.map(task=>{const match=/^judge-(r[12])-(.+)$/.exec(task.id);if(!match)fail('Unexpected judge ID');const json=JSON.parse(fs.readFileSync(path.join(out,task.id,'answer.md'),'utf8'));return {reviewer:match[1],caseId:match[2],ratings:json.ratings}});
 return summarizeModelBlind({manifest:man,key,jobs});
}
const self=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);if(self){try{const root=path.resolve(process.argv[2]||'evals/artifacts/cross-domain-codex-2026-11-16');const summary=loadAndScore(root);fs.writeFileSync(path.join(root,'blind-model-score.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2))}catch(e){console.error(e.message);process.exitCode=1}}
