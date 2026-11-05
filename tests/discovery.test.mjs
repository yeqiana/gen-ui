import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (name) => fs.readFileSync(path.join(root, name), "utf8");
const docs = [
  "SKILL.md", "README.md", "README.zh-CN.md", "CHANGELOG.md",
  "docs/integration.md", "docs/faq.md", "docs/geo.md", "docs/geo.zh-CN.md",
  "evals/manual-evaluation.md", "evals/discovery-baseline.md",
  "references/renderer-contract.md", "references/html-report-contract.md", "examples/code-review.md",
  "examples/acceptance-plan.md", "examples/thread-pool.md",
  "examples/thread-pool.zh-CN.md"
];

test("English-first normative Skill, Chinese response support, safe fallback", () => {
  const content = read("SKILL.md");
  assert.match(content, /^---\r?\nname: gen-ui\r?\ndescription: Use when /);
  assert.match(content, /Follow the user's language/);
  assert.match(content, /Markdown fallback/i);
  assert.match(content, /scripts\/test-skill\.ps1/);
});

test("All documentation relative links resolve within this repository", () => {
  for (const name of docs) {
    const content = read(name);
    for (const link of content.matchAll(/!?\[[^\]]+\]\(([^)]+)\)/g)) {
      const uri = link[1].split("#")[0].trim();
      if (!uri || /^(?:https?:|mailto:)/i.test(uri)) continue;
      const target = path.resolve(root, path.dirname(name), decodeURIComponent(uri));
      assert.ok(target.startsWith(root + path.sep), name + " escapes the repository: " + uri);
      assert.ok(fs.existsSync(target), name + " missing target: " + uri);
    }
  }
});

test("Three independent examples distinguish demonstrations from observed results", () => {
  for (const file of ["code-review.md", "acceptance-plan.md", "thread-pool.md"]) {
    const content = read("examples/" + file);
    assert.match(content, /illustrative/i, file);
    assert.match(content, /not|unverified/i, file);
    assert.ok(read("README.md").includes("examples/" + file));
    assert.ok(read("README.zh-CN.md").includes("examples/" + file));
  }
});

test("GEO guidance explicitly separates recommendations from verified metadata", () => {
  const geo = read("docs/geo.md");
  const baseline = read("evals/discovery-baseline.md");
  assert.match(geo, /manual application required/i);
  assert.match(geo, /Topics/);
  assert.match(geo, /llms\.txt/);
  assert.match(baseline, /NOT MEASURED/);
  assert.match(baseline, /Not checked/);
  assert.doesNotMatch(baseline, /GEO score:\s*[0-9]+/i);
});

test("English demo and both language JSON samples agree on schema", () => {
  const html = read("demo/index.html");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /Markdown fallback/);
  assert.doesNotMatch(html, /[\u4e00-\u9fff]/);
  for (const file of ["thread-pool.ui.json", "thread-pool.ui.zh-CN.json"]) {
    const example = JSON.parse(read("examples/" + file));
    assert.equal(example.version, "gen-ui-demo/v1");
    assert.equal(example.controls[0].value, 4);
    assert.equal(example.metrics.length, 2);
  }
});

test("GEO materials do not claim a live site or guaranteed rankings", () => {
  const geo = read("docs/geo.md");
  assert.match(geo, /not a live site/);
  assert.match(geo, /No optimization guarantees/);
  assert.match(read("README.zh-CN.md"), /未测量/);
});