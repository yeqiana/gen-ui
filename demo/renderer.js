"use strict";

// AI output is untrusted data; never execute model-provided HTML, scripts, or events.
const DEFAULT_SPEC = {
  version: "gen-ui-demo/v1",
  title: "Java Thread-Pool Configurator",
  description: "Adjust the slider to explore the teaching-only rule: maximum threads = core threads × 2.",
  controls: [{ id: "core", type: "slider", label: "Core threads", min: 1, max: 16, step: 1, value: 4 }],
  metrics: [
    { label: "Core threads", source: "core", multiplier: 1, suffix: " threads" },
    { label: "Maximum threads (example)", source: "core", multiplier: 2, suffix: " threads" }
  ],
  note: "Real sizing depends on workload, queue capacity, rejection strategy, and load testing."
};

const preview = document.getElementById("preview");
const input = document.getElementById("spec-input");
const status = document.getElementById("status");
const renderButton = document.getElementById("render-button");
const fileInput = document.getElementById("file-input");

function assertObject(x, name) {
  if (x === null || typeof x !== "object" || Array.isArray(x)) throw Error(name + " must be an object");
}
function assertFields(value, allowed, name) {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) throw Error(name + " unsupported field: " + key);
  }
}
function assertText(value, name, length = 160) {
  if (typeof value !== "string" || value.length > length) throw Error(name + " must be a string with at most " + length + " characters");
}
function assertNumber(value, name, min = -10000, max = 10000) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw Error(name + " must be a finite number within bounds");
}
function validate(spec) {
  assertObject(spec, "document");
  assertFields(spec, ["version", "title", "description", "controls", "metrics", "note"], "document");
  if (spec.version !== "gen-ui-demo/v1") throw Error("Unsupported protocol version");
  assertText(spec.title, "title", 100);
  assertText(spec.description, "description", 500);
  assertText(spec.note, "note", 300);
  if (!Array.isArray(spec.controls) || spec.controls.length < 1 || spec.controls.length > 8) throw Error("controls must contain 1–8 sliders");
  if (!Array.isArray(spec.metrics) || spec.metrics.length > 12) throw Error("metrics must contain at most 12 entries");
  const ids = new Set();
  for (const c of spec.controls) {
    assertObject(c, "control");
    assertFields(c, ["id", "type", "label", "min", "max", "step", "value"], "control");
    if (c.type !== "slider") throw Error("Only slider components are supported");
    if (typeof c.id !== "string" || !/^[a-zA-Z][\w-]{0,31}$/.test(c.id) || ids.has(c.id)) throw Error("Invalid or duplicate slider id");
    ids.add(c.id);
    assertText(c.label, "slider.label", 100);
    for (const key of ["min", "max", "step", "value"]) assertNumber(c[key], "slider." + key);
    if (c.min >= c.max || c.step <= 0 || c.value < c.min || c.value > c.max) throw Error("Slider bounds are invalid");
    if (Math.abs((c.value - c.min) / c.step - Math.round((c.value - c.min) / c.step)) > 1e-7) throw Error("Slider default value does not align to step");
  }
  for (const m of spec.metrics) {
    assertObject(m, "metric");
    assertFields(m, ["label", "source", "multiplier", "suffix"], "metric");
    assertText(m.label, "metric.label", 100);
    assertText(m.suffix, "metric.suffix", 40);
    if (typeof m.source !== "string" || !ids.has(m.source)) throw Error("metric.source refers to an unknown slider");
    assertNumber(m.multiplier, "metric.multiplier", -1000, 1000);
  }
  return spec;
}
function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = String(content);
  return node;
}
function render(spec) {
  validate(spec);
  const root = document.createDocumentFragment();
  root.append(element("h2", "", spec.title));
  root.append(element("p", "muted", spec.description));
  const values = Object.create(null);
  const outputs = [];
  for (const c of spec.controls) {
    values[c.id] = c.value;
    const field = element("div", "field");
    const top = element("div", "field-top");
    const label = element("label", "", c.label);
    const valueDisplay = element("output", "", c.value);
    const range = document.createElement("input");
    range.type = "range";
    range.id = "slider-" + c.id;
    range.min = String(c.min);
    range.max = String(c.max);
    range.step = String(c.step);
    range.value = String(c.value);
    label.htmlFor = range.id;
    range.setAttribute("aria-label", c.label);
    top.append(label, valueDisplay);
    field.append(top, range);
    range.addEventListener("input", () => {
      values[c.id] = Number(range.value);
      valueDisplay.textContent = range.value;
      for (const item of outputs) {
        item.node.textContent = String(Number((values[item.metric.source] * item.metric.multiplier).toFixed(8))) + item.metric.suffix;
      }
    });
    root.append(field);
  }
  const grid = element("dl");
  for (const metric of spec.metrics) {
    const box = element("div", "metric");
    box.append(element("dt", "", metric.label));
    const value = element("dd");
    value.textContent = String(Number((values[metric.source] * metric.multiplier).toFixed(8))) + metric.suffix;
    box.append(value);
    grid.append(box);
    outputs.push({ metric, node: value });
  }
  root.append(grid, element("p", "note", spec.note));
  preview.replaceChildren(root);
}
function tryRender() {
  try {
    if (input.value.length > 40000) throw Error("JSON too large (40,000-character limit)");
    render(JSON.parse(input.value));
    status.textContent = "Validated and rendered locally; no remote action was taken.";
    status.dataset.kind = "ok";
  } catch (error) {
    preview.replaceChildren(element("p", "note", "Rendering failed. Check JSON or use the Markdown fallback in examples/thread-pool.md."));
    status.textContent = "Invalid protocol: " + String(error.message || error);
    status.dataset.kind = "error";
  }
}
renderButton.addEventListener("click", tryRender);
fileInput.addEventListener("change", async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  if (file.size > 40000) {
    status.textContent = "File exceeds the 40 KB limit";
    status.dataset.kind = "error";
    return;
  }
  try {
    input.value = await file.text();
    tryRender();
  } catch (error) {
    status.textContent = "File read failed: " + String(error.message || error);
    status.dataset.kind = "error";
  }
});
input.value = JSON.stringify(DEFAULT_SPEC, null, 2);
tryRender();
