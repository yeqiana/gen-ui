import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "assets/code-blocks.js"), "utf8");
const html = fs.readFileSync(path.join(root, "demo/report.html"), "utf8");
const css = fs.readFileSync(path.join(root, "demo/ui-refresh.css"), "utf8");

function boot({native = true, nativeFails = false, fallback = true} = {}) {
  const attrs = {};
  const controls = [];
  const code = {textContent: 'console.log("中文");\n'};
  const pre = {
    dataset: {},
    classList: {add() {}},
    querySelector: selector => selector === ":scope > code" ? code : null,
    insertBefore: element => controls.push(element),
    append: element => controls.push(element)
  };
  let clipboardValue = null;
  const body = {appendChild() {}};
  const document = {
    readyState: "complete",
    documentElement: {lang:"zh-CN"},
    querySelectorAll: () => [pre],
    body,
    createElement: tag => ({
      tagName: tag,
      dataset: {},
      style: {},
      value: "",
      textContent: "",
      setAttribute(key,value) { attrs[key]=value; },
      addEventListener(name, handler) { this["on"+name] = handler; },
      select() {},
      setSelectionRange() {},
      remove() {}
    }),
    execCommand: command => {
      if (command !== "copy" || !fallback) return false;
      clipboardValue = code.textContent;
      return true;
    }
  };
  const navigator = native ? {
    clipboard: {async writeText(text) {
      if (nativeFails) throw new Error("denied");
      clipboardValue = text;
    }}
  } : {};
  const MutationObserver = class {observe() {}};
  const pending = new Map(); let seq = 0;
  const setTimeoutStub = fn => { const id=++seq; pending.set(id,fn); return id; };
  const clearTimeoutStub = id => pending.delete(id);
  vm.runInNewContext(source,{document,navigator,MutationObserver,setTimeout:setTimeoutStub,clearTimeout:clearTimeoutStub});
  return {pre,code,controls,attrs,copy: () => controls[0].onclick(), read: () => clipboardValue,advance:()=>{for(const [id,fn] of [...pending]){pending.delete(id);fn();}}};
}

test("每个 Markdown 代码块有复制按钮和可访问反馈", async () => {
  const u = boot();
  assert.equal(u.pre.dataset.genUiCopyReady, "true");
  assert.equal(u.controls.length, 2);
  assert.match(u.controls[0].innerHTML,/<svg/);
  assert.equal(u.attrs["aria-live"], "polite");
  await u.copy();
  assert.equal(u.read(), u.code.textContent);
  assert.equal(u.controls[0].dataset.state, "check");
  assert.equal(u.controls[0].textContent, "");
  u.advance();
  assert.equal(u.controls[0].dataset.state, "copy");
  assert.equal(u.controls[1].textContent, "");
});

test("Clipboard API 不可用或拒绝时使用离线回退", async () => {
  for(const opts of [{native:false},{native:true,nativeFails:true}]) {
    const u=boot(opts);
    await u.copy();
    assert.equal(u.read(),u.code.textContent);
    assert.equal(u.controls[0].dataset.state,"check");
  }
});

test("无复制权限时显示失败提示，不虚报成功", async () => {
  const u = boot({native:false,fallback:false});
  await u.copy();
  assert.equal(u.controls[0].dataset.state,"error");
  assert.equal(u.controls[1].textContent,"");
});

test("重复复制不叠加反馈且最新计时器独立恢复",async()=>{
 const u=boot();await u.copy();await u.copy();
 assert.equal(u.controls[0].dataset.state,"check");
 u.advance();assert.equal(u.controls[0].dataset.state,"copy");
 assert.equal(u.controls[0].textContent,"");
 assert.match(u.controls[0].innerHTML,/<svg/);
});

test("页面主题、离线复制资产与不生成额外操作的契约", () => {
  for(const c of ["--background:#FFFFFF","--foreground:#1A1C1F","--accent:#3A83F7"])
    assert.ok(css.includes(c),c);
  assert.match(css,/font-size:14px/);
  assert.match(css,/font:12px\/1\.65/);
  assert.match(html,/<pre><code class="language-json">/);
  assert.match(html,/assets\/code-blocks\.js/);
  assert.doesNotMatch(html,/下载原MD|新标签页打开|打印当前页/);
  const links=[...html.matchAll(/<a class="external-link" href="([^"]+)" target="_blank" rel="noopener noreferrer"/g)];
  assert.ok(links.length>=2);
  assert.ok(links.every(x=>/^https?:\/\//i.test(x[1])));
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|https?:\/\//i);
});
