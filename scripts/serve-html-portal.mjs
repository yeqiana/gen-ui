#!/usr/bin/env node
/**
 * Loopback-only server for interactive HTML portal preview.
 * No directory listings, uploads, writes, remote host binding or dependencies.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {fileURLToPath} from "node:url";
const mime={html:"text/html; charset=utf-8",htm:"text/html; charset=utf-8",css:"text/css; charset=utf-8",js:"text/javascript; charset=utf-8",mjs:"text/javascript; charset=utf-8",json:"application/json; charset=utf-8",svg:"image/svg+xml",png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",webp:"image/webp",ico:"image/x-icon",woff:"font/woff",woff2:"font/woff2",ttf:"font/ttf",txt:"text/plain; charset=utf-8"};
function inside(root,file){const rel=path.relative(root,file);return rel===""||(!rel.startsWith(".."+path.sep)&&rel!==".."&&!path.isAbsolute(rel));}
function parseArgs(args){
 const out={};
 for(let i=0;i<args.length;i++){
  if(args[i]==="--help")return {help:true};
  const flag=args[i];
  if(!["--dir","--port"].includes(flag)||!args[i+1]||Object.hasOwn(out,flag))throw Error("用法：node scripts/serve-html-portal.mjs --dir <目录> [--port 8765]");
  out[flag]=args[++i];
 }
 if(!out["--dir"])throw Error("必须指定 --dir");
 const port=out["--port"]===undefined?8765:Number(out["--port"]);
 if(!Number.isInteger(port)||port<0||port>65535)throw Error("端口号需要介于 0 与 65535 之间");
 return {dir:out["--dir"],port};
}
export async function startPortalServer({dir,port=8765}={}){
 if(!dir)throw Error("必须指定目录");
 const root=fs.realpathSync(path.resolve(dir));
 if(!fs.statSync(root).isDirectory())throw Error("源目录不是文件夹");
 // Capture the loopback Host while listening; server.address() becomes null during close.
 let expectedHost;
 const server=http.createServer((req,res)=>{
  const respond=(status,message)=>{res.writeHead(status,{"Content-Type":"text/plain; charset=utf-8","X-Content-Type-Options":"nosniff","Cache-Control":"no-store"});res.end(message)};
  // Loopback binding alone does not prevent browser DNS rebinding.
  // Late shutdown requests must not query mutable listener state.
  if(req.headers.host!==expectedHost){respond(403,"仅允许本机预览地址");return}
  if(req.method!=="GET"&&req.method!=="HEAD"){respond(405,"此预览服务只允许读取文件");return}
  let rel;
  try{
   const u=new URL(req.url,"http://127.0.0.1");
   if(u.origin!=="http://127.0.0.1")throw Error("invalid URL");
   rel=decodeURIComponent(u.pathname).replace(/^\/+/,"");
   if(!rel)rel="index.html";
   if(rel.includes("\0")||rel.includes("\\")||rel.split("/").some(x=>x.startsWith(".")||x===".."||x===""||x.includes(":"))){respond(403,"文件访问被拒绝");return}
  }catch{respond(400,"地址格式无效");return}
  const target=path.resolve(root,rel);
  if(!inside(root,target)){respond(403,"不允许读取目录外文件");return}
  let file,st;
  try{file=fs.realpathSync(target);st=fs.statSync(file)}catch{respond(404,"文件不存在");return}
  if(!inside(root,file)||!st.isFile()){respond(403,"文件不可访问");return}
  const ext=path.extname(file).slice(1).toLowerCase();
  if(!Object.hasOwn(mime,ext)){respond(403,"不支持的预览文件类型");return}
  res.writeHead(200,{"Content-Type":mime[ext],"X-Content-Type-Options":"nosniff","Cache-Control":"no-store","X-Frame-Options":"SAMEORIGIN"});
  if(req.method==="HEAD"){res.end();return}
  const stream=fs.createReadStream(file);
  stream.on("error",()=>{res.destroy()});stream.pipe(res);
 });
 await new Promise((resolve,reject)=>{
  server.once("error",reject);
  server.listen(port,"127.0.0.1",()=>{
   const address=server.address();
   if(!address||typeof address==="string"){reject(Error("无法获取本机预览端口"));return}
   expectedHost="127.0.0.1:"+address.port;
   resolve();
  });
 });
 const address=server.address();
 return {server,url:"http://127.0.0.1:"+address.port+"/index.html",root};
}
const main=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(main){
 try{
  const opts=parseArgs(process.argv.slice(2));
  if(opts.help)console.log("用法：node scripts/serve-html-portal.mjs --dir <目录> [--port 8765]");
  else{
   const result=await startPortalServer(opts);
   console.log("本地交互预览："+result.url);
   console.log("仅监听 127.0.0.1。按 Ctrl+C 停止，页面资源不会被修改。");
  }
 }catch(error){console.error(error.message);process.exitCode=1}
}