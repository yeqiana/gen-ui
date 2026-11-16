import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {prepareBlind,scoreReviews,scoreReadingTrials} from '../evals/blind-reading-study.mjs';

function setup(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'genui-blind-test-'));const source=path.join(root,'source');fs.mkdirSync(source);const tasks=[];for(const [caseId,groups] of Object.entries({one:['natural','explicit','baseline'],two:['natural','explicit','baseline']})){for(const group of groups){const id=caseId+'-'+group+'-r1';const dir=path.join(source,id);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'answer.md'),'Answer '+id);tasks.push({id,caseId,group,repeat:1})}}fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify({frozenCommit:'test-commit',tasks}));return {root,source,output:path.join(root,'prepared')}}
test('fixed-seed blind preparation anonymizes and seals group labels',t=>{const {root,source,output}=setup();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const result=prepareBlind({root:source,output,seed:'test'});assert.equal(result.count,6);const publicManifest=fs.readFileSync(path.join(output,'blind-manifest.json'),'utf8');const answers=fs.readdirSync(path.join(output,'answers'));assert.equal(answers.length,6);assert.doesNotMatch(publicManifest,/natural|baseline|explicit/);const key=JSON.parse(fs.readFileSync(path.join(output,'SEALED-KEY-DO-NOT-SHARE.json')));assert.equal(key.rows.length,6);assert.equal(new Set(key.rows.map(r=>r.sourceId)).size,6);assert.throws(()=>prepareBlind({root:source,output,seed:'test'}),/new or empty/);});
test('blind preparation is repeatable across clean output directories',t=>{const x=setup();t.after(()=>fs.rmSync(x.root,{recursive:true,force:true}));prepareBlind({root:x.source,output:x.output,seed:'same'});const second=path.join(x.root,'second');prepareBlind({root:x.source,output:second,seed:'same'});assert.equal(fs.readFileSync(path.join(x.output,'blind-manifest.json'),'utf8'),fs.readFileSync(path.join(second,'blind-manifest.json'),'utf8'));});
test('no reviewers means no semantic success',()=>{const empty={schema:'genui-blind-review-sheet/v1',rows:[{blindId:'one-01',reviewer:'',scores:{conclusion:null,evidenceBoundary:null,omissionDetection:null,decisionSafety:null}}]};assert.deepEqual(scoreReviews(empty),{reviewedAnswers:0,multiReviewed:0,disagreementCount:0,pendingAdjudication:[],medianReviewSeconds:null,note:'Blind scores cannot be attributed to groups until adjudication is frozen and the key is unsealed.'});});
test('disagreement is flagged and no auto-adjudication occurs',()=>{const a={blindId:'one-01',reviewer:'r1',scores:{conclusion:2,evidenceBoundary:1,omissionDetection:2,decisionSafety:2},durationSec:30};const b={...a,reviewer:'r2',scores:{...a.scores,conclusion:0},durationSec:42};const r=scoreReviews({schema:'genui-blind-review-sheet/v1',rows:[a,b]});assert.equal(r.multiReviewed,1);assert.deepEqual(r.pendingAdjudication,['one-01']);assert.equal(r.medianReviewSeconds,36)});
test('reading score requires externally adjudicated binary grades and valid durations',()=>{const trials=[{participantId:'p1',taskId:'task1',variant:'a',durationSec:60,answers:['a','b'],grades:[1,0]},{participantId:'p2',taskId:'task2',variant:'a',durationSec:100,answers:['a'],grades:[1]}];assert.equal(scoreReadingTrials(trials).a.medianSeconds,80);assert.equal(scoreReadingTrials(trials).a.accuracy,2/3);assert.throws(()=>scoreReadingTrials([{...trials[0],grades:[1]}]),/Each answer/);});

test('同一读者不能重复看同一来源的 A/B 两个版本，阅读与答题时间分别统计',()=>{
 const a={participantId:'p1',taskId:'doc1',variant:'a',readingSec:45,answerSec:32,answers:['结论'],grades:[1]};
 const b={...a,variant:'b'};
 assert.throws(()=>scoreReadingTrials([a,b]),/Repeated source/);
 const r=scoreReadingTrials([a,{...a,participantId:'p2',readingSec:75,answerSec:40}]);
 assert.equal(r.a.medianReadingSeconds,60);
 assert.equal(r.a.medianAnswerSeconds,36);
 assert.equal(r.a.answerTimeSamples,2);
 assert.throws(()=>scoreReadingTrials([{...a,readingSec:-1}]),/Invalid reading duration/);
});
