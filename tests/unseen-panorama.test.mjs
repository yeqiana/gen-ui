import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {scoreUnseen} from "../evals/score-unseen-panorama.mjs";

const original=Buffer.from("# Example\ninput accepted by UI; review only after input accepted. No bundled database or background server.\n");
const sha256=b=>crypto.createHash("sha256").update(b).digest("hex");
function fixture(){
 const c={id:"example",repo:"example",commit:"0".repeat(40),
  sources:[{file:"docs/a.md",sha256:sha256(original),bytes:original.length}],
  anchors:[{file:"docs/a.md",quote:"input accepted by UI"},{file:"docs/a.md",quote:"review only after input accepted"}],
  forbiddenAssumptions:["已上线"]};
 const manifest={schema:"genui-unseen-panorama/v1",cases:[c]};
 const evidence=quote=>[{file:"docs/a.md",quote}];
 const candidate={schema:"genui-panorama-candidate/v1",cases:[{id:"example",status:"documented",notes:"This is a document, not deployed proof.",
  layers:[{title:"输入层",modules:[{id:"intake",title:"Request intake",evidence:evidence("input accepted by UI")}]},
   {title:"业务处理层",modules:[{id:"review",title:"Review",evidence:evidence("review only after input accepted")}]}],
  relations:[{from:"intake",to:"review",type:"depends",evidence:evidence("review only after input accepted")}]}]};
 return {manifest,candidate,resolve:()=>original};
}
test("新领域可以有两层，不强制模板固定六层；通过只能算结构与来源引用检查",()=>{
 const x=fixture(),r=scoreUnseen(x.manifest,x.candidate,x.resolve);
 assert.equal(r.status,"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED");
 assert.equal(r.documents,1);assert.equal(r.modules,2);assert.equal(r.relations,1);assert.equal(r.anchors,2);
 assert.equal(r.modelRunsVerified,0);assert.equal(r.humanSemanticReviews,0);
});
test("不存在的模块证据、伪造连线证据、错误端点均必须阻断",()=>{
 for(const mutate of [
  x=>x.candidate.cases[0].layers[0].modules[0].evidence[0].quote="invented Kubernetes cluster",
  x=>x.candidate.cases[0].relations[0].evidence[0].quote="fabricated data flow",
  x=>x.candidate.cases[0].relations[0].to="not-a-real-node"
 ]){const x=fixture();mutate(x);assert.equal(scoreUnseen(x.manifest,x.candidate,x.resolve).status,"BLOCKED")}
});
test("源文件被篡改、任意已上线宣称和无证据状态都阻断",()=>{
 const x=fixture();assert.equal(scoreUnseen(x.manifest,x.candidate,()=>Buffer.from("tampered")).status,"BLOCKED");
 const y=fixture();y.candidate.cases[0].notes="已上线";assert.equal(scoreUnseen(y.manifest,y.candidate,y.resolve).status,"BLOCKED");
 const z=fixture();z.candidate.cases[0].status="verified";assert.equal(scoreUnseen(z.manifest,z.candidate,z.resolve).status,"BLOCKED");
});
test("输入必须是实际候选；没有真实模型输出时不能自动宣称已测泛化",()=>{
 const {manifest}=fixture();
 assert.throws(()=>scoreUnseen(manifest,null,()=>original),/Invalid candidate output/);
 const x=fixture();x.candidate.cases=[];assert.equal(scoreUnseen(x.manifest,x.candidate,x.resolve).status,"BLOCKED");
});

test("三个真实陌生来源只冻结 Git SHA 与证据短句，不提交源文件或本地绝对路径",()=>{
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
 const s=fs.readFileSync(path.join(root,"evals/unseen-panorama-2026-11-17.json"),"utf8");
 const manifest=JSON.parse(s);
 assert.equal(manifest.schema,"genui-unseen-panorama/v1");
 assert.deepEqual(manifest.cases.map(x=>x.id),["agent-lead","plan-ship","distributed-system-audit"]);
 assert.doesNotMatch(s,/[A-Z]:\\Users\\|(?:ghp_|github_pat_|Bearer\s)/i);
 for(const c of manifest.cases){
  assert.match(c.commit,/^[a-f0-9]{40}$/);
  assert.ok(c.sources.length>=1);
  assert.ok(c.anchors.length>=3);
  for(const f of c.sources)assert.match(f.sha256,/^[a-f0-9]{64}$/);
 }
});
