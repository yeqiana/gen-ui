import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {scoreFolder} from '../evals/score-codex-reading.mjs';
function build({exitCode=0,kind='exit',answer='有效内容'.repeat(60),terminal=true,error=false}={}){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'genui-codex-score-'));const id='semantic-evaluation-baseline';const dir=path.join(root,id);fs.mkdirSync(dir);fs.writeFileSync(path.join(root,'run-full-state.json'),JSON.stringify({tasks:[{id,caseId:'semantic-evaluation',group:'baseline',exitCode,exitKind:kind,seconds:9}]}));fs.writeFileSync(path.join(dir,'answer.md'),answer);
 const ev=[{type:'thread.started'},{type:'item.completed',item:{type:'agent_message',text:error?'Unknown command: /gen-ui':'实际回答'}}];if(terminal)ev.push({type:'turn.completed'});fs.writeFileSync(path.join(dir,'events.jsonl'),ev.map(x=>JSON.stringify(x)).join('\n'));return root;
}
test('Successful CLI exit with complete answer counts as valid generation, not semantic correctness',t=>{const root=build();t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const r=scoreFolder(root);assert.equal(r.groups.baseline.valid,1);assert.equal(r.groups.baseline.diagnosticFlagsMatched,0);assert.equal(r.groups.explicit.valid,0)});
test('Unknown command and nonterminal JSONL cannot be treated as valid',t=>{for(const p of [{error:true},{terminal:false},{exitCode:1},{answer:'short'}]){const root=build(p);t.after(()=>fs.rmSync(root,{recursive:true,force:true}));assert.equal(scoreFolder(root).groups.baseline.valid,0)}});
test('Fact phrase presence does not silently upgrade invalid output',t=>{const root=build({exitCode:1,answer:'45/60=75% 当前执行覆盖率，60/60=100%，词项初筛不代表语义正确，不足以证明普遍优势。'.repeat(3)});t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const r=scoreFolder(root);assert.equal(r.rows[0].valid,false);assert.equal(r.groups.baseline.diagnosticFlagsMatched,0)});
