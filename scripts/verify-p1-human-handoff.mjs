import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const digest=b=>crypto.createHash("sha256").update(b).digest("hex");
const read=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const normalized=x=>String(x??"").replace(/[\r\n]+/g," ").trim();

export function verifyP1HumanHandoff(root=path.join(os.tmpdir(),"genui-p1-v6-human-review-20261120")){
 const errors=[], fail=x=>errors.push(x);
 const sumFile=path.join(root,"SHA256SUMS.txt");
 if(!fs.existsSync(sumFile))throw Error("Missing SHA256SUMS.txt");
 const declared=new Map();
 const lines=fs.readFileSync(sumFile,"utf8").trim().split(/\r?\n/).filter(Boolean);
 for(const line of lines){
  const m=line.match(/^([a-f0-9]{64})  (.+)$/);
  if(!m)throw Error("Malformed checksum entry");
  const rel=m[2];
  if(rel.includes("\\")||path.posix.isAbsolute(rel)||rel.split("/").some(x=>!x||x==="."||x===".."))throw Error("Unsafe checksum path");
  if(declared.has(rel))throw Error("Duplicate checksum path: "+rel);
  declared.set(rel,m[1]);
 }
 const actual=[];
 function visit(folder){
  for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
   const f=path.join(folder,entry.name),relative=path.relative(root,f).replaceAll("\\","/");
   if(entry.isSymbolicLink())throw Error("Symlink not allowed: "+relative);
   if(entry.isDirectory())visit(f);
   else if(entry.isFile()&&relative!=="SHA256SUMS.txt")actual.push(relative);
   else if(!entry.isFile())throw Error("Unsupported file entry: "+relative);
  }
 }
 visit(root);
 for(const f of actual){
  const expected=declared.get(f);
  if(!expected)fail("Unlisted file: "+f);
  else if(digest(fs.readFileSync(path.join(root,...f.split("/"))))!==expected)fail("Checksum mismatch: "+f);
 }
 for(const f of declared.keys())if(!actual.includes(f))fail("Missing checksummed file: "+f);
 const manifest=read(path.join(root,"manifest.json")),items=read(path.join(root,"review-items.json"));
 if(manifest.schema!=="genui-p1-v6-human-review-bundle/v1"||manifest.items!==80||manifest.p1Release!=="NO_GO"||manifest.candidateIntegrity!=="PASS"||manifest.decision!=="PENDING_80_OF_80")fail("Unexpected release/manifest claims");
 if(!Array.isArray(items)||items.length!==80)fail("Expected 80 review items");
 const expectedCases={"distributed-system-audit":33,"agent-lead":28,"plan-ship":19},count={},keys=new Set();
 if(Array.isArray(items))for(const item of items){
  count[item.caseId]=(count[item.caseId]||0)+1;
  const key=item.caseId+":"+item.key;
  if(keys.has(key)||item.verdict!=="PENDING"||!Array.isArray(item.cites)||item.cites.length===0)fail("Review item identity or decision mismatch");
  keys.add(key);
 }
 if(Object.entries(expectedCases).some(([k,v])=>count[k]!==v)||Object.keys(count).some(x=>!(x in expectedCases)))fail("Case counts incorrect");
 const sources=new Map();
 if(!Array.isArray(manifest.sourceCases)||manifest.sourceCases.length!==3)fail("Source manifest cases incorrect");
 else for(const c of manifest.sourceCases){
  if(!(c.caseId in expectedCases))throw Error("Unsafe or unknown case ID");
  const file=path.join(root,"candidates",c.caseId+".json"),raw=fs.readFileSync(file);
  if(digest(raw)!==c.sha256)fail("Candidate SHA mismatch: "+c.caseId);
  const candidate=JSON.parse(raw);
  if(candidate.cases?.length!==1||candidate.cases[0].id!==c.caseId)fail("Candidate case ID mismatch: "+c.caseId);
  for(const entry of c.sourceFiles){
   if(typeof entry.path!=="string"||entry.path.includes(":")||entry.path.split(/[\\/]/).some(x=>!x||x==="."||x===".."))throw Error("Unsafe source path in manifest");
   const name=c.caseId+"/"+entry.path;
   const file=path.join(root,"frozen",c.caseId,...entry.path.split("/")),content=fs.readFileSync(file,"utf8");
   if(digest(Buffer.from(content))!==entry.sha256)fail("Source hash mismatch: "+name);
   sources.set(name,content.split(/\r?\n/));
  }
 }
 if(Array.isArray(items))for(const item of items)for(const cite of item.cites??[]){
  const m=String(cite.ref).match(/^(.+):(\d+)$/);
  const line=m&&sources.get(item.caseId+"/"+m[1])?.[Number(m[2])-1];
  if(line===undefined||normalized(line)!==cite.text)fail("Citation text/line mismatch: "+item.caseId+"/"+item.key);
 }
 const csvFile=path.join(root,"review-decisions-template.csv");
 if(Object.hasOwn(manifest,"reviewTemplate")){
  if(manifest.reviewTemplate!=="review-decisions-template.csv")fail("Unexpected review template declaration");
  if(!fs.existsSync(csvFile))fail("Required review-decision CSV template missing");
 }
 if(fs.existsSync(csvFile)&&Array.isArray(items)){
  const csvCell=value=>{const str=String(value??"");return '"'+(/^[=+\-@]/.test(str)?"'"+str:str).replaceAll('"','""')+'"';};
  const fields=[["case_id","item_key","claim","source_refs","decision","reason","reviewer","reviewed_at"],...items.map(item=>[
   item.caseId,item.key,normalized(item.claim),item.cites.map(c=>c.ref).join(";"),"PENDING","","",""
  ])];
  const exact="\uFEFF"+fields.map(row=>row.map(csvCell).join(",")).join("\r\n")+"\r\n";
  if(!fs.readFileSync(csvFile).equals(Buffer.from(exact)))fail("Sealed CSV template differs from pending review items");
 }
 const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
 if((html.match(/<details>/g)||[]).length!==80||/<script\b|<iframe\b/i.test(html))fail("Offline HTML safety or item count invalid");
 return {schema:"genui-p1-human-handoff-verify/v1",status:errors.length?"FAIL":"PASS",itemCount:items.length,sourceFileCount:sources.size,filesChecked:actual.length,checksums:declared.size,release:"NO_GO",errors,warning:"Internal checksums are not authenticated signatures; compare the outer ZIP SHA256 through a trusted channel."};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const result=verifyP1HumanHandoff(process.argv[2]);console.log(JSON.stringify(result,null,2));if(result.status!=="PASS")process.exitCode=1}catch(e){console.error("VERIFY_FAIL: "+e.message);process.exitCode=1}
}
