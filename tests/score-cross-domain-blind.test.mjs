import test from 'node:test';
import assert from 'node:assert/strict';
import {summarizeModelBlind} from '../evals/score-cross-domain-blind.mjs';
const categories=['conclusion','evidenceBoundary','omissionDetection','decisionSafety'];
function fixture(){
 const items=[],rows=[],jobs=[];
 for(const caseId of ['alpha','beta'])for(let i=1;i<=2;i++){
  const blindId=caseId+'-0'+i,sha256=caseId+'-hash-'+i;
  items.push({blindId,caseId,sha256});rows.push({blindId,caseId,sha256,group:i===1?'baseline':'explicit'});
 }
 for(const caseId of ['alpha','beta'])for(const reviewer of ['r1','r2'])jobs.push({reviewer,caseId,ratings:[1,2].map(i=>({blindId:caseId+'-0'+i,scores:Object.fromEntries(categories.map(n=>[n,2])),criticalErrors:[],notes:'证据已核对'}))});
 return {manifest:{schema:'genui-blind-manifest/v1',items},key:{rows},jobs};
}
test('two independent masked model review sessions per answer, then aggregate only after unsealing',()=>{
 const x=fixture(),r=summarizeModelBlind(x);
 assert.equal(r.anonymizedAnswers,4);assert.equal(r.reviewerRatings,8);assert.equal(r.disagreementCount,0);
 assert.equal(r.groups.baseline.rubricPoints,32);assert.equal(r.groups.explicit.rubricPoints,32);
});
test('missing second reviewer, unexpected ID, wrong score, duplicate judge job all fail closed',()=>{
 const a=fixture();a.jobs.pop();assert.throws(()=>summarizeModelBlind(a),/Missing independent/);
 const b=fixture();b.jobs[0].ratings[0].blindId='unknown';assert.throws(()=>summarizeModelBlind(b),/wrong IDs/);
 const c=fixture();c.jobs[0].ratings[0].scores.conclusion=3;assert.throws(()=>summarizeModelBlind(c),/Invalid score/);
 const d=fixture();d.jobs[1].reviewer='r1';assert.throws(()=>summarizeModelBlind(d),/Duplicate reviewer task/);
});
test('sealed mapping must match public case IDs and source answer hashes',()=>{
 const a=fixture();a.key.rows[0].sha256='tampered';assert.throws(()=>summarizeModelBlind(a),/Tampered/);
 const b=fixture();b.manifest.items[0].caseId='other';assert.throws(()=>summarizeModelBlind(b),/Tampered/);
});
