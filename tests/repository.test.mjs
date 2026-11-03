import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const docs = [
  "README.md", "README.zh-CN.md", "SKILL.md",
  "docs/integration.md", "evals/manual-evaluation.md",
  "references/renderer-contract.md", "examples/thread-pool.md"
];

test("Skill metadata and official display descriptor use gen-ui", () => {
  assert.match(read("SKILL.md"), /^---\r?\nname: gen-ui\r?\n/);
  assert.match(read("SKILL.md"), /\r?\ndescription:\s+\S/);
  assert.match(read("agents/openai.yaml"), /display_name: "Gen UI"/);
  assert.match(read("agents/openai.yaml"), /\$gen-ui/);
});

test("all local Markdown links point to existing files", () => {
  for (const file of docs) {
    const body = read(file);
    for (const match of body.matchAll(/!?\[[^\]]+\]\(([^)]+)\)/g)) {
      const dest = match[1].split("#")[0].trim();
      if (!dest || /^(?:https?:|mailto:)/i.test(dest)) continue;
      const target = path.resolve(root, path.dirname(file), decodeURIComponent(dest));
      assert.ok(target.startsWith(root + path.sep), file + ": link escapes repo: " + dest);
      assert.ok(fs.existsSync(target), file + ": broken link: " + dest);
    }
  }
});

test("legacy package identifiers do not remain in active files", () => {
  const active = [
    ...docs, "demo/index.html", "demo/renderer.js", "examples/thread-pool.ui.json",
    "agents/openai.yaml", "scripts/test-skill.ps1", ".github/workflows/validate.yml"
  ];
  for (const file of active) {
    const body = read(file);
    assert.doesNotMatch(body, /intelligent-ui(?:-skill|-demo)?|intelligent.ui.demo/i, file);
    assert.doesNotMatch(body, /https:\/\/github\.com\/yeqiana\/ai-coding-collaboration(?:\.git|\/)?/i, file);
  }
});

test("README installation/CI path and protocol versions remain consistent", () => {
  const cn = read("README.zh-CN.md");
  const en = read("README.md");
  assert.match(cn, /scripts\/test-skill\.ps1/);
  assert.match(en, /scripts\/test-skill\.ps1/);
  assert.match(read("SKILL.md"), /scripts\/test-skill\.ps1/);
  assert.match(read(".github/workflows/validate.yml"), /scripts\/test-skill\.ps1/);
  assert.equal(JSON.parse(read("examples/thread-pool.ui.json")).version, "gen-ui-demo/v1");
  assert.match(read("demo/renderer.js"), /gen-ui-demo\/v1/);
});