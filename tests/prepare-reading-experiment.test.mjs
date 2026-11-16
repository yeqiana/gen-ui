import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {prepareReadingExperiment} from '../evals/prepare-reading-experiment.mjs';
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'genui-read-exp-'));
 const items=['a','b','c'].map(id=>{const content='结论准 证据有效 遗漏未测 决策暂不放行 '+id;fs.writeFileSync(path.join(root,id+'.md'),content);return {id,source:id+'.md',sourceSha256:sha(content),questions:[{id:'q1',dimension:'conclusion',question:'关键结论是什么？',answer:'准',evidence:'结论准'},{id:'q2',dimension:'decision',question:'下一步怎么做？',answer:'暂不放行',evidence:'决策暂不放行'},{id:'q3',dimension:'omission',question:'哪些尚未验证？',answer:'未测',evidence:'遗漏未测'}]}});
 return {root,spec:{schema:'genui-real-reading-cases/v1',items},output:path.join(root,'out')};
}
test('3 real sources and 6 reader slots are balanced without gold leakage',t=>{const x=fixture();t.after(()=>fs.rmSync(x.root,{recursive:true,force:true}));const r=prepareReadingExperiment(x);assert.deepEqual(r,{sources:3,questions:9,participants:6,trialSlots:18,status:'preparation-only'});
 const publicJson=fs.readFileSync(path.join(x.output,'reader-questions.json'),'utf8');assert.doesNotMatch(publicJson,/"answer"|"evidence"|暂不放行/);
 const allocations=JSON.parse(fs.readFileSync(path.join(x.output,'allocation.json'),'utf8'));assert.equal(allocations.usableForTimedStudy,false);assert.equal(allocations.schedules.length,6);
 const key=JSON.parse(fs.readFileSync(path.join(x.output,'SEALED-READING-KEY-DO-NOT-SHARE.json'),'utf8'));for(const c of x.spec.items){let a=0,b=0;for(const reader of allocations.schedules){const rows=reader.order.filter(v=>v.caseId===c.id);assert.equal(rows.length,1);const group=key.variants[c.id][rows[0].stimulusId];if(group==='A')a++;else if(group==='B')b++;else assert.fail('missing group')}assert.equal(a,3);assert.equal(b,3)}
});
test('same seed yields same allocation but different seed rotates opaque IDs',t=>{const x=fixture();t.after(()=>fs.rmSync(x.root,{recursive:true,force:true}));prepareReadingExperiment(x);const a=fs.readFileSync(path.join(x.output,'allocation.json'),'utf8');const bdir=path.join(x.root,'alt');prepareReadingExperiment({...x,output:bdir});assert.equal(a,fs.readFileSync(path.join(bdir,'allocation.json'),'utf8'));const cdir=path.join(x.root,'diff');prepareReadingExperiment({...x,output:cdir,seed:'different'});assert.notEqual(a,fs.readFileSync(path.join(cdir,'allocation.json'),'utf8'))});
test('source changes, missing evidence and unsafe filenames block all output',t=>{const x=fixture();t.after(()=>fs.rmSync(x.root,{recursive:true,force:true}));fs.appendFileSync(path.join(x.root,'a.md'),'修改');assert.throws(()=>prepareReadingExperiment(x),/Source changed/);assert.equal(fs.existsSync(x.output),false);fs.writeFileSync(path.join(x.root,'a.md'),'结论准 证据有效 遗漏未测 决策暂不放行 a');x.spec.items[0].questions[0].evidence='不存在的内容';assert.throws(()=>prepareReadingExperiment(x),/Evidence anchor/);x.spec.items[0].questions[0].evidence='结论准';x.spec.items[0].source='../secret.md';assert.throws(()=>prepareReadingExperiment(x),/Unsafe source path/)});
test('odd participants and already populated output are rejected',t=>{const x=fixture();t.after(()=>fs.rmSync(x.root,{recursive:true,force:true}));assert.throws(()=>prepareReadingExperiment({...x,participants:5}),/Even participant/);fs.mkdirSync(x.output);fs.writeFileSync(path.join(x.output,'existing.txt'),'keep');assert.throws(()=>prepareReadingExperiment(x),/new or empty/);assert.equal(fs.readFileSync(path.join(x.output,'existing.txt'),'utf8'),'keep')});
