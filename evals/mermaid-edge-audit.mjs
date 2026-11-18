// Optional, pinned Mermaid edge-identity gate. Does not replace human semantic review.
import {evidenceCatalogue} from "./evidence-id-map.mjs";

export function auditFrozenMermaidEdges(entry,candidate,golden){
 const issues=[],fail=message=>issues.push(message);
 if(golden?.caseId!==entry.case.id||golden?.commit!==entry.case.commit||!Array.isArray(golden.edges)||!golden.edges.length)
  return {status:"BLOCKED",issues:["Golden mapping does not match frozen source"]};
 const selected=candidate?.cases?.find(c=>c.id===entry.case.id);
 if(!selected||candidate.cases.length!==1||!Array.isArray(selected.relations))
  return {status:"BLOCKED",issues:["Candidate identity/relations unavailable"]};
 const ids=new Set((selected.layers||[]).flatMap(l=>l.modules||[]).map(m=>m.id));
 const catalogue=evidenceCatalogue(entry),byId=new Map(catalogue.entries.map(x=>[x.id,x]));
 const seen=new Set();
 for(const edge of golden.edges){
  const key=edge.file+":"+edge.line;
  if(seen.has(key)){fail("Duplicate expected edge: "+key);continue}
  seen.add(key);
  const source=entry.files.find(f=>f.file===edge.file);
  const line=source?.text.split(/\r?\n/)[edge.line-1];
  const m=line?.match(/^\s*([A-Za-z][A-Za-z0-9]*)(?:\[[^\]\r\n]*\]|\{[^}\r\n]*\})?\s*(?:--\s*(Yes|No|True|False|是|否)\s*-->|-->)\s*([A-Za-z][A-Za-z0-9]*)/);
  if(!m||m[1]!==edge.sourceFrom||m[3]!==edge.sourceTo||(m[2]||null)!==(edge.condition||null)){
   fail("Frozen diagram edge mismatch: "+key);continue;
  }
  const wanted=catalogue.entries.find(e=>e.file===edge.file&&e.line===edge.line);
  if(!wanted){fail("Diagram line unavailable: "+key);continue}
  const matching=selected.relations.filter(r=>(r.evidence||[]).some(e=>e?.id===wanted.id));
  if(matching.length!==1){fail("Expected one relation for edge "+key+", got "+matching.length);continue}
  const r=matching[0],type=edge.condition?"controls":"flow";
  if(!ids.has(edge.from)||!ids.has(edge.to)||r.from!==edge.from||r.to!==edge.to||
     r.type!==type||(r.condition||null)!==(edge.condition||null))
   fail("Endpoint/type/condition mismatch: "+key);
 }
 if(selected.relations.length!==golden.edges.length)
  fail("Relation count differs from frozen diagram edge count");
 for(const [i,r] of selected.relations.entries()){
  if(!Array.isArray(r.evidence)||!r.evidence.length){fail("Missing relation evidence: "+i);continue}
  const refs=r.evidence.map(e=>byId.get(e?.id));
  if(refs.some(e=>!e)){fail("Unknown evidence ID: "+i);continue}
  if(!refs.some(e=>seen.has(e.file+":"+e.line)))fail("Unexpected non-diagram relation: "+i);
 }
 return {status:issues.length?"BLOCKED":"PASS",edgesExpected:golden.edges.length,issues,
  warning:"Pinned source-edge mapping detects drift/mutations; mapping is AI-assisted and not independent human attestation."};
}
