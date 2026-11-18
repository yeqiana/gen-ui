// Offline, optional citation coverage only. Never infers semantic correctness.
import {evidenceCatalogue} from "./evidence-id-map.mjs";
export function frozenSectionCoverage(entry,candidate,{file,headingPattern=/^##\s+(\d+)\.\s+(.+)$/}={}){
 if(!file||!entry.files?.some(x=>x.file===file))throw Error("Unknown frozen coverage source");
 const source=entry.files.find(x=>x.file===file);
 const lines=source.text.split(/\r?\n/),sections=[];
 for(let i=0;i<lines.length;i++){
  const match=lines[i].match(headingPattern);
  if(match)sections.push({number:Number(match[1]),title:match[2],startLine:i+1,endLine:lines.length,sourceHeading:lines[i]});
 }
 if(!sections.length)throw Error("No numbered frozen source sections");
 for(let i=0;i<sections.length-1;i++)sections[i].endLine=sections[i+1].startLine-1;
 const c=candidate?.cases?.find(x=>x.id===entry.case.id);
 if(!c||candidate.cases?.length!==1)throw Error("Invalid one-case frozen candidate");
 const valid=new Map(evidenceCatalogue(entry).entries.map(e=>[e.id,e]));
 const items=[...(c.layers||[]).flatMap(l=>l.modules||[]).map(m=>({id:m.id,title:m.title,evidence:m.evidence,kind:"module"})),
  ...(c.relations||[]).map((r,i)=>({id:"relation:"+i,title:r.type,evidence:r.evidence,kind:"relation"}))];
 const citations=[];
 for(const i of items)for(const ref of i.evidence||[]){
  if(!ref||typeof ref.id!=="string")throw Error("Evidence-ID references required");
  const matched=valid.get(ref.id);if(!matched)throw Error("Unknown or foreign evidence ID: "+i.id);
  if(matched.file===file)citations.push({...matched,claim:i.title,item:i.id,kind:i.kind});
 }
 const result=sections.map(x=>{
  const citationsHere=citations.filter(e=>e.line>=x.startLine&&e.line<=x.endLine);
  return {number:x.number,title:x.title,startLine:x.startLine,endLine:x.endLine,citedLines:[...new Set(citationsHere.map(e=>e.line))].sort((a,b)=>a-b),
    citedItemIds:[...new Set(citationsHere.map(e=>e.item))],
    status:citationsHere.length?"CITED_NOT_SEMANTICALLY_VERIFIED":"NO_DIRECT_CITATION"};
 });
 return {schema:"genui-frozen-section-citation-coverage/v1",caseId:entry.case.id,commit:entry.case.commit,file,sectionCount:sections.length,
  sectionsWithDirectCitation:result.filter(x=>x.citedLines.length).length,uncitedSections:result.filter(x=>!x.citedLines.length).map(x=>x.number),
  sections:result,warning:"A direct citation is not evidence that the section was faithfully covered, implemented, or tested."};
}
