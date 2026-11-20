import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = name => fs.readFileSync(path.join(root, name), "utf8");

test("GEN-UI states comprehension before decoration and preserves Markdown-first routing", () => {
  const skill = file("SKILL.md");
  assert.match(skill, /make AI answers easier to understand/i);
  assert.match(skill, /Know the reader/);
  assert.match(skill, /define unfamiliar terms in context/);
  assert.match(skill, /analogy only if helpful/);
  assert.match(skill, /Preserve factual boundaries/);
  assert.match(skill, /Markdown by default|Markdown fallback/);
  assert.match(skill, /never invent results or sources/);
  assert.ok(Buffer.byteLength(skill, "utf8") <= 5120, "core SKILL.md should remain below 5 KiB");
});

test("four reader scenarios cover ordinary language, numeric decisions, technology and evidence", () => {
  const doc = file("evals/comprehension-closure-2026-11-20.md");
  const ids = [...doc.matchAll(/^### (C0\d) ·/gm)].map(match => match[1]);
  assert.deepEqual(ids, ["C01", "C02", "C03", "C04"]);
  for (const name of ["输入事实", "用户问题", "理解题", "防误导"]) {
    assert.equal((doc.match(new RegExp("\\*\\*" + name, "g")) ?? []).length, 4, name);
  }
  for (const phrase of ["真实模型新 A/B 生成 0 对", "本轮真人读者 0", "理解增益未证明", "不把 PR #13 的专项内容合并到 main"]) {
    assert.ok(doc.includes(phrase), "missing evidence boundary " + phrase);
  }
});

test("simpler wording does not erase exact concepts, conditions or risks", () => {
  const ref = file("references/information-design-decision.md");
  assert.match(ref, /类比.*不能代替事实/);
  assert.match(ref, /通俗解释保留关键条件/);
  assert.match(ref, /不把简单问题转成 HTML/);
});
