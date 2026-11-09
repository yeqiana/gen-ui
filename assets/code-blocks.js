/* Offline enhancement for Markdown-style <pre><code> blocks. */
"use strict";
(() => {
  function enhance(pre) {
    if (pre.dataset.genUiCopyReady === "true") return;
    const code = pre.querySelector(":scope > code");
    if (!code) return;
    pre.dataset.genUiCopyReady = "true";
    pre.classList.add("code-block");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "复制";
    button.setAttribute("aria-label", "复制代码");
    const status = document.createElement("span");
    status.className = "code-copy-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    function fallbackCopy(text) {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      field.style.pointerEvents = "none";
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, field.value.length);
      let copied = false;
      try { copied = document.execCommand("copy"); }
      finally { field.remove(); }
      if (!copied) throw new Error("clipboard_unavailable");
    }
    async function copyText(text) {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try { await navigator.clipboard.writeText(text); return; }
        catch { /* Use the offline-compatible selection fallback. */ }
      }
      fallbackCopy(text);
    }
    button.addEventListener("click", async () => {
      button.disabled = true;
      button.textContent = "复制中";
      try {
        await copyText(code.textContent || "");
        button.textContent = "已复制";
        status.textContent = "代码已复制到剪贴板";
      } catch {
        button.textContent = "复制失败";
        status.textContent = "复制失败，请手动选择代码";
      } finally { button.disabled = false; }
    });
    pre.insertBefore(button, pre.firstChild);
    pre.append(status);
  }
  function start() {
    document.querySelectorAll("pre").forEach(enhance);
    const observer = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.matches("pre")) enhance(node);
          node.querySelectorAll("pre").forEach(enhance);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
