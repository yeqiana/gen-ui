#!/usr/bin/env node
// Offline P0 gate for previously unseen product-architecture source material.
// It verifies committed Git evidence, not model autonomy or semantic correctness.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const sha256=b=>crypto.createHash("sha256").update(b).digest("hex");
const safe=s=>typeof s==="string"&&s.length>0&&!s.includes("..")&&!path.isAbsolute(s)&&!s.includes("\\")&&!/^[A-Za-z]:/.test(s);
function validText(value){return typeof value==="string"&&value.trim().length>0}
// Only a standalone Mermaid arrow is automatically known to mean sequence flow.
// Do not infer architectural dependency from a diagram transition.
export function isPlainMermaidTransition(line){
 return /^\s*[A-Za-z][A-Za-z0-9_]*(?:\[[^\]\r\n]*\]|\{[^}\r\n]*\}|\([^\)\r\n]*\))?\s*-->\s*[A-Za-z][A-Za-z0-9_]*/.test(line);
}
export function scoreUnseen(manifest,candidate,getBlob){
 const problems=[],push=x=>problems.push(x),sourceCache=new Map();
 if(manifest?.schema!=="genui-unseen-panorama/v1"||!Array.isArray(manifest.cases)||!manifest.cases.length)
  throw Error("Invalid frozen source manifest");
 if(candidate?.schema!=="genui-panorama-candidate/v1"||!Array.isArray(candidate.cases))
  throw Error("Invalid candidate output (model execution is still required)");
 let documents=0,modules=0,relations=0,evidenceRefs=0,anchors=0;
 const expected=new Set(manifest.cases.map(c=>c.id));
 for(const c of candidate.cases)if(!expected.has(c.id))push("unknown case: "+c.id);
 if(candidate.cases.length!==expected.size||new Set(candidate.cases.map(c=>c.id)).size!==expected.size)
  push("every frozen case must have exactly one candidate");
 for(const c of manifest.cases){
  if(!safe(c.repo)||!c.commit||!Array.isArray(c.sources))throw Error("Unsafe case source");
  const blobs=new Map();
  for(const f of c.sources){
   if(!safe(f.file)||!/^[a-f0-9]{64}$/.test(f.sha256))throw Error("Unsafe source path or digest");
   const source=getBlob(c.repo,c.commit,f.file);
   if(!Buffer.isBuffer(source))throw Error("Resolver must return Git blob Buffer");
   if(sha256(source)!==f.sha256){push(c.id+": source changed: "+f.file);continue}
   blobs.set(f.file,source.toString("utf8"));documents++;sourceCache.set(c.id+"/"+f.file,source);
  }
  const response=candidate.cases.find(x=>x.id===c.id);
  if(!response){push(c.id+": missing output");continue}
  if(!["documented","planned","unknown"].includes(response.status))
   push(c.id+": do not call unverified implementations deployed or tested");
  if(!Array.isArray(response.layers)||response.layers.length<2||response.layers.length>8)
   {push(c.id+": expected 2–8 source-specific layers (not forced to six)");continue}
  const ids=new Set(),allQuotes=[];
  for(const l of response.layers){
   if(!validText(l.title)||!Array.isArray(l.modules)||!l.modules.length){push(c.id+": invalid layer");continue}
   for(const m of l.modules){
    modules++;
    if(!validText(m.id)||!validText(m.title)||ids.has(m.id))push(c.id+": duplicate / empty module ID");
    ids.add(m.id);
    if(!Array.isArray(m.evidence)||!m.evidence.length)push(c.id+": module missing evidence: "+m.id);
    for(const e of m.evidence||[]){
     evidenceRefs++;
     if(!blobs.has(e.file)||!validText(e.quote)||e.quote.length<8||!blobs.get(e.file).includes(e.quote))
      push(c.id+": unsupported module evidence: "+m.id);
     else allQuotes.push({file:e.file,quote:e.quote});
    }
   }
  }
  if(modules>150)push("unreasonably oversized candidate");
  if(!Array.isArray(response.relations))push(c.id+": missing relations array");
  for(const r of response.relations||[]){
   relations++;
   if(!ids.has(r.from)||!ids.has(r.to)||r.from===r.to||!["depends","data","controls","composes","flow"].includes(r.type))
    push(c.id+": unsupported relation endpoints/type");
   if(!Array.isArray(r.evidence)||!r.evidence.length)push(c.id+": relation missing source evidence");
   const branchLabels=[];
   let plainMermaidFlow=false;
   for(const e of r.evidence||[]){
    evidenceRefs++;
    if(!blobs.has(e.file)||!validText(e.quote)||e.quote.length<8||!blobs.get(e.file).includes(e.quote))
     push(c.id+": unsupported relationship quote");
    else {
     allQuotes.push({file:e.file,quote:e.quote});
     for(const match of e.quote.matchAll(/--\s*(Yes|No|True|False|是|否)\s*-->/gi))
      branchLabels.push(match[1]);
     if(e.quote.split(/\r?\n/).some(isPlainMermaidTransition))plainMermaidFlow=true;
    }
   }
   // An explicit Mermaid conditional arrow is not an unconditional dependency.
   // Keep exact branch semantics, never infer a condition from unrelated text.
   if(branchLabels.length){
    const unique=new Set(branchLabels);
    if(unique.size!==1||r.type!=="controls"||
       typeof r.condition!=="string"||!unique.has(r.condition))
     push(c.id+": conditional flow requires controls and matching condition label");
   }else if(r.condition!==undefined)
    push(c.id+": condition without explicit source branch");
   if(plainMermaidFlow&&r.type!=="flow")
    push(c.id+": plain Mermaid transition requires flow relation (not depends)");
  }
  const corpus=JSON.stringify({layers:response.layers,relations:response.relations,notes:response.notes||""});
  for(const forbidden of c.forbiddenAssumptions||[])if(corpus.includes(forbidden))push(c.id+": unsupported assumption: "+forbidden);
  for(const a of c.anchors||[]){
   if(!allQuotes.some(e=>e.file===a.file&&e.quote.includes(a.quote)))push(c.id+": mandatory source boundary absent: "+a.quote);
   else anchors++;
  }
 }
 return {schema:"genui-unseen-panorama-score/v1",status:problems.length?"BLOCKED":"STRUCTURAL_PASS_SEMANTIC_UNVERIFIED",documents,modules,relations,evidenceRefs,anchors,issues:problems,
  modelRunsVerified:0,humanSemanticReviews:0,
  warning:"Source-quote matching is necessary but not semantic validity; cannot claim the Skill autonomously generated or correctly mapped an architecture."};
}
export function gitSource(root,repo,commit,file){
 if(!safe(repo)||!safe(file)||!(/^[a-f0-9]{40}$/.test(commit)))throw Error("Unsafe Git lookup");
 const r=spawnSync("git",["-C",path.join(root,repo),"show",commit+":"+file],{encoding:null,maxBuffer:2e6,timeout:15000});
 if(r.status!==0)throw Error("Git blob not accessible: "+repo+"/"+file);
 return r.stdout;
}
const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
 const manifestPath=path.resolve(process.argv[2]||"evals/unseen-panorama-2026-11-17.json");
 const outputPath=process.argv[3],repoRoot=process.argv[4];
 if(!outputPath||!repoRoot){console.error("Usage: node evals/score-unseen-panorama.mjs <manifest.json> <model-generated-candidate.json> <local-repos-parent-dir>");process.exit(2)}
 try{
  const manifest=JSON.parse(fs.readFileSync(manifestPath,"utf8"));
  const candidate=JSON.parse(fs.readFileSync(path.resolve(outputPath),"utf8"));
  const summary=scoreUnseen(manifest,candidate,(repo,commit,file)=>gitSource(path.resolve(repoRoot),repo,commit,file));
  console.log(JSON.stringify(summary,null,2));if(summary.status!=="STRUCTURAL_PASS_SEMANTIC_UNVERIFIED")process.exitCode=1;
 }catch(e){console.error("BLOCKED: "+e.message);process.exitCode=1}
}
