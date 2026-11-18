import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {auditFrozenMermaidEdges} from "../evals/mermaid-edge-audit.mjs";
import {evidenceCatalogue,resolveEvidenceIds} from "../evals/evidence-id-map.mjs";
import {scoreUnseen} from "../evals/score-unseen-panorama.mjs";
const text="# Plan\n A[Call] --> I[Inspect]\n I --> V{Ready?}\n V -- No --> X[FAIL]\n V -- Yes --> M[Manual]\n";
const hash=crypto.createHash("sha256").update(text).digest("hex");
const c={id:"graph",repo:"graph",commit:"a".repeat(40),sources:[{file:"flow.md",sha256:hash}],
 anchors:[{file:"flow.md",quote:"V -- No --> X"}],forbiddenAssumptions:[]};
const entry={case:c,files:[{file:"flow.md",sha256:hash,text}]};
const cat=evidenceCatalogue(entry);
const eid=line=>cat.entries.find(x=>x.line===line).id;
const edges=[[2,"A","I","call","inspect",null],[3,"I","V","inspect","ready",null],[4,"V","X","ready","failed","No"],[5,"V","M","ready","manual","Yes"]];
const golden={caseId:c.id,commit:c.commit,edges:edges.map(([line,sourceFrom,sourceTo,from,to,condition])=>({file:"flow.md",line,sourceFrom,sourceTo,from,to,condition}))};
const candidate=()=>({schema:"genui-panorama-candidate/v1",cases:[{id:c.id,status:"documented",notes:"Documented flow, not executed",
 layers:[{title:"flow",modules:[{id:"call",title:"call",evidence:[{id:eid(2)}]},{id:"inspect",title:"inspect",evidence:[{id:eid(3)}]}]},
 {title:"branch",modules:[{id:"ready",title:"ready",evidence:[{id:eid(3)}]},{id:"failed",title:"failed",evidence:[{id:eid(4)}]},{id:"manual",title:"manual",evidence:[{id:eid(5)}]}]}],
 relations:edges.map(([line,sourceFrom,sourceTo,from,to,condition])=>({
 from,to,type:condition?"controls":"flow",...(condition?{condition}:{}),evidence:[{id:eid(line)}]}))}]});
test("pinned source edge mapping passes 4 original arrows",()=>assert.equal(auditFrozenMermaidEdges(entry,candidate(),golden).status,"PASS"));
test("source quote identity alone cannot prove endpoint fidelity",()=>{
 const m=candidate();[m.cases[0].relations[0].from,m.cases[0].relations[0].to]=[m.cases[0].relations[0].to,m.cases[0].relations[0].from];
 const structural=scoreUnseen({schema:"genui-unseen-panorama/v1",cases:[c]},resolveEvidenceIds(m,[entry]),()=>Buffer.from(text));
 assert.equal(structural.status,"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED");
 assert.equal(auditFrozenMermaidEdges(entry,m,golden).status,"BLOCKED");
});
test("missing failure exit, wrong condition, wrong RT-like endpoint and extra relation are blocked",()=>{
 for(const mutate of [
 m=>m.cases[0].relations.splice(2,1),
 m=>{m.cases[0].relations[2].condition="Yes"},
 m=>{m.cases[0].relations[1].from="call"},
 m=>m.cases[0].relations.push(structuredClone(m.cases[0].relations[0]))
 ]){const x=candidate();mutate(x);assert.equal(auditFrozenMermaidEdges(entry,x,golden).status,"BLOCKED");}
});
test("golden source labels, lines and commit must match frozen source",()=>{
 for(const mutate of [x=>x.commit="b".repeat(40),x=>x.edges[0].sourceTo="X",x=>x.edges[0].line=40]){
  const x=structuredClone(golden);mutate(x);assert.equal(auditFrozenMermaidEdges(entry,candidate(),x).status,"BLOCKED");
 }
});
