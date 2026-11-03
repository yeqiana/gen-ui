import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const code = fs.readFileSync(path.join(root, "demo/renderer.js"), "utf8");
const sample = JSON.parse(fs.readFileSync(path.join(root, "examples/thread-pool.ui.json"), "utf8"));

class FakeNode {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.listeners = {};
    this.dataset = {};
    this.textContent = "";
    this.value = "";
    this.files = [];
  }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = [...items]; }
  addEventListener(type, callback) { this.listeners[type] = callback; }
  setAttribute(key, value) { this[key] = value; }
}
function setup() {
  const elements = new Map();
  for (const id of ["preview", "spec-input", "status", "render-button", "file-input"]) {
    elements.set(id, new FakeNode(id));
  }
  const document = {
    getElementById(id) { return elements.get(id); },
    createElement(tag) { return new FakeNode(tag); },
    createDocumentFragment() { return new FakeNode("fragment"); }
  };
  const context = vm.createContext({ document });
  vm.runInContext(code, context, { filename: "renderer.js" });
  return { context, elements };
}
function find(node, tag) {
  const result = [];
  if (node.tagName === tag) result.push(node);
  for (const child of node.children || []) result.push(...find(child, tag));
  return result;
}
function copy(object) {
  return JSON.parse(JSON.stringify(object));
}

test("Default JSON renders and metrics update on slider input", () => {
  const { elements } = setup();
  const preview = elements.get("preview");
  assert.equal(elements.get("status").dataset.kind, "ok");
  let inputs = find(preview, "input");
  assert.equal(inputs.length, 1);
  const slider = inputs[0];
  slider.value = "6";
  slider.listeners.input();
  assert.deepEqual(find(preview, "dd").map(n => n.textContent), ["6 threads", "12 threads"]);
});

test("Valid sample accepted; unknown version or fields rejected", () => {
  const { context } = setup();
  assert.equal(context.validate(copy(sample)).title, sample.title);
  assert.throws(() => context.validate({ ...copy(sample), version: "DIL" }), /version/);
  assert.throws(() => context.validate({ ...copy(sample), onClick: "alert(1)" }), /unsupported field/);
});

test("Invalid components, IDs, references and bounds rejected", () => {
  const { context } = setup();
  const wrongType = copy(sample);
  wrongType.controls[0].type = "html";
  assert.throws(() => context.validate(wrongType), /slider/);

  const duplicated = copy(sample);
  duplicated.controls.push({ ...duplicated.controls[0] });
  assert.throws(() => context.validate(duplicated), /duplicate/);

  const wrongReference = copy(sample);
  wrongReference.metrics[0].source = "unknown";
  assert.throws(() => context.validate(wrongReference), /unknown/);

  const overflow = copy(sample);
  overflow.controls[0].value = 100;
  assert.throws(() => context.validate(overflow), /bounds/);

  const stepMismatch = copy(sample);
  stepMismatch.controls[0].step = 3;
  stepMismatch.controls[0].value = 5;
  assert.throws(() => context.validate(stepMismatch), /step/);
});

test("HTML-like text remains plain; malformed JSON cannot execute code", () => {
  const { context, elements } = setup();
  const literal = copy(sample);
  literal.title = "<img src=x onerror=alert(1)>";
  context.render(literal);
  const headers = find(elements.get("preview"), "h2");
  assert.equal(headers[0].textContent, literal.title);

  elements.get("spec-input").value = '{"version":';
  elements.get("render-button").listeners.click();
  assert.equal(elements.get("status").dataset.kind, "error");
  assert.match(elements.get("preview").children[0].textContent, /Rendering failed/);
});
