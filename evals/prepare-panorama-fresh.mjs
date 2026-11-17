#!/usr/bin/env node
// Prepare SHA-frozen unseen-project panorama trials; never invokes a model.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const validName=s=>/^[a-z0-9][a-z0-9-]{1,60}$/.test(s);
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function validateManifest(m){
 if(m.schema!=='genui-panorama-fresh-evaluation/v1'||!Array.isArray(m.cases)||m.cases.length<2)throw Error('Invalid manifest');
 const seen=new Set();
 for(const c of m.cases){
  if(!validName(c.id)||!validName(c.repo)||!/^[a-f0-9]{40}$/.test(c.commit)||!/^[a-f0-9]{64}$/.test(c.sha256)||!c.path)throw Error('Invalid source metadata');
  if(c.path.startsWith('/')||c.path.includes('..')||c.path.includes('\\'))throw Error('Unsafe path');
  if(seen.has(c.id))throw Error('Duplicate case');seen.add(c.id);
  if(!Array.isArray(c.evidence)||c.evidence.length<3||!Array.isArray(c.mustDistinguish)||c.mustDistinguish.length<3||!Array.isArray(c.mustNotClaim)||c.mustNotClaim.length<2)throw Error('Incomplete review rubric');
 }
 return m;
}
export function readFrozenSources(m,projectsRoot){
 validateManifest(m);
 return m.cases.map(c=>{
  const dir=path.join(projectsRoot,c.repo);
  if(!fs.existsSync(dir))throw Error('Missing local project: '+c.id);
  const r=spawnSync('git',['-C',dir,'show',c.commit+':'+c.path],{encoding:null,maxBuffer:5e6,timeout:25000});
  if(r.status!==0)throw Error('Frozen git blob unavailable: '+c.id);
  const data=r.stdout;
  if(hash(data)!==c.sha256)throw Error('Frozen SHA-256 mismatch: '+c.id);
  const text=data.toString('utf8');
  if(c.evidence.some(x=>!text.includes(x)))throw Error('Expected source evidence missing: '+c.id);
  if(/(?:github_pat_[A-Za-z0-9_]{10,}|ghp_[A-Za-z0-9]{10,}|sk-[A-Za-z0-9]{18,}|Bearer\s+[A-Za-z0-9_.-]{20,})/.test(text))throw Error('Possible secret in source: '+c.id);
  return {caseId:c.id,text,sha256:hash(data),bytes:data.length};
 });
}
export function promptForCase(c,content,explicit){
 const lines=[
  '仅根据下面的真实开源 Skill / 项目说明，制作一页产品能力与工作流架构全景图，输出静态离线 HTML。',
  '采用 GEN-UI SVG 系列视觉风格：白底、浅灰点阵、细描边、#3A83F7 蓝色强调。',
  '根据来源选择有意义的能力层数，参考顶部入口、横向能力分层、两侧贯穿性支撑，不为了填满画布硬凑六层。',
  '严格区分：Skill 指令、可选工具、待验证的能力。不能凭空加服务器、数据库、队列、部署拓扑或实际系统调用。',
  '每个模块都要能从原文找到依据；无关系证据就不要画箭头。图后提供文字版和未验证说明。',
  '无远程 CDN/脚本/网络；不访问外部服务；只输出完整 HTML，没有 Markdown 代码围栏和多余解释。',
  '来源：'+c.repo_ref+' @ '+c.commit.slice(0,12)+' / '+c.path,
  '【冻结的唯一来源正文】',content,'【来源结束】'
 ];
 return (explicit?'$gen-ui\n':'')+lines.join('\n');
}
export function prepare({manifest,projectsRoot,outDir}){
 const sources=readFrozenSources(manifest,projectsRoot);
 if(fs.existsSync(outDir)&&fs.readdirSync(outDir).length)throw Error('Output nonempty; refuse overwrite');
 fs.mkdirSync(outDir,{recursive:true});
 const records=[];
 for(const source of sources){
  const c=manifest.cases.find(x=>x.id===source.caseId),d=path.join(outDir,source.caseId);
  fs.mkdirSync(d,{recursive:true});
  for(const v of ['baseline','explicit'])fs.writeFileSync(path.join(d,v+'-prompt.md'),promptForCase(c,source.text,v==='explicit'));
  records.push({id:c.id,sha256:source.sha256,sourceBytes:source.bytes,variants:['baseline','explicit']});
 }
 const summary={schema:'genui-panorama-fresh-preparation/v1',state:'prepared-not-executed',cases:records,
  preparedPrompts:records.length*2,actualModelCalls:0,semanticReviews:0,humanReadingTrials:0,
  note:'No local inference provider was available. This is an evaluation plan, not evidence that the Skill generalized.'};
 fs.writeFileSync(path.join(outDir,'preparation.json'),JSON.stringify(summary,null,2)+'\n');
 return summary;
}
export function inspect(outDir,m){
 const rows=[];
 for(const c of validateManifest(m).cases)for(const variant of ['baseline','explicit']){
  const file=path.join(outDir,c.id,variant+'-answer.html'),present=fs.existsSync(file);
  rows.push({caseId:c.id,variant,state:present?'pending-independent-review':'not_run',
   bytes:present?fs.statSync(file).size:0});
 }
 return {schema:'genui-panorama-fresh-status/v1',rows,unreviewedAnswers:rows.filter(x=>x.state!=='not_run').length,
  verifiedSemanticSuccess:0,humanTrials:0,
  note:'Presence of generated HTML is NOT a semantic correctness verdict.'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const cmd=process.argv[2]||'prepare',manifest=validateManifest(JSON.parse(fs.readFileSync(path.resolve(process.argv[3]||'evals/panorama-fresh-cases-2026-11-17.json'),'utf8'))),
   sourceRoot=path.resolve(process.argv[4]||path.join(base,'..')),
   output=path.resolve(process.argv[5]||path.join(os.tmpdir(),'genui-panorama-fresh-2026-11-17'));
  if(cmd==='prepare')console.log(JSON.stringify(prepare({manifest,projectsRoot:sourceRoot,outDir:output}),null,2));
  else if(cmd==='status')console.log(JSON.stringify(inspect(output,manifest),null,2));
  else throw Error('Usage: node evals/prepare-panorama-fresh.mjs prepare|status manifest.json source-root output-dir');
 }catch(e){console.error(e.message);process.exitCode=1}
}
