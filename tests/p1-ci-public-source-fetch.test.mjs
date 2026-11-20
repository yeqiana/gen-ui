import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
test("CI fetches only three allowlisted public pinned source repos, without publishing full raw docs",()=>{
 const w=fs.readFileSync(path.join(root,".github/workflows/validate.yml"),"utf8");
 const manifest=JSON.parse(fs.readFileSync(path.join(root,"evals/unseen-panorama-2026-11-17.json"),"utf8"));
 assert.deepEqual(manifest.cases.map(x=>x.repo).sort(),["agent-lead","distributed-system-audit","plan-ship"].sort());
 assert.ok(w.includes("Fetch exact public Git sources"));
 for(const n of manifest.cases.map(x=>x.repo))assert.ok(w.includes('"'+n+'"'),n);
 for(const term of ["Get-Content ./evals/unseen-panorama-2026-11-17.json","github.com/yeqiana/","--no-checkout","cat-file -e","Untrusted P1 source manifest","-notin $allowed"])
  assert.ok(w.includes(term),term);
 assert.equal(fs.existsSync(path.join(root,"evals/frozen-source")),false,"do not vendor five full source documents into GEN-UI");
});
