import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const cwd=new URL('../',import.meta.url);
test('A/B 固定历史基线对照当前提交，dry-run 不消耗模型额度',()=>{
 const head=spawnSync('git',['rev-parse','HEAD'],{cwd,encoding:'utf8'});assert.equal(head.status,0);
 const dry=spawnSync(process.execPath,['evals/skill-ab-runner.mjs','--dry-run'],{cwd,encoding:'utf8'});assert.equal(dry.status,0,dry.stderr);
 const manifest=JSON.parse(dry.stdout);assert.equal(manifest.current,head.stdout.trim());assert.equal(manifest.plannedRuns,6);assert.deepEqual(manifest.cases.map(x=>x.id),['MD','HTML','DIAGRAM']);assert.ok(manifest.skills.light.sha256);
});
