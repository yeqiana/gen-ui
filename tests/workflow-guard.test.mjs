import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const yaml=fs.readFileSync(path.join(root,".github/workflows/validate.yml"),"utf8");
test("CI has limited permissions, unit and actual browser jobs",()=>{
 assert.match(yaml,/^permissions:\s*\n\s+contents: read/m);
 assert.match(yaml,/browser:\s*\n\s+name:.*Chrome/);
 assert.match(yaml,/needs: validate/);
 assert.match(yaml,/browser-actions\/setup-chrome@v2/);
 assert.match(yaml,/GEN_UI_CHROME:/);
 assert.match(yaml,/runs-on: windows-latest/);
 assert.match(yaml,/shell: pwsh/);
 assert.match(yaml,/if \(\$LASTEXITCODE -ne 0\) \{ throw/);
 assert.doesNotMatch(yaml,/continue-on-error:\s*true/);
 assert.doesNotMatch(yaml,/pull_request_target|workflow_run/);
 assert.doesNotMatch(yaml,/permissions:\s*write-all/);
});
test("CI runs every locally supported Chrome suite and all three new Agent cases",()=>{
 for(const f of ["chrome-report-smoke.mjs","chrome-portal-smoke.mjs","chrome-portal-http-smoke.mjs","chrome-portal-directory-smoke.mjs","chrome-agent-output-smoke.mjs"]){
  assert.ok(yaml.includes("tests/"+f),"missing in workflow: "+f);
  assert.ok(fs.existsSync(path.join(root,"tests",f)));
 }
 assert.match(yaml,/HTML02.*HTML03.*HTML04/);
 assert.match(yaml,/node-version:\s*"22"/);
 assert.match(yaml,/persist-credentials:\s*false/);
});
test("HTML visual contract requires a persistent icon rail, image-text composition and restrained headings",()=>{
 const skill=fs.readFileSync(new URL("../SKILL.md",import.meta.url),"utf8");
 const contract=fs.readFileSync(new URL("../references/html-report-contract.md",import.meta.url),"utf8");
 assert.match(skill,/Collapsed navigation is an icon rail, never a hidden sidebar/);
 assert.match(skill,/Image-and-text first when visuals are supported/);
 assert.match(skill,/Prefer SVG icons over emoji/);
  assert.match(skill,/10 rows per page by default/);
 assert.match(contract,/keep the expand control inside the rail/);
 assert.match(contract,/Do not put a small subtitle immediately below the main H1/);
 assert.match(contract,/image \+ concise Chinese explanation/);
 assert.match(contract,/Prefer consistent local SVG section icons to emoji/);
  assert.match(contract,/10 rows per page/);
});

test("Agent browser CLI malformed inputs fail closed (cannot be green by accident)",()=>{
 const res=spawnSync(process.execPath,[path.join(root,"tests/chrome-agent-output-smoke.mjs"),"--case","HTML02","--input","missing.html","--report","unused.json"],{encoding:"utf8",timeout:8000});
 assert.notEqual(res.status,0);
 assert.match(res.stderr+res.stdout,/Required|missing|Error/);
});
