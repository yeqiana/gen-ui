// Optional offline evidence IDs: only frozen Git lines can become citations.
// Structural traceability is not a semantic audit of the selected relationship.
import crypto from "node:crypto";

const digest=x=>crypto.createHash("sha256").update(x).digest("hex").slice(0,12).toUpperCase();

export function evidenceCatalogue({case:source,files}){
 const entries=[],ids=new Set();
 for(const file of files){
  for(const [index,quote] of file.text.split(/\r?\n/).entries()){
   if(quote.trim().length<8)continue;
   const id="E"+digest(JSON.stringify([source.id,source.commit,file.file,file.sha256,index+1,quote]));
   if(ids.has(id))throw Error("Evidence ID collision: "+source.id);
   ids.add(id);
   entries.push({id,file:file.file,line:index+1,quote});
  }
 }
 for(const a of source.anchors){
  if(!entries.some(e=>e.file===a.file&&e.quote.includes(a.quote)))
   throw Error("Mandatory boundary cannot be represented by one frozen line: "+source.id+"/"+a.file);
 }
 return {schema:"genui-frozen-evidence-catalogue/v1",caseId:source.id,commit:source.commit,entries};
}

export function evidencePrompt(entry){
 const catalogue=evidenceCatalogue(entry),source=entry.case;
 const sample={schema:"genui-panorama-candidate/v1",cases:[{
  id:source.id,status:"documented",notes:"区分文档与真实验证",
  layers:[{title:"有来源的能力层",modules:[{id:"module-a",title:"模块名称",evidence:[{id:catalogue.entries[0]?.id||"E..."}]}]}],
  relations:[]}]};
 const rules=[
  "$gen-ui",
  "任务：依据以下冻结真实项目原文，制作产品能力或工作流结构，不是部署拓扑。",
  "只引用列表中存在的 Evidence ID：模块和关系的 evidence 必须是 [{id:\"E...\"}]，禁止返回 file、quote 或自编引用。离线校验器将从冻结 Git 原文还原 quote，不允许模型改写引文。",
  "ID 指向真实原文不等于语义支持：模块名称和关系必须被该行文本明确支持。没有证据时删去对应模块或关系，relations 可以为空。",
  "relations 如果非空，每条必须完整包含 from、to、type 和 evidence。from/to 必须引用已定义的两个不同模块 ID；type 必须是 depends、data、controls、composes、flow 之一，不允许省略。不具备明确关系来源就使用 relations:[]。",
  "当引用的 Mermaid 原文出现 -- Yes --> 或 -- No -->（含 True/False、是/否）时，这是带条件的控制分支：type 必须为 controls，另外必须设置 condition 为该箭头的原样标签，例如 {from:\"decision\",to:\"next\",type:\"controls\",condition:\"Yes\",evidence:[{id:\"E...\"}]}。不能用 depends 表示无条件依赖；没有明确条件箭头依据不得添加 condition。",
  "普通 Mermaid 流程图箭头（如 I --> P[Draft v0 plan]）代表流程转移时，type 使用 flow；不能仅因为步骤先后就写 depends。depends 仅用于原文确有依赖关系的情形，flow 也不能冒充生产执行已发生。",
  "按原文事实组织 2–8 层，不虚构数据库、部署、跨 Provider 路由、执行成功或测试结果。status 仅 documented/planned/unknown。",
  "指定的来源边界必须分别在至少一个模块或关系的 evidence ID 中真正覆盖，不得只写 notes。",
  "严格只输出一份 JSON 对象，不要 Markdown 围栏、前言或额外解释。目标结构：",
  JSON.stringify(sample),
  "必须保留的来源边界："+source.anchors.map(a=>a.file+" : "+a.quote).join("；"),
  "冻结原文证据行（ID | file:line | 原文；未列出的短行不能作为证据）：",
  ...catalogue.entries.map(e=>e.id+" | "+e.file+":"+e.line+" | "+e.quote)
 ];
 return rules.join("\n\n");
}

export function resolveEvidenceIds(candidate,sourceEntries){
 if(candidate?.schema!=="genui-panorama-candidate/v1"||!Array.isArray(candidate.cases))
  throw Error("Invalid evidence-ID candidate");
 const indexes=new Map(sourceEntries.map(entry=>{
  const catalogue=evidenceCatalogue(entry);
  return [entry.case.id,new Map(catalogue.entries.map(e=>[e.id,e]))];
 }));
 const cases=candidate.cases.map(c=>{
  const index=indexes.get(c.id);
  if(!index)throw Error("Unknown evidence-ID case: "+String(c.id));
  const expand=(items,context)=>{
   if(!Array.isArray(items))throw Error("Evidence IDs required: "+context);
   return items.map(item=>{
    if(!item||Array.isArray(item)||typeof item!=="object"||
       Object.keys(item).length!==1||typeof item.id!=="string")
     throw Error("Raw or mixed evidence is prohibited: "+context);
    const evidence=index.get(item.id);
    if(!evidence)throw Error("Unknown or foreign evidence ID: "+context);
    return {file:evidence.file,quote:evidence.quote};
   });
  };
  if(!Array.isArray(c.layers)||!Array.isArray(c.relations))
   throw Error("Invalid evidence-ID layers or relations: "+c.id);
  return {...c,
   layers:c.layers.map((layer,i)=>{
    if(!Array.isArray(layer.modules))throw Error("Invalid evidence-ID modules: "+c.id);
    return {...layer,modules:layer.modules.map((mod,j)=>({
     ...mod,evidence:expand(mod.evidence,c.id+"/module/"+i+"/"+j)
    }))};
   }),
   relations:c.relations.map((relation,i)=>({
    ...relation,evidence:expand(relation.evidence,c.id+"/relation/"+i)
   }))
  };
 });
 return {...candidate,cases};
}
