#!/usr/bin/env node
// Prepares a frozen, counterbalanced, no-dependency reader study; does not fabricate readers or variants.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const safe=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9-]{0,80}$/.test(x);
const assert=(value,message)=>{if(!value)throw Error(message)};
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function shuffle(arr,seed){const a=[...arr];let n=crypto.createHash('sha256').update(seed).digest().readUInt32LE(0);for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;[a[i],a[(n>>>0)%(i+1)]]=[a[(n>>>0)%(i+1)],a[i]]}return a}
export function prepareReadingExperiment({spec,root,output,seed='real-reading-v1',participants=6}){
 assert(spec.schema==='genui-real-reading-cases/v1'&&Array.isArray(spec.items)&&spec.items.length>=3,'At least 3 frozen real sources required');
 assert(Number.isInteger(participants)&&participants>=2&&participants%2===0,'Even participant count >=2 required');
 assert(!fs.existsSync(output)||fs.readdirSync(output).length===0,'Output dir must be new or empty');
 const cases=[];const seen=new Set();for(const item of spec.items){
  assert(safe(item.id)&&!seen.has(item.id),'Invalid/duplicate source id');seen.add(item.id);
  assert(typeof item.source==='string'&&!path.isAbsolute(item.source)&&!item.source.split(/[\\/]/).includes('..'),'Unsafe source path');
  const full=path.resolve(root,item.source);assert(full.startsWith(path.resolve(root)+path.sep),'Path escapes repository');
  const content=fs.readFileSync(full,'utf8');assert(sha(content)===item.sourceSha256,'Source changed: '+item.id);
  assert(Array.isArray(item.questions)&&item.questions.length>=3,'Need 3+ questions');
  const questions=[];const qids=new Set();const dims=new Set();for(const q of item.questions){
   assert(safe(q.id)&&!qids.has(q.id),'Duplicate question id');qids.add(q.id);dims.add(q.dimension);
   assert(['conclusion','evidence','omission','decision'].includes(q.dimension),'Unexpected dimension');
   assert(typeof q.question==='string'&&q.question.trim().length>5,'Missing question');
   assert(typeof q.answer==='string'&&q.answer.trim(),'Missing gold answer');
   assert(typeof q.evidence==='string'&&content.includes(q.evidence),'Evidence anchor not in frozen source: '+item.id+'/'+q.id);
   questions.push(q);
  }
  assert(dims.has('conclusion')&&dims.has('decision')&&dims.has('omission'),'Required reading dimensions missing');
  cases.push({id:item.id,source:item.source,sourceSha256:item.sourceSha256,text:content,questions});
 }
 const publicCases=cases.map(c=>({id:c.id,sourceSha256:c.sourceSha256,questions:c.questions.map(({id,dimension,question})=>({id,dimension,question}))}));
 const key={schema:'genui-reading-sealed-key/v1',seedHash:sha(seed),sources:cases.map(c=>({id:c.id,source:c.source,sourceSha256:c.sourceSha256,gold:c.questions.map(({id,answer,evidence})=>({id,answer,evidence}))})),variants:{},assignments:[]};
 for(const c of cases)key.variants[c.id]={};
 const mapping=cases.map(c=>({id:c.id,a:sha(seed+':'+c.id+':A').slice(0,10),b:sha(seed+':'+c.id+':B').slice(0,10)}));
 for(const m of mapping){assert(m.a!==m.b,'Stimulus collision');key.variants[m.id]['v-'+m.a]='A';key.variants[m.id]['v-'+m.b]='B'}
 const schedules=[];for(let i=0;i<participants;i++){
  const reader='reader-'+String(i+1).padStart(2,'0');
  // Balanced by source: 50% see A, 50% see B. Each reader sees each source exactly once.
  const order=shuffle(cases.map((c,j)=>{const v=(i+j)%2===0?'A':'B';const m=mapping[j];const stimulusId='v-'+(v==='A'?m.a:m.b);return {caseId:c.id,stimulusId}}),seed+':reader:'+i);
  schedules.push({participantId:reader,order});key.assignments.push({participantId:reader,variants:order.map(x=>({caseId:x.caseId,variant:key.variants[x.caseId][x.stimulusId]}))});
 }
 fs.mkdirSync(output,{recursive:true});
 write(path.join(output,'reader-questions.json'),{schema:'genui-reader-questions/v1',cases:publicCases});
 write(path.join(output,'allocation.json'),{schema:'genui-reading-allocation/v1',source:'tracked real engineering reports',participants,variantFilesPresent:false,usableForTimedStudy:false,reason:'Two fact-equivalent versions per source must be generated and content-verified before testing',schedules});
 write(path.join(output,'SEALED-READING-KEY-DO-NOT-SHARE.json'),key);
 write(path.join(output,'experiment-state.json'),{schema:'genui-reading-state/v1',frozenSources:cases.length,questions:cases.reduce((a,c)=>a+c.questions.length,0),plannedParticipants:participants,validStimulusPairs:0,completedReaderTrials:0,independentHumanReviewers:0,status:'preparation-only'});
 return {sources:cases.length,questions:cases.reduce((a,c)=>a+c.questions.length,0),participants,trialSlots:cases.length*participants,status:'preparation-only'};
}
const self=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(self){try{const [caseFile,out,seed]=process.argv.slice(2);assert(caseFile&&out,'Usage: node evals/prepare-reading-experiment.mjs CASES OUTPUT [SEED]');const absolute=path.resolve(caseFile);const result=prepareReadingExperiment({spec:JSON.parse(fs.readFileSync(absolute,'utf8')),root:path.dirname(path.dirname(absolute)),output:path.resolve(out),seed});console.log(JSON.stringify(result,null,2))}catch(e){console.error(e.message);process.exitCode=1}}
