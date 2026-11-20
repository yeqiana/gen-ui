import test,{before,after} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {buildP1ReviewPacket} from "../scripts/build-p1-human-handoff.mjs";
import {verifyP1HumanHandoff} from "../scripts/verify-p1-human-handoff.mjs";
const master=path.join(os.tmpdir(),"genui-p1-verify-master-"+process.pid);
const copy=()=>{const target=fs.mkdtempSync(path.join(os.tmpdir(),"genui-p1-verify-case-"));fs.cpSync(master,target,{recursive:true});return target};
const withCopy=fn=>{const dir=copy();try{fn(dir)}finally{fs.rmSync(dir,{recursive:true,force:true})}};
before(()=>buildP1ReviewPacket(master));
after(()=>fs.rmSync(master,{recursive:true,force:true}));
test("80 item offline packet has complete checksums and real frozen source lines",()=>withCopy(dir=>{const r=verifyP1HumanHandoff(dir);assert.equal(r.status,"PASS");assert.equal(r.itemCount,80);assert.equal(r.release,"NO_GO");assert.equal(r.filesChecked,r.checksums)}));
test("edited review claim fails source checksum even if HTML still looks fine",()=>withCopy(dir=>{const f=path.join(dir,"review-items.json");fs.appendFileSync(f," ");const r=verifyP1HumanHandoff(dir);assert.equal(r.status,"FAIL");assert.ok(r.errors.some(x=>x.includes("review-items.json")))}));
test("malformed or duplicate SHA256SUMS entries cannot be accepted",()=>withCopy(dir=>{const f=path.join(dir,"SHA256SUMS.txt");const line=fs.readFileSync(f,"utf8").split(/\r?\n/).find(Boolean);fs.appendFileSync(f,line+"\n");assert.throws(()=>verifyP1HumanHandoff(dir),/Duplicate/)}));
test("extra unindexed file is detected",()=>withCopy(dir=>{fs.writeFileSync(path.join(dir,"extra.txt"),"unexpected");const r=verifyP1HumanHandoff(dir);assert.equal(r.status,"FAIL");assert.ok(r.errors.some(x=>x.includes("Unlisted file")))}));
test("edited human verdict stays blocked even after attacker regenerates checksum entry",()=>withCopy(dir=>{const f=path.join(dir,"review-items.json"),x=JSON.parse(fs.readFileSync(f));x[0].verdict="supported";fs.writeFileSync(f,JSON.stringify(x));const sums=path.join(dir,"SHA256SUMS.txt");let text=fs.readFileSync(sums,"utf8");const newHash=awaitHash(fs.readFileSync(f));text=text.replace(/^([a-f0-9]{64})(  review-items\.json)$/m,newHash+"$2");fs.writeFileSync(sums,text);const r=verifyP1HumanHandoff(dir);assert.equal(r.status,"FAIL");assert.ok(r.errors.some(x=>x.includes("Review item identity")))}));
import crypto from "node:crypto";
function awaitHash(b){return crypto.createHash("sha256").update(b).digest("hex")}
