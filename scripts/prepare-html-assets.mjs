#!/usr/bin/env node
/**
 * Copy only GEN-UI's public, static HTML dependencies into a report directory.
 * Does not create/overwrite HTML or copy any existing examples or private files.
 * Usage: node scripts/prepare-html-assets.mjs <report-directory>
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const sources=new Map([
 ["document.css","demo/documents/assets/document.css"],
 ["heading-nav.css","assets/heading-nav.css"],
 ["heading-nav.js","assets/heading-nav.js"],
 ["media-viewer.css","assets/media-viewer.css"],
 ["media-viewer.js","assets/media-viewer.js"],
 ["typography.css","assets/typography.css"],
 ["icons/gen-ui-mark.svg","assets/icons/gen-ui-mark.svg"]
]);
const destination=process.argv[2];
if(!destination||process.argv.length!==3||destination.startsWith("-")){
 console.error("Usage: node scripts/prepare-html-assets.mjs <report-directory>");
 process.exit(2);
}
const folder=path.resolve(destination);
if(folder===root){
 console.error("Refusing to stage assets over the GEN-UI source repository");
 process.exit(2);
}
const assets=path.join(folder,"assets");
const result={status:"PASS",directory:folder,created:[],existing:[],conflicts:[]};
for(const [target,source] of sources){
 const input=path.join(root,source),output=path.join(assets,target);
 if(!fs.existsSync(input))throw new Error("Missing source asset "+source);
 if(fs.existsSync(output)&&!fs.readFileSync(output).equals(fs.readFileSync(input)))
  result.conflicts.push(target);
}
if(result.conflicts.length){
 console.error(JSON.stringify({...result,status:"REFUSED"}));
 process.exit(1);
}
for(const [target,source] of sources){
 const output=path.join(assets,target);
 if(fs.existsSync(output)){result.existing.push(target);continue}
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.copyFileSync(path.join(root,source),output,fs.constants.COPYFILE_EXCL);
 result.created.push(target);
}
console.log(JSON.stringify(result));
