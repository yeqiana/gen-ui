#!/usr/bin/env node
// Capture illustrative Before / After pages from real offline HTML, not mock images.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {spawnSync} from "node:child_process";
import {fileURLToPath,pathToFileURL} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const chrome=[process.env.GEN_UI_CHROME,"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe","C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe","/usr/bin/google-chrome","/usr/bin/chromium"].filter(Boolean).find(fs.existsSync);
if(!chrome)throw Error("Chrome or Edge not found");
const output=path.join(root,"demo","assets");fs.mkdirSync(output,{recursive:true});
for(const lang of ["zh","en"]){
 const from=path.join(root,"demo","before-after."+lang+".html"),to=path.join(output,"before-after-"+lang+"-preview.png");
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),"genui-readme-"));
 try{
  const run=spawnSync(chrome,["--headless=new","--disable-gpu","--hide-scrollbars","--no-first-run","--user-data-dir="+profile,"--window-size=1440,900","--screenshot="+to,pathToFileURL(from).href],{encoding:"utf8",timeout:55000,windowsHide:true});
  if(run.status!==0||!fs.existsSync(to))throw Error("Screenshot failed: "+lang+" "+run.stderr?.slice(-300));
  const data=fs.readFileSync(to);
  if(data.subarray(0,8).toString("hex")!=="89504e470d0a1a0a"||data.length<12000)throw Error("Invalid image: "+lang);
  console.log(lang+": "+data.length+" bytes, "+data.readUInt32BE(16)+"x"+data.readUInt32BE(20));
 }finally{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});}
}
