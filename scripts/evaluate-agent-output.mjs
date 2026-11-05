#!/usr/bin/env node
/**
 * Offline static quality gate for generated Agent artifacts.
 * A passing result is NOT evidence that an Agent was run, or that interactive
 * behavior, visual quality or accessibility have been verified.
 * It never executes generated JavaScript and never makes network calls.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const MAX_BYTES=5*1024*1024;
export const catalog=JSON.parse(fs.readFileSync(path.join(root,"evals/agent-cases.json"),"utf8"));
const cases=new Map(catalog.cases.map(x=>[x.id,x]));
const labels={
  doctype:"DOCTYPE 文档声明",
  chinese:"中文页面声明",
  "one-h1":"唯一一级标题",
  nav:"导航区域",
  table:"语义表格",
  nowrap:"表头与单元格不换行",
  sticky:"表格首列固定",
  filter:"筛选控件",
  pagination:"分页结构及每页 20 条起",
  status:"成功失败状态",
  dialog:"弹窗或抽屉",
  tabs:"页内标签语义",
  external:"清晰标注的新标签页链接",
  "no-inline-events":"没有内联事件脚本",
  "markdown-format":"Markdown 标题或列表",
  "no-html-document":"没有 HTML 文档",
  "no-fake-widgets":"没有伪造的终端交互控件"
};
function localStyles(content,base){
  let css=[...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(x=>x[1]).join("\n");
  const styles=[...content.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/gi)];
  for(const [,href] of styles){
    if(!href||/^(?:[a-z]+:|\/\/)/i.test(href))continue;
    const file=path.resolve(base,href);
    // Local stylesheet only; do not follow arbitrary traversal or load network URLs.
    if(!file.startsWith(base+path.sep)||!file.toLowerCase().endsWith(".css"))continue;
    if(fs.existsSync(file)&&fs.statSync(file).isFile()&&fs.statSync(file).size<=MAX_BYTES)
      css+="\n"+fs.readFileSync(file,"utf8");
  }
  return css;
}
export function evaluateOutput(id,source,css=""){
  const spec=cases.get(id);
  if(!spec)throw Error("未知评测用例："+id);
  const markup=spec.format==="html"?source:"";
  const cssNoWrap=/\bwhite-space\s*:\s*nowrap\b/i.test(css);
  const rules={
    doctype:/<!doctype\s+html\b/i.test(markup),
    chinese:/<html\b[^>]*lang=["']zh-CN["']/i.test(markup),
    "one-h1":(markup.match(/<h1\b/gi)||[]).length===1,
    nav:/<nav\b/i.test(markup),
    table:/<table\b/i.test(markup)&&/<th\b/i.test(markup),
    nowrap:cssNoWrap && /\b(?:th|thead)\b[\s\S]{0,700}\bwhite-space\s*:\s*nowrap\b/i.test(css),
    sticky:/\bposition\s*:\s*sticky\b/i.test(css)&&/\bleft\s*:\s*0(?:px)?\b/i.test(css),
    filter:/<(?:select|input)\b/i.test(markup)&&/(?:筛选|查询|搜索|状态|模块)/.test(markup),
    pagination:/<select\b[^>]*id=["'][^"']*(?:size|page)[^"']*["']/i.test(markup)&&/value=["']20["']/i.test(markup)&&/(?:上一页|下一页|分页)/.test(markup),
    status:/(?:成功|失败)/.test(markup),
    dialog:/<dialog\b/i.test(markup),
    tabs:/role=["']tablist["']/i.test(markup)&&/role=["']tabpanel["']/i.test(markup),
    external:/target=["']_blank["']/i.test(markup)&&/rel=["'][^"']*noopener[^"']*noreferrer/i.test(markup)&&/新标签页/.test(markup),
    "no-inline-events":!/\bon(?:click|change|submit|error|load|mouseover)\s*=/i.test(markup),
    "markdown-format":/^(?:#{1,6}\s+|[-*]\s+|\d+\.\s+)/m.test(source),
    "no-html-document":!/<(?:!doctype\s+html|html\b|head\b|body\b)/i.test(source),
    "no-fake-widgets":!/<(?:button|input|select|dialog)\b/i.test(source)&&!/GenUI\.|role=["'](?:tab|slider)["']/i.test(source)
  };
  const checks=spec.checks.map(key=>{
    if(!(key in rules))throw Error("未知规则："+key);
    return {id:key,label:labels[key],passed:rules[key]};
  });
  return {caseId:id,caseName:spec.name,format:spec.format,staticGate:checks.every(x=>x.passed)?"pass":"fail",
    checks,manualChecks:spec.manual,
    caveat:"静态启发式检查不能证明模型实际运行、筛选联动、图表真实性、键盘体验或用户视觉质量。"};
}
export function auditFile(id,filepath){
  const file=path.resolve(filepath);
  if(!fs.existsSync(file)||!fs.statSync(file).isFile())throw Error("输入文件不存在");
  if(fs.statSync(file).size>MAX_BYTES)throw Error("输入文件超过 5MB");
  const source=fs.readFileSync(file,"utf8");
  return evaluateOutput(id,source,localStyles(source,path.dirname(file)));
}
function parseArgs(args){
  const out={};
  for(let i=0;i<args.length;i+=2){
    const flag=args[i];
    if(!["--case","--input","--producer","--report"].includes(flag)||!args[i+1])
      throw Error("参数格式：--case ID --input 文件 [--producer 来源] [--report JSON文件]");
    out[flag.slice(2)]=args[i+1];
  }
  if(!out.case||!out.input)throw Error("缺少 --case 或 --input");
  return out;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=parseArgs(process.argv.slice(2)),report=auditFile(args.case,args.input);
    report.artifact=path.resolve(args.input);
    report.claimedProducer=args.producer||"未注明（不得推断 Agent 已运行）";
    report.producerVerified=false;
    report.evaluatedAt=new Date().toISOString();
    if(args.report){
      const target=path.resolve(args.report);
      fs.mkdirSync(path.dirname(target),{recursive:true});
      fs.writeFileSync(target,JSON.stringify(report,null,2)+"\n","utf8");
    }
    console.log(JSON.stringify(report,null,2));
    if(report.staticGate!=="pass")process.exitCode=1;
  }catch(error){console.error("评测失败："+error.message);process.exitCode=2}
}
