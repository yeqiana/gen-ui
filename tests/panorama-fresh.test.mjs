import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {validateManifest,readFrozenSources,promptForCase,prepare,inspect} from '../evals/prepare-panorama-fresh.mjs';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function git(dir,args){const r=spawnSync('git',['-C',dir,...args],{encoding:'utf8',timeout:12000});assert.equal(r.status,0,r.stderr);return r.stdout.trim()}
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'genui-fresh-case-test-'));
 const m={schema:'genui-panorama-fresh-evaluation/v1',cases:[]};
 for(const id of ['alpha','beta']){
  const folder=path.join(dir,id);fs.mkdirSync(folder);git(folder,['init','-q']);
  const source='A source module\nB evidence state\nC validation rule\nThis Skill is not a database or server.\n'+id;
  fs.writeFileSync(path.join(folder,'README.md'),source);git(folder,['add','README.md']);git(folder,['-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','frozen source']);
  m.cases.push({id,repo:id,repo_ref:'fixture/'+id,commit:git(folder,['rev-parse','HEAD']),path:'README.md',sha256:sha(Buffer.from(source)),evidence:['A source','B evidence','C validation'],mustDistinguish:['module','evidence','review'],mustNotClaim:['database server is deployed','tested in production']});
 }
 return {dir,m,out:path.join(dir,'out')};
}
test('frozen public source and rubric are required before any model attempt',t=>{
 const f=fixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 assert.equal(readFrozenSources(f.m,f.dir).length,2);
 const bad=structuredClone(f.m);bad.cases[0].sha256='0'.repeat(64);assert.throws(()=>readFrozenSources(bad,f.dir),/SHA-256 mismatch/);
 const wrong=structuredClone(f.m);wrong.cases[0].evidence.push('not in source');assert.throws(()=>readFrozenSources(wrong,f.dir),/evidence missing/);
});
test('prepare creates paired no-provider prompts; no semantic success or network action is inferred',t=>{
 const f=fixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 const r=prepare({manifest:f.m,projectsRoot:f.dir,outDir:f.out});
 assert.equal(r.preparedPrompts,4);assert.equal(r.actualModelCalls,0);
 const a=fs.readFileSync(path.join(f.out,'alpha','baseline-prompt.md'),'utf8'),b=fs.readFileSync(path.join(f.out,'alpha','explicit-prompt.md'),'utf8');
 assert.equal(b,'$gen-ui\n'+a);
 assert.match(a,/A source module/);assert.match(a,/不能凭空加服务器/);
 const status=inspect(f.out,f.m);assert.equal(status.unreviewedAnswers,0);assert.equal(status.verifiedSemanticSuccess,0);assert.ok(status.rows.every(x=>x.state==='not_run'));
 assert.throws(()=>prepare({manifest:f.m,projectsRoot:f.dir,outDir:f.out}),/refuse overwrite/);
});
test('answer file presence cannot be auto-scored as an accurate panorama',t=>{
 const f=fixture();t.after(()=>fs.rmSync(f.dir,{recursive:true,force:true}));
 prepare({manifest:f.m,projectsRoot:f.dir,outDir:f.out});
 fs.writeFileSync(path.join(f.out,'alpha','explicit-answer.html'),'<h1>hallucinated deployment</h1>');
 const status=inspect(f.out,f.m);assert.equal(status.unreviewedAnswers,1);assert.equal(status.verifiedSemanticSuccess,0);
 assert.ok(status.rows.some(x=>x.state==='pending-independent-review'));
});
test('duplicate case, unsafe path, and missing source guards fail closed',()=>{
 const f=fixture();try{
  const bad=structuredClone(f.m);bad.cases[1].id=bad.cases[0].id;assert.throws(()=>validateManifest(bad),/Duplicate/);
  const unsafe=structuredClone(f.m);unsafe.cases[0].path='../private.txt';assert.throws(()=>validateManifest(unsafe),/Unsafe/);
  const missing=structuredClone(f.m);missing.cases[0].repo='not-here';assert.throws(()=>readFrozenSources(missing,f.dir),/Missing local project/);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
});
