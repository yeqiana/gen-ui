/* GEN-UI 中文 HTML 报告：所有模型提供的 JSON 都是数据，绝不作为代码执行。 */
(function () {
  "use strict";

  const SIZES = [10, 20, 50];
  const MAX_JSON_CHARS = 750000;
  const STATUSES = ["success", "failure", "pending"];
  const STATUS_TEXT = { success: "成功", failure: "失败", pending: "待处理" };
  const SVG = "http://www.w3.org/2000/svg";

  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }
  function keys(value, allowed) {
    if (!object(value)) throw Error("数据必须是对象");
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) throw Error("出现不允许的字段：" + key);
    }
  }
  function text(value, max) {
    if (typeof value !== "string" || !value.trim() || value.length > max) {
      throw Error("文本为空或超过长度限制");
    }
  }
  function validateReport(report) {
    keys(report, ["version", "title", "rows"]);
    if (report.version !== "gen-ui-html-report/v1") throw Error("不支持的数据协议版本");
    text(report.title, 100);
    if (!Array.isArray(report.rows) || report.rows.length > 1000) {
      throw Error("最多支持 1000 条记录");
    }
    const ids = new Set();
    for (const row of report.rows) {
      keys(row, ["id", "module", "status", "durationMs", "batch"]);
      text(row.id, 40);
      text(row.module, 40);
      if (ids.has(row.id)) throw Error("记录编号重复");
      ids.add(row.id);
      if (!STATUSES.includes(row.status)) throw Error("状态不合法");
      if (typeof row.durationMs !== "number" || !Number.isFinite(row.durationMs) ||
          row.durationMs < 0 || row.durationMs > 1000000) {
        throw Error("耗时必须为有限数字，范围为 0 至 1000000");
      }
      if (!Number.isInteger(row.batch) || row.batch < 1 || row.batch > 12) {
        throw Error("批次必须为 1 至 12 的整数");
      }
    }
    return report;
  }

  function filterRows(rows, filter) {
    const keyword = String(filter.query || "").trim().toLowerCase();
    const selectedModule = filter.module ?? "";
    const selectedBatch = filter.batch || "all";
    const selectedStatuses = Array.isArray(filter.statuses)
      ? filter.statuses : (filter.status && filter.status !== "all" ? [filter.status] : STATUSES);
    return rows.filter(row =>
      (!keyword || row.id.toLowerCase().includes(keyword) || row.module.toLowerCase().includes(keyword)) &&
      selectedStatuses.includes(row.status) &&
      (selectedModule === "" || row.module === selectedModule) &&
      (selectedBatch === "all" || String(row.batch) === String(selectedBatch)) &&
      (!filter.slowOnly || row.durationMs > filter.threshold)
    );
  }

  function paginateRows(rows, page, size) {
    if (!SIZES.includes(size)) throw Error("每页条数只能是 10、20、50");
    const pages = Math.max(1, Math.ceil(rows.length / size));
    const current = Math.max(1, Math.min(pages, Math.trunc(page) || 1));
    const offset = (current - 1) * size;
    return {
      rows: rows.slice(offset, offset + size), page: current, pages, total: rows.length,
      first: rows.length ? offset + 1 : 0, last: Math.min(offset + size, rows.length)
    };
  }

  function summarize(rows, threshold) {
    const result = { total: rows.length, success: 0, failure: 0, pending: 0, slow: 0 };
    for (const row of rows) {
      result[row.status]++;
      if (row.durationMs > threshold) result.slow++;
    }
    return result;
  }

  function groupModules(rows) {
    const groups = new Map();
    for (const row of rows) groups.set(row.module, (groups.get(row.module) || 0) + 1);
    const sorted = [...groups].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    return sorted.length <= 8 ? sorted :
      [...sorted.slice(0, 7), ["其他", sorted.slice(7).reduce((sum, item) => sum + item[1], 0)]];
  }

  function batchSeries(rows) {
    const result = Array.from({ length: 12 }, (_, index) => ({ batch: index + 1, count: 0 }));
    for (const row of rows) result[row.batch - 1].count++;
    return result;
  }

  function sample() {
    const modules = ["网关服务", "鉴权中心", "订单服务", "工作流编排"];
    return {
      version: "gen-ui-html-report/v1",
      title: "工程质量分析 · 模拟数据",
      rows: Array.from({ length: 67 }, (_, index) => ({
        id: "T-" + String(index + 1).padStart(3, "0"),
        module: modules[index % modules.length],
        status: index % 11 === 0 ? "failure" : index % 13 === 0 ? "pending" : "success",
        durationMs: 90 + (index * 71) % 1050,
        batch: index % 12 + 1
      }))
    };
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      SIZES, MAX_JSON_CHARS, STATUSES, STATUS_TEXT, validateReport, filterRows, paginateRows,
      summarize, groupModules, batchSeries, sample
    };
  }
  if (typeof document === "undefined") return;

  const app = document.querySelector("[data-report-app]");
  if (!app) return;
  const byId = value => document.getElementById(value);
  const dom = (tag, value, className) => {
    const element = document.createElement(tag);
    if (value !== undefined) element.textContent = String(value);
    if (className) element.className = className;
    return element;
  };
  const shape = (tag, attributes, label) => {
    const element = document.createElementNS(SVG, tag);
    for (const [key, value] of Object.entries(attributes || {})) {
      element.setAttribute(key, String(value));
    }
    if (label !== undefined) element.textContent = String(label);
    return element;
  };
  const graph = (viewBox, description) =>
    shape("svg", { viewBox, role: "img", "aria-label": description });

  let report = sample();
  let page = 1;
  const filter = {
    query: "", module: "", statuses: [...STATUSES], batch: "all",
    slowOnly: false, threshold: 600, size: 10
  };

  function pie(rows) {
    const counts = summarize(rows, filter.threshold);
    const entries = [
      ["成功", counts.success, "#118644"],
      ["失败", counts.failure, "#c72d35"],
      ["待处理", counts.pending, "#64748b"]
    ];
    const chart = graph("0 0 300 200", entries.map(item => item[0] + item[1] + "条").join("，"));
    let angle = -Math.PI / 2;
    if (!counts.total) {
      chart.append(shape("text", { x: 90, y: 100, "text-anchor": "middle", fill: "#58677b" }, "暂无数据"));
    }
    for (const [label, count, color] of entries) {
      if (!count) continue;
      const sweep = 2 * Math.PI * count / counts.total;
      if (count === counts.total) {
        chart.append(shape("circle", { cx: 90, cy: 92, r: 73, fill: color }));
      } else {
        const x1 = 90 + 73 * Math.cos(angle), y1 = 92 + 73 * Math.sin(angle);
        const x2 = 90 + 73 * Math.cos(angle + sweep), y2 = 92 + 73 * Math.sin(angle + sweep);
        chart.append(shape("path", {
          d: "M 90 92 L " + x1 + " " + y1 + " A 73 73 0 " +
            (sweep > Math.PI ? 1 : 0) + " 1 " + x2 + " " + y2 + " Z",
          fill: color
        }));
      }
      angle += sweep;
    }
    entries.forEach((entry, index) => {
      chart.append(shape("rect", { x: 180, y: 40 + index * 44, width: 11, height: 11, fill: entry[2] }));
      chart.append(shape("text", { x: 199, y: 51 + index * 44, "font-size": 12, fill: "#283548" },
        entry[0] + "：" + entry[1]));
    });
    byId("pie").replaceChildren(chart, dom("figcaption", "按当前筛选结果计算"));
  }

  function bar(rows) {
    const groups = groupModules(rows);
    const max = Math.max(1, ...groups.map(group => group[1]));
    const chart = graph("0 0 420 200", "各模块记录数：" +
      groups.map(group => group[0] + group[1] + "条").join("，"));
    if (!groups.length) {
      chart.append(shape("text", { x: 210, y: 95, "text-anchor": "middle", fill: "#58677b" }, "暂无数据"));
      byId("bar").replaceChildren(chart, dom("figcaption", "没有符合条件的记录"));
      return;
    }
    const slot = 380 / groups.length;
    groups.forEach(([name, count], index) => {
      const x = 18 + index * slot, width = Math.min(36, slot - 8), height = 126 * count / max;
      chart.append(shape("rect", { x, y: 157 - height, width, height, rx: 2, fill: "#5369d8" }));
      chart.append(shape("text", {
        x: x + width / 2, y: 151 - height, fill: "#283548",
        "text-anchor": "middle", "font-size": 11
      }, count));
      chart.append(shape("text", {
        x: x + width / 2, y: 179, fill: "#465467",
        "text-anchor": "middle", "font-size": 10
      }, name.slice(0, 5)));
    });
    chart.append(shape("line", { x1: 12, x2: 410, y1: 157, y2: 157, stroke: "#a0aaba" }));
    byId("bar").replaceChildren(chart, dom("figcaption", "模块记录数量对比"));
  }

  function line(rows) {
    const series = batchSeries(rows);
    const max = Math.max(1, ...series.map(item => item.count));
    const chart = graph("0 0 420 200", "批次记录数量：" +
      series.map(item => item.batch + "批" + item.count + "条").join("，"));
    if (!rows.length) {
      chart.append(shape("text", { x: 210, y: 95, "text-anchor": "middle", fill: "#58677b" }, "暂无数据"));
      byId("line").replaceChildren(chart, dom("figcaption", "没有符合条件的记录"));
      return;
    }
    const x = batch => 30 + (batch - 1) * 33;
    const y = count => 153 - 120 * count / max;
    chart.append(shape("line", { x1: 25, x2: 400, y1: 153, y2: 153, stroke: "#a0aaba" }));
    chart.append(shape("path", {
      d: series.map((item, index) =>
        (index ? "L " : "M ") + x(item.batch) + " " + y(item.count)).join(" "),
      fill: "none", stroke: "#5369d8", "stroke-width": 3
    }));
    series.forEach(item => {
      chart.append(shape("circle", { cx: x(item.batch), cy: y(item.count), r: 3, fill: "#3c50b2" }));
      chart.append(shape("text", {
        x: x(item.batch), y: 175, "text-anchor": "middle",
        "font-size": 10, fill: "#465467"
      }, item.batch));
    });
    byId("line").replaceChildren(chart, dom("figcaption", "按执行批次排序的记录数"));
  }

  const tooltip = byId("cell-tooltip");
  function hideTooltip() {
    if (tooltip) tooltip.hidden = true;
  }
  function revealTooltip(element, value) {
    if (!tooltip) return;
    // Only display overflowing text, and measure the actual painted bubble.
    if (!(element.scrollWidth > element.clientWidth)) return;
    tooltip.textContent = value;
    tooltip.hidden = false;
    if (typeof element.getBoundingClientRect !== "function" || !tooltip.style) return;
    const rect = element.getBoundingClientRect();
    const bubble = tooltip.getBoundingClientRect();
    const width = typeof innerWidth === "number" ? innerWidth : 900;
    const height = typeof innerHeight === "number" ? innerHeight : 700;
    const padding = 12;
    const left = Math.max(padding, Math.min(rect.left, width - bubble.width - padding));
    const above = rect.top - bubble.height - 8;
    const desiredTop = above >= padding ? above : rect.bottom + 8;
    const top = Math.max(padding, Math.min(desiredTop, height - bubble.height - padding));
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  }
  function clippedCell(value, column) {
    const cell = dom("td");
    cell.dataset.column = column;
    const span = dom("span", value, "clip");
    // Non-truncated text is already readable and should not create a Tab stop.
    span.tabIndex = -1;
    span.addEventListener("mouseenter", () => revealTooltip(span, value));
    span.addEventListener("mouseleave", hideTooltip);
    span.addEventListener("focus", () => revealTooltip(span, value));
    span.addEventListener("blur", hideTooltip);
    cell.append(span);
    return cell;
  }

  function refreshClippedFocusability() {
    const body = byId("report-rows");
    if (!body || typeof body.querySelectorAll !== "function") return;
    for (const cell of body.querySelectorAll(".clip")) {
      const truncated = cell.scrollWidth > cell.clientWidth;
      cell.tabIndex = truncated ? 0 : -1;
      if (truncated) cell.setAttribute("aria-label", cell.textContent);
      else cell.removeAttribute("aria-label");
    }
  }
  function openDialog(name) {
    const dialog = byId(name);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.open = true;
  }
  function closeDialog(name) {
    const dialog = byId(name);
    if (typeof dialog.close === "function") dialog.close();
    else dialog.open = false;
  }
  function showRecord(row) {
    const content = byId("detail-content");
    const entries = [
      ["任务编号", row.id], ["所属模块", row.module], ["执行状态", STATUS_TEXT[row.status]],
      ["耗时", row.durationMs + " 毫秒"], ["执行批次", "第 " + row.batch + " 批"]
    ];
    content.replaceChildren();
    for (const [key, value] of entries) {
      const term = dom("dt", key), description = dom("dd", value);
      if (key.length > 15) term.title = key;
      if (String(value).length > 15) description.title = String(value);
      content.append(term, description);
    }
    openDialog("detail-drawer");
  }

  function updateColumnFilters() {
    const modules = [...new Set(report.rows.map(row => row.module))].sort((a, b) => a.localeCompare(b, "zh-CN"));
    const moduleRows = filter.module === "" ? report.rows : report.rows.filter(row => row.module === filter.module);
    const batches = [...new Set(moduleRows.map(row => row.batch))].sort((a, b) => a - b);
    const mod = byId("module-filter"), bat = byId("batch-filter");
    mod.replaceChildren();
    bat.replaceChildren();
    const firstModule = dom("option", "全部模块");
    firstModule.value = "";
    mod.append(firstModule);
    modules.forEach(value => {
      const option = dom("option", value);
      option.value = value;
      mod.append(option);
    });
    const firstBatch = dom("option", "全部批次");
    firstBatch.value = "all";
    bat.append(firstBatch);
    batches.forEach(value => {
      const option = dom("option", "第 " + value + " 批");
      option.value = String(value);
      bat.append(option);
    });
    if (filter.module !== "" && !modules.includes(filter.module)) filter.module = "";
    if (filter.batch !== "all" && !batches.some(value => String(value) === String(filter.batch))) {
      filter.batch = "all";
    }
    mod.value = filter.module;
    bat.value = String(filter.batch);
    updateStatusCount();
  }

  function updateStatusCount() {
    const selected = Array.isArray(filter.statuses) ? filter.statuses.length : 0;
    const output = byId("status-count");
    if (output) output.textContent = selected + "/" + STATUSES.length;
  }

  const COLUMN_KEYS = ["module", "status", "duration", "batch", "action"];
  const COLUMN_WIDTHS = { id: 175, module: 260, status: 130, duration: 168, batch: 130, action: 164 };
  function applyColumnVisibility() {
    let count = 1;
    const visible = new Set(["id"]);
    for (const key of COLUMN_KEYS) {
      const checked = byId("column-" + key).checked;
      byId("col-" + key).hidden = !checked;
      byId("th-" + key).hidden = !checked;
      if (checked) { visible.add(key); count++; }
    }
    const body = byId("report-rows");
    for (const row of body.children) {
      for (const cell of row.children) {
        if (cell.dataset?.column) cell.hidden = !visible.has(cell.dataset.column);
      }
    }
    const table = byId("report-table");
    if (table?.style) table.style.minWidth = [...visible].reduce((sum, key) => sum + COLUMN_WIDTHS[key], 0) + "px";
    const live = byId("column-visibility-live");
    if (live) live.textContent = "当前显示 " + count + " 列";
    refreshClippedFocusability();
    return count;
  }

  function render() {
    // Preserve success feedback after dialog close, but clear it on the next data/navigation update.
    byId("page-notice").textContent = "";
    const rows = filterRows(report.rows, filter);
    const stats = summarize(rows, filter.threshold);
    byId("report-title").textContent = report.title;
    for (const key of ["total", "success", "failure", "pending", "slow"]) {
      byId("count-" + key).textContent = stats[key].toLocaleString("zh-CN");
    }
    byId("filter-count").textContent =
      "当前显示 " + rows.length + " 条，共 " + report.rows.length + " 条记录";
    byId("threshold-value").textContent = filter.threshold + " 毫秒";
    const paging = paginateRows(rows, page, filter.size);
    page = paging.page;
    const body = byId("report-rows");
    body.replaceChildren();
    hideTooltip();
    for (const row of paging.rows) {
      const tr = dom("tr");
      tr.dataset.recordId = row.id;
      const statusCell = dom("td");
      statusCell.dataset.column = "status";
      statusCell.append(dom("span", STATUS_TEXT[row.status], "status " + row.status));
      const actionCell = dom("td");
      actionCell.dataset.column = "action";
      const detail = dom("button", undefined, "inline-button genui-action-icon");
      detail.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5z"/><circle cx="12" cy="12" r="2"/></svg>';
      detail.title = "查看详情";
      detail.type = "button";
      detail.setAttribute("aria-label", "查看任务 " + row.id + " 的详情（站内抽屉）");
      detail.addEventListener("click", () => showRecord(row));
      actionCell.append(detail);
      const durationCell = clippedCell(row.durationMs.toLocaleString("zh-CN") + " 毫秒", "duration");
      const severity = row.status === "failure" ? "failure" : row.durationMs > filter.threshold ? "warning" : row.status === "success" ? "success" : "neutral";
      durationCell.dataset.compareStatus = severity;
      tr.append(clippedCell(row.id, "id"), clippedCell(row.module, "module"), statusCell,
        durationCell,
        clippedCell("第 " + row.batch + " 批", "batch"), actionCell);
      body.append(tr);
    }
    const visibleColumnCount = applyColumnVisibility();
    if (!paging.rows.length) {
      const tr = dom("tr"), cell = dom("td", "暂无符合条件的记录，请调整筛选条件");
      cell.colSpan = visibleColumnCount;
      tr.append(cell);
      body.append(tr);
    }
    byId("page-info").textContent =
      "共 " + paging.total + " 条 · 第 " + paging.first + "–" + paging.last +
      " 条 · " + page + "/" + paging.pages + " 页";
    const jumpInput = byId("page-jump-input");
    jumpInput.max = String(paging.pages);
    jumpInput.value = String(page);
    if (typeof window !== "undefined" && window.GenUIPager) {
      window.GenUIPager.render(byId("page-numbers"), paging, nextPage => {
        page = nextPage;
        render();
      });
    }
    byId("previous").disabled = page <= 1;
    byId("next").disabled = page >= paging.pages;
    if (typeof window !== "undefined" && window.GenUICharts) {
      window.GenUICharts.pie(byId("pie"), stats);
      window.GenUICharts.bar(byId("bar"), groupModules(rows));
      window.GenUICharts.line(byId("line"), batchSeries(rows), rows.length);
    } else {
      pie(rows);
      bar(rows);
      line(rows);
    }
  }

  function resetFilters() {
    Object.assign(filter, {
      query: "", module: "", statuses: [...STATUSES], batch: "all",
      slowOnly: false, threshold: 600, size: 10
    });
    updateColumnFilters();
    byId("keyword").value = "";
    byId("module-filter").value = "";
    for (const status of STATUSES) byId("status-" + status).checked = true;
    updateStatusCount();
    byId("batch-filter").value = "all";
    byId("slow-only").checked = false;
    byId("threshold").value = "600";
    byId("page-size").value = "10";
    page = 1;
    render();
  }

  const bind = (name, event, callback) => byId(name).addEventListener(event, callback);
  bind("filters", "submit", event => event.preventDefault());
  bind("keyword", "input", event => { filter.query = event.target.value; page = 1; render(); });
  bind("module-filter", "change", event => {
    filter.module = event.target.value;
    filter.batch = "all";
    updateColumnFilters();
    page = 1;
    render();
  });
  for (const status of STATUSES) bind("status-" + status, "change", event => {
    const selected = new Set(filter.statuses);
    if (event.target.checked) selected.add(status); else selected.delete(status);
    filter.statuses = STATUSES.filter(value => selected.has(value));
    updateStatusCount();
    page = 1;
    render();
  });
  bind("batch-filter", "change", event => { filter.batch = event.target.value; page = 1; render(); });
  bind("slow-only", "change", event => { filter.slowOnly = event.target.checked; page = 1; render(); });
  bind("threshold", "input", event => { filter.threshold = Number(event.target.value); page = 1; render(); });
  bind("page-size", "change", event => {
    const size = Number(event.target.value);
    if (!SIZES.includes(size)) return;
    filter.size = size;
    page = 1;
    render();
  });
  bind("reset-filters", "click", resetFilters);
  for (const key of COLUMN_KEYS) bind("column-" + key, "change", applyColumnVisibility);
  bind("previous", "click", () => { page--; render(); });
  bind("next", "click", () => { page++; render(); });
  const jumpPage = () => {
    const input = Number(byId("page-jump-input").value);
    if (!Number.isInteger(input) || input < 1) return;
    page = input;
    render();
  };
  bind("page-go", "click", jumpPage);
  bind("page-jump-input", "keydown", event => {
    if (event.key === "Enter") { event.preventDefault(); jumpPage(); }
  });
  bind("nav-mode", "change", event => {
    app.dataset.navigation = event.target.value === "top" ? "top" : "left";
  });
  const sidebarToggle = document.getElementById("toggle-sidebar");
  sidebarToggle?.addEventListener("click", () => {
    const collapsed = app.dataset.sidebarCollapsed !== "true";
    app.dataset.sidebarCollapsed = String(collapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    const label = collapsed ? "展开目录" : "收起目录";
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.title = label;
    byId("sidebar-toggle-glyph").style.transform = collapsed ? "rotate(180deg)" : "none";
    byId("sidebar-toggle-label").textContent = label;
  });
  bind("table-scroll", "scroll", hideTooltip);
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", hideTooltip, true);
    window.addEventListener("keydown", event => { if (event.key === "Escape") hideTooltip(); });
    window.addEventListener("resize", () => { hideTooltip(); refreshClippedFocusability(); });
    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(() => { hideTooltip(); refreshClippedFocusability(); });
      observer.observe(byId("table-scroll"));
    }
    if (document.fonts?.ready) document.fonts.ready.then(refreshClippedFocusability);
  }

  function setTab(name) {
    const records = name !== "rules";
    byId("panel-records").hidden = !records;
    byId("panel-rules").hidden = records;
    for (const [id, active] of [["tab-records", records], ["tab-rules", !records]]) {
      const tab = byId(id);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.className = active ? "tab active" : "tab";
    }
  }
  bind("tab-records", "click", () => setTab("records"));
  bind("tab-rules", "click", () => setTab("rules"));
  function handleTabKeys(event) {
    const selected = event.currentTarget?.id === "tab-records" ? "records" : "rules";
    let target;
    if (event.key === "Home") target = "records";
    else if (event.key === "End") target = "rules";
    else if (event.key === "ArrowRight" || event.key === "ArrowLeft")
      target = selected === "records" ? "rules" : "records";
    else return;
    event.preventDefault();
    setTab(target);
    byId(target === "records" ? "tab-records" : "tab-rules").focus?.();
  }
  bind("tab-records", "keydown", handleTabKeys);
  bind("tab-rules", "keydown", handleTabKeys);

  bind("open-create", "click", () => {
    byId("create-status").textContent = "";
    openDialog("create-dialog");
  });
  bind("close-create", "click", () => closeDialog("create-dialog"));
  bind("cancel-create", "click", () => closeDialog("create-dialog"));
  bind("close-detail", "click", () => closeDialog("detail-drawer"));
  bind("open-data-drawer", "click", () => openDialog("data-drawer"));
  bind("close-data", "click", () => closeDialog("data-drawer"));

  function syncFormTooltip(id) {
    const control = byId(id);
    const label = byId("label-" + id);
    const labelText = String(label?.textContent || "").trim();
    if (label) label.title = labelText.length > 15 ? labelText : "";
    const value = control.tagName === "SELECT"
      ? (control.options?.[control.selectedIndex]?.textContent || control.value || "")
      : String(control.value || control.placeholder || "");
    control.title = value.length > 15 ? value : "";
  }
  const formFieldIds = ["new-id", "new-module", "new-status", "new-duration", "new-batch"];
  for (const id of formFieldIds) {
    syncFormTooltip(id);
    byId(id).addEventListener("input", () => syncFormTooltip(id));
    byId(id).addEventListener("change", () => syncFormTooltip(id));
  }

  function normalizeExternalLinks() {
    const links = document.querySelectorAll?.("a[href]") || [];
    for (const link of links) {
      const href = String(link.getAttribute("href") || "").trim();
      if (/^https?:\/\//i.test(href)) {
        link.classList.add("external-link");
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      } else {
        link.classList.remove("external-link");
        if (link.target === "_blank") link.removeAttribute("target");
      }
    }
  }
  normalizeExternalLinks();

  bind("create-form", "submit", event => {
    event.preventDefault();
    const notice = byId("create-status");
    try {
      const row = {
        id: byId("new-id").value.trim(),
        module: byId("new-module").value.trim(),
        status: byId("new-status").value,
        durationMs: Number(byId("new-duration").value),
        batch: Number(byId("new-batch").value)
      };
      const updated = validateReport({ ...report, rows: [...report.rows, row] });
      report = updated;
      updateColumnFilters();
      resetFilters();
      // Append at the end, then show the page that contains the new record.
      page = Math.ceil(report.rows.length / filter.size);
      render();
      byId("report-json").value = JSON.stringify(report, null, 2);
      notice.textContent = "新增记录已加入当前页面";
      notice.dataset.kind = "ok";
      closeDialog("create-dialog");
      const pageNotice = byId("page-notice");
      pageNotice.textContent = "新增成功：任务 " + row.id + "，已定位到第 " + page + " 页";
      pageNotice.dataset.kind = "ok";
      const newRow = byId("report-rows").querySelector?.("tr:last-child .clip");
      newRow?.focus?.();
    } catch (error) {
      notice.textContent = "无法新增：" + String(error.message || error);
      notice.dataset.kind = "error";
    }
  });

  const json = byId("report-json");
  json.value = JSON.stringify(report, null, 2);
  bind("apply-json", "click", () => {
    const notice = byId("json-status");
    try {
      if (json.value.length > MAX_JSON_CHARS) throw Error("JSON 超过 " + MAX_JSON_CHARS + " 字符限制");
      const updated = validateReport(JSON.parse(json.value));
      report = updated;
      updateColumnFilters();
      resetFilters();
      notice.textContent = "校验通过，当前页面已更新；没有发送网络请求";
      notice.dataset.kind = "ok";
    } catch (error) {
      notice.textContent = "JSON 校验失败：" + String(error.message || error);
      notice.dataset.kind = "error";
    }
  });
  for (const status of STATUSES) byId("status-" + status).checked = true;
  for (const key of COLUMN_KEYS) byId("column-" + key).checked = true;
  updateColumnFilters();
  render();
})();
