import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("seven diagram types have distinct semantic grammars", () => {
  const js = read("assets/semantic-diagrams.js");
  const types = ["sequence", "mind", "deploy", "er", "activity", "swim", "component"];
  for (const type of types) assert.match(js, new RegExp(type), type);
  for (const contract of [
    "participants:", "messages:", "lifeline", "activation", "children:",
    "zones:", "entities:", "fields:", "relations:", "decision", "lanes:",
    "ports:", "semantic-inspector", "data-selectable", "selectMessage",
    "data-toggle-branch", "data-zone-toggle", "data-field", "path-retry",
    "data-lane-toggle", "data-port"
  ]) assert.ok(js.includes(contract), contract);
  assert.match(js, /semantic-arrow-.*instanceCounter/);
});

test("diagram connector labels use opaque backgrounds and are selectable", () => {
  const js = read("assets/semantic-diagrams.js");
  const css = read("assets/semantic-diagrams.css");
  assert.match(js, /semantic-edge-label-bg/);
  assert.match(js, /fill:"#fff"/);
  assert.match(js, /data-selectable/);
  assert.match(css, /\.semantic-edge-label-bg\{fill:#fff/);
  const report = read("demo/report.html");
  assert.equal((report.match(/class="flow-edge-label-bg"/g) || []).length, 3);
});

test("Chinese and English reports expose all seven live SVG diagrams", () => {
  for (const file of ["demo/report.html", "demo/report.en.html"]) {
    const html = read(file);
    for (const type of ["sequence", "mind", "deploy", "er", "activity", "swim", "component"]) {
      assert.ok(html.includes('data-semantic-diagram="' + type + '"'), file + " " + type);
    }
    assert.match(html, /semantic-diagrams\.css/);
    assert.match(html, /semantic-diagrams\.js/);
  }
});

test("technical documents use context-appropriate diagrams and load the offline renderer", () => {
  const expected = {
    "project-analysis.html": ["mind"],
    "architecture-design.html": ["sequence", "deploy", "er", "component"],
    "implementation-plan.html": ["activity", "swim"],
    "test-acceptance.html": ["sequence", "activity"]
  };
  for (const [name, types] of Object.entries(expected)) {
    for (const file of ["demo/documents/" + name, "demo/documents/en/" + name]) {
      const html = read(file);
      for (const type of types) assert.ok(html.includes('data-semantic-diagram="' + type + '"'), file + " " + type);
      assert.match(html, /semantic-diagrams\.css/);
      assert.match(html, /semantic-diagrams\.js/);
    }
  }
});

test("image and code controls are pinned to their upper-right corners", () => {
  const media = read("assets/media-viewer.js");
  const mediaCss = read("assets/media-viewer.css");
  const reportCss = read("demo/ui-refresh.css");
  const docsCss = read("demo/documents/assets/document.css");
  assert.match(media, /frame\.appendChild\(trigger\)/);
  assert.match(media, /setIcon\(trigger,"expand"/);
  assert.match(mediaCss, /\.genui-image-frame\{position:relative/);
  assert.match(mediaCss, /\.genui-image-open\{position:absolute;top:8px;right:8px/);
  assert.match(reportCss, /\.code-copy\{position:absolute;top:7px;right:8px/);
  assert.match(docsCss, /\.doc-section pre \.code-copy\{position:absolute;top:7px;right:8px/);
});

test("Skill and HTML contract require semantic interactions, not drag-only diagrams", () => {
  const skill = read("SKILL.md");
  const contract = read("references/html-report-contract.md");
  for (const source of [skill, contract]) {
    assert.match(source, /sequence step/);
    assert.match(source, /expand\/collapse/);
    assert.match(source, /activity path filter/);
    assert.match(source, /component[- ]port visibility/);
    assert.match(source, /opaque background/);
    assert.match(source, /upper-right corner/);
  }
});
