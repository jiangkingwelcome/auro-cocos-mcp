(() => {
  const DATA = window.AURO_INTERACTIVE_TEST_PLAN_DATA;
  if (!DATA || !Array.isArray(DATA.cases)) {
    const heroDesc = document.getElementById("heroDesc");
    if (heroDesc) {
      heroDesc.textContent =
        "未找到 interactive-test-plan.data.js，请先执行 node scripts/generate-interactive-test-plan.mjs。";
    }
    return;
  }

  const STORAGE_KEY = "auro-cocos-interactive-test-plan-v2";
  const STATUS_LABEL = {
    pending: "待测",
    pass: "通过",
    fail: "失败",
    blocked: "阻塞",
    uncertain: "存疑",
  };
  const SEVERITY_LABEL = {
    none: "无",
    low: "低",
    medium: "中",
    high: "高",
    critical: "严重",
  };
  const EDITION_LABEL = {
    community: "社区版",
    pro: "Pro / 扩展",
  };
  const DECISION_LABEL = {
    pending: "待判断",
    go: "Go",
    "conditional-go": "Conditional Go",
    "no-go": "No-Go",
  };
  const SEVERITY_WEIGHT = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };
  const FILTERS = { search: "", tool: "all", phase: "all", edition: "all", quick: "all" };
  const ACTION_CASE_COUNTS = buildActionCaseCounts();

  /**
   * 仓库数据里 needsRetest=true 表示曾标记「建议复测」；
   * 用户在「复测结果」选「复测通过」或「不需要」后，不应再显示红色「需复测」或计入待复测统计。
   */
  function isRetestStillPending(item, row) {
    if (!item.needsRetest) return false;
    const s = row && row.retestStatus;
    if (s === "passed" || s === "n/a") return false;
    return true;
  }

  const dom = {
    heroDesc: document.getElementById("heroDesc"),
    generatedAt: document.getElementById("generatedAt"),
    heroStats: document.getElementById("heroStats"),
    goals: document.getElementById("goals"),
    stages: document.getElementById("stages"),
    exits: document.getElementById("exits"),
    checklist: document.getElementById("checklist"),
    editionChips: document.getElementById("editionChips"),
    phaseChips: document.getElementById("phaseChips"),
    metrics: document.getElementById("metrics"),
    manualBar: document.getElementById("manualBar"),
    manualLabel: document.getElementById("manualLabel"),
    dualBar: document.getElementById("dualBar"),
    dualLabel: document.getElementById("dualLabel"),
    issues: document.getElementById("issues"),
    cases: document.getElementById("cases"),
    filterSummary: document.getElementById("filterSummary"),
    search: document.getElementById("searchInput"),
    tool: document.getElementById("toolFilter"),
    phase: document.getElementById("phaseFilter"),
    edition: document.getElementById("editionFilter"),
    quick: document.getElementById("quickFilter"),
    importFile: document.getElementById("importFile"),
  };

  let state = loadState();
  /** 为 true 时忽略 details 的 toggle，避免程序化展开时改写地址栏 hash */
  let suppressCaseHashSync = false;

  init();

  function init() {
    dom.heroDesc.textContent =
      `内置现有 ${DATA.project.totalCases} 条测试用例，并预填 tests/test-report.json 中的 AI 自动化基线。人工验证须经 MCP（POST /mcp → tools/call）完成，详见仓库 docs/testing/MCP_MANUAL_TEST_PROTOCOL.md。请逐条记录结论；缺陷写入问题描述，拿捏不准选「存疑」并写清备注。`;
    dom.generatedAt.textContent = new Date(DATA.generatedAt).toLocaleString("zh-CN", {
      hour12: false,
    });
    renderPlan();
    renderFilterOptions();
    hydrateMeta();
    bind();
    renderAll();
    requestAnimationFrame(() => {
      applyLocationHashToCase();
    });
  }

  function loadState() {
    const saved = parseJson(localStorage.getItem(STORAGE_KEY)) || {};
    const meta = Object.assign(
      {
        releaseTarget: "",
        buildVersion: "",
        cocosVersion: "",
        testEnvironment: "",
        aiOwner: "tests/test-report.json 基线",
        manualOwner: "",
        startDate: "",
        endDate: "",
        releaseDecision: "pending",
        riskLevel: "none",
        summary: "",
      },
      saved.meta || {},
    );

    const checklist = {};
    DATA.plan.checklist.forEach((item) => {
      checklist[item.id] = Boolean(saved.checklist && saved.checklist[item.id]);
    });

    const cases = {};
    DATA.cases.forEach((item) => {
      const old = saved.cases && saved.cases[item.id] ? saved.cases[item.id] : {};
      const baselineAiNote = item.aiBaseline.note || "";
      const savedAiNote = old.aiNote !== undefined ? old.aiNote : baselineAiNote;
      const aiNote = savedAiNote || "";
      const repoManual = item.manualBaseline;
      const savedManual = old.manualStatus;
      let manualStatus = "pending";
      if (savedManual !== undefined && savedManual !== "pending") {
        manualStatus = savedManual;
      } else if (repoManual && repoManual.status) {
        manualStatus = repoManual.status;
      } else if (savedManual !== undefined) {
        manualStatus = savedManual;
      }
      let aiStatus = old.aiStatus || item.aiBaseline.status || "pending";
      if (aiStatus === "fail" && isRateLimitedNote(aiNote)) {
        aiStatus = "blocked";
      }
      cases[item.id] = {
        aiStatus,
        manualStatus,
        severity: old.severity || "none",
        retestStatus: old.retestStatus || "pending",
        owner: old.owner || "",
        bugId: old.bugId || "",
        aiNote,
        manualNote: old.manualNote || (repoManual && repoManual.note) || "",
        issue: old.issue || "",
        updatedAt: old.updatedAt || "",
      };
    });

    return { meta, checklist, cases };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function parseJson(raw) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function isRateLimitedNote(text) {
    return /HTTP\s*429|Too Many Requests/i.test(String(text || ""));
  }

  function bind() {
    dom.search.addEventListener("input", () => {
      FILTERS.search = dom.search.value.trim().toLowerCase();
      renderAll();
    });

    dom.tool.addEventListener("change", () => {
      FILTERS.tool = dom.tool.value;
      renderAll();
    });

    dom.phase.addEventListener("change", () => {
      FILTERS.phase = dom.phase.value;
      renderAll();
    });

    dom.edition.addEventListener("change", () => {
      FILTERS.edition = dom.edition.value;
      renderAll();
    });

    dom.quick.addEventListener("change", () => {
      FILTERS.quick = dom.quick.value;
      renderAll();
    });

    document.getElementById("clearFilters").addEventListener("click", () => {
      FILTERS.search = "";
      FILTERS.tool = "all";
      FILTERS.phase = "all";
      FILTERS.edition = "all";
      FILTERS.quick = "all";
      dom.search.value = "";
      dom.tool.value = "all";
      dom.phase.value = "all";
      dom.edition.value = "all";
      dom.quick.value = "all";
      renderAll();
    });

    document.getElementById("expandAll").addEventListener("click", () => {
      document.querySelectorAll("details.case").forEach((node) => {
        node.open = true;
      });
    });

    document.getElementById("collapseAll").addEventListener("click", () => {
      document.querySelectorAll("details.case").forEach((node) => {
        node.open = false;
      });
    });

    document.getElementById("scrollIssues").addEventListener("click", () => {
      dom.issues.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.addEventListener("change", onChange);
    document.addEventListener("input", onInput);

    document.getElementById("saveJson").addEventListener("click", saveJson);
    document.getElementById("exportCsv").addEventListener("click", exportCsv);
    document.getElementById("importJson").addEventListener("click", () => dom.importFile.click());
    dom.importFile.addEventListener("change", importJson);
    document.getElementById("resetState").addEventListener("click", resetState);

    window.addEventListener("hashchange", () => {
      applyLocationHashToCase();
    });

    dom.cases.addEventListener("toggle", (e) => {
      const d = e.target;
      if (!d.matches || !d.matches("details.case")) return;
      if (suppressCaseHashSync) return;
      const id = d.getAttribute("data-case-id");
      if (id == null) return;
      const fragment = `#case-${encodeURIComponent(id)}`;
      if (d.open) {
        if (location.hash !== fragment) {
          history.replaceState(null, "", fragment);
        }
      } else if (location.hash === fragment) {
        history.replaceState(null, "", `${location.pathname}${location.search}`);
      }
    });
  }

  function onChange(event) {
    const target = event.target;

    if (target.matches("[data-meta]")) {
      state.meta[target.dataset.meta] = target.value;
      saveState();
      renderMetrics();
      renderIssues();
      return;
    }

    if (target.matches("[data-check]")) {
      state.checklist[target.dataset.check] = target.checked;
      saveState();
      return;
    }

    if (target.matches("[data-case-select]")) {
      const id = target.dataset.id;
      state.cases[id][target.dataset.caseSelect] = target.value;
      state.cases[id].updatedAt = new Date().toISOString();
      saveState();
      renderAll();
    }
  }

  function onInput(event) {
    const target = event.target;

    if (target.matches("[data-meta]")) {
      state.meta[target.dataset.meta] = target.value;
      saveState();
      return;
    }

    if (target.matches("[data-case-text]")) {
      const id = target.dataset.id;
      state.cases[id][target.dataset.caseText] = target.value;
      state.cases[id].updatedAt = new Date().toISOString();
      saveState();
      renderIssues();
    }
  }

  function renderAll() {
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const openCaseIds = [];
    dom.cases.querySelectorAll("details.case[open]").forEach((el) => {
      const id = el.getAttribute("data-case-id");
      if (id != null && id !== "") openCaseIds.push(id);
    });

    suppressCaseHashSync = true;
    renderHero();
    renderMetrics();
    renderIssues();
    renderCases();

    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      openCaseIds.forEach((id) => {
        const el = findCaseDetailsByDataId(id);
        if (el) el.open = true;
      });
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
        suppressCaseHashSync = false;
      });
    });
  }

  /** 根据地址栏 #case-{id} 展开对应用例并滚入视口（刷新、前进/后退、分享链接） */
  function applyLocationHashToCase() {
    const m = /^#case-(.+)$/.exec(location.hash);
    if (!m) return;
    let raw;
    try {
      raw = decodeURIComponent(m[1]);
    } catch {
      raw = m[1];
    }
    const el = findCaseDetailsByDataId(raw);
    if (!el) return;
    el.open = true;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
    });
  }

  function findCaseDetailsByDataId(id) {
    const want = String(id);
    return Array.from(dom.cases.querySelectorAll("details.case")).find(
      (node) => node.getAttribute("data-case-id") === want,
    );
  }

  function renderPlan() {
    dom.goals.innerHTML = DATA.plan.goals
      .map((text, index) => planBox(`目标 ${index + 1}`, text))
      .join("");
    dom.stages.innerHTML = DATA.plan.stages
      .map((text, index) => planBox(`阶段 ${index + 1}`, text))
      .join("");
    dom.exits.innerHTML = (DATA.plan.exitCriteria || DATA.plan.exits || [])
      .map((text, index) => planBox(`退出标准 ${index + 1}`, text))
      .join("");
    dom.checklist.innerHTML = DATA.plan.checklist
      .map((item) => {
        const checked = state.checklist[item.id] ? "checked" : "";
        return `<label class="check"><input type="checkbox" data-check="${esc(item.id)}" ${checked}><span><strong>${esc(item.title)}</strong><span class="tiny">${esc(item.description)}</span></span></label>`;
      })
      .join("");
    dom.editionChips.innerHTML = (DATA.summaries.editions || [])
      .map((item) => `<div class="chip"><strong>${esc(EDITION_LABEL[item.key] || item.key)}</strong><div>${item.count} 条</div></div>`)
      .join("");
    dom.phaseChips.innerHTML = DATA.summaries.phases
      .map((item) => `<div class="chip"><strong>${esc(item.key)}</strong><div>${item.count} 条</div></div>`)
      .join("");
  }

  function renderFilterOptions() {
    dom.tool.innerHTML = `<option value="all">全部 Tool</option>${DATA.summaries.tools
      .map((item) => `<option value="${esc(item.key)}">${esc(item.key)} (${item.count})</option>`)
      .join("")}`;
    dom.phase.innerHTML = `<option value="all">全部阶段</option>${DATA.summaries.phases
      .map((item) => `<option value="${esc(item.key)}">${esc(item.key)} (${item.count})</option>`)
      .join("")}`;
    dom.edition.value = FILTERS.edition;
  }

  function hydrateMeta() {
    document.querySelectorAll("[data-meta]").forEach((node) => {
      node.value = state.meta[node.dataset.meta] || "";
    });
  }

  function renderHero() {
    const stats = computeStats();
    const items = [
      ["总用例", stats.total],
      ["社区版用例", stats.edition.community],
      ["Pro / 扩展", stats.edition.pro],
      ["待复测（未闭环）", stats.needsRetestPending],
      ["AI 基线失败", stats.ai.fail],
      ["人工已完成", stats.manualDone],
      ["待处理/存疑关注", stats.openIssues],
    ];

    dom.heroStats.innerHTML = items
      .map(
        ([label, value]) =>
          `<div class="stat"><div class="tiny">${esc(label)}</div><div class="value">${esc(String(value))}</div></div>`,
      )
      .join("");
  }

  function renderMetrics() {
    const stats = computeStats();
    const items = [
      ["社区版", stats.edition.community, "community"],
      ["Pro / 扩展", stats.edition.pro, "pro"],
      ["AI 通过", stats.ai.pass, "pass"],
      ["AI 失败", stats.ai.fail, "fail"],
      ["人工通过", stats.manual.pass, "pass"],
      ["人工失败", stats.manual.fail, "fail"],
      ["人工阻塞", stats.manual.blocked, "blocked"],
      ["人工存疑", stats.manual.uncertain, "uncertain"],
      ["人工待测", stats.manual.pending, "pending"],
      ["待复测（未闭环）", stats.needsRetestPending, "fail"],
      ["发布结论", DECISION_LABEL[state.meta.releaseDecision] || "待判断", "pass"],
    ];

    dom.metrics.innerHTML = items
      .map(
        ([label, value, kind]) =>
          `<div class="metric ${kind}"><div class="tiny">${esc(label)}</div><div class="value">${esc(String(value))}</div></div>`,
      )
      .join("");

    const manualPercent = pct(stats.manualDone, stats.total);
    const dualPercent = pct(stats.dualComplete, stats.total);
    dom.manualBar.style.width = `${manualPercent}%`;
    dom.dualBar.style.width = `${dualPercent}%`;
    dom.manualLabel.textContent = `${stats.manualDone} / ${stats.total}，${manualPercent}%`;
    dom.dualLabel.textContent = `${stats.dualComplete} / ${stats.total}，${dualPercent}%`;
  }

  function renderIssues() {
    const issues = DATA.cases
      .map((item) => ({ item, state: state.cases[item.id] }))
      .filter(
        (row) =>
          row.state.issue.trim() ||
          row.state.aiStatus === "fail" ||
          row.state.manualStatus === "fail" ||
          row.state.aiStatus === "uncertain" ||
          row.state.manualStatus === "uncertain" ||
          row.state.severity !== "none",
      )
      .sort(
        (a, b) =>
          SEVERITY_WEIGHT[b.state.severity] - SEVERITY_WEIGHT[a.state.severity] ||
          a.item.id - b.item.id,
      )
      .slice(0, 24);

    if (!issues.length) {
      dom.issues.innerHTML =
        '<div class="issue"><div class="title"><strong>当前没有记录中的问题</strong></div><div class="tiny">当你在用例里填写问题、标记失败或设置严重级别后，这里会自动汇总。</div></div>';
      return;
    }

    dom.issues.innerHTML = issues
      .map(({ item, state: row }) => {
        const excerpt = [row.issue.trim(), row.manualNote.trim(), row.aiNote.trim()]
          .filter(Boolean)
          .slice(0, 2)
          .join(" / ");

        return `
          <div class="issue">
            <div class="title">
              <span><strong>#${item.id} ${esc(item.title)}</strong></span>
              <span>${badge(EDITION_LABEL[item.edition] || item.edition, item.edition)}${badge(`AI：${STATUS_LABEL[row.aiStatus]}`, row.aiStatus)}${badge(`人工：${STATUS_LABEL[row.manualStatus]}`, row.manualStatus)}<span class="badge">${esc(SEVERITY_LABEL[row.severity])}</span></span>
            </div>
            <div class="tiny">${esc(item.tool)} / ${esc(item.action)} / ${esc(item.phase)}</div>
            <div>${esc(excerpt || "未填写具体说明")}</div>
          </div>
        `;
      })
      .join("");
  }

  function renderCases() {
    const list = filteredCases();
    dom.filterSummary.textContent = `当前显示 ${list.length} / ${DATA.cases.length} 条用例。`;

    if (!list.length) {
      dom.cases.innerHTML =
        '<div class="issue"><div class="title"><strong>没有匹配的用例</strong></div><div class="tiny">调整筛选条件后再试。</div></div>';
      return;
    }

    dom.cases.innerHTML = list.map((item) => renderCase(item, state.cases[item.id])).join("");
  }

  function filteredCases() {
    return DATA.cases.filter((item) => {
      const row = state.cases[item.id];
      const hay = [
        item.title,
        item.tool,
        item.action,
        item.expected,
        item.note,
        item.prerequisites,
        item.setupSteps && item.setupSteps.length ? JSON.stringify(item.setupSteps) : "",
        isRetestStillPending(item, row) ? "需复测" : "",
        item.retestReason,
        row.issue,
        row.aiNote,
        row.manualNote,
        row.owner,
        row.bugId,
      ]
        .join(" ")
        .toLowerCase();

      if (FILTERS.search && !hay.includes(FILTERS.search)) return false;
      if (FILTERS.tool !== "all" && item.tool !== FILTERS.tool) return false;
      if (FILTERS.phase !== "all" && item.phase !== FILTERS.phase) return false;
      if (FILTERS.edition !== "all" && item.edition !== FILTERS.edition) return false;
      if (FILTERS.quick === "manual-pending") return row.manualStatus === "pending";
      if (FILTERS.quick === "needs-retest") return isRetestStillPending(item, row);
      if (FILTERS.quick === "ai-fail") return row.aiStatus === "fail";
      if (FILTERS.quick === "manual-fail") return row.manualStatus === "fail";
      if (FILTERS.quick === "open-issues") {
        return (
          Boolean(row.issue.trim()) ||
          row.severity !== "none" ||
          row.aiStatus === "fail" ||
          row.manualStatus === "fail" ||
          row.aiStatus === "uncertain" ||
          row.manualStatus === "uncertain"
        );
      }
      if (FILTERS.quick === "dual-pass") return row.aiStatus === "pass" && row.manualStatus === "pass";
      if (FILTERS.quick === "uncertain") {
        return row.manualStatus === "uncertain" || row.aiStatus === "uncertain";
      }
      return true;
    });
  }

  function renderCase(item, row) {
    const overall = overallStatus(row);
    const updated = row.updatedAt
      ? new Date(row.updatedAt).toLocaleString("zh-CN", { hour12: false })
      : "未更新";
    const scenarioType = classifyScenarioType(item);
    const scenarioHint = buildScenarioHint(item, scenarioType);
    const actionCaseCount = ACTION_CASE_COUNTS.get(actionKey(item)) || 1;

    return `
      <details class="case" data-case-id="${item.id}" id="case-${item.id}">
        <summary>
          <div class="case-head">
            <span class="badge">#${item.id}</span>
            <span>${badge(item.priority, "priority")}${badge(EDITION_LABEL[item.edition] || item.edition, item.edition)}<span class="badge">${esc(item.phase)}</span>${isRetestStillPending(item, row) ? badge("需复测", "fail") : item.needsRetest && row.retestStatus === "passed" ? badge("复测已通过", "pass") : ""}${badge(`AI：${STATUS_LABEL[row.aiStatus]}`, row.aiStatus)}${badge(`人工：${STATUS_LABEL[row.manualStatus]}`, row.manualStatus)}${badge(`总体：${STATUS_LABEL[overall]}`, overall)}</span>
          </div>
          <div class="case-title">${esc(item.title)}</div>
          <div class="case-meta">
            <div><strong>Tool</strong><div>${esc(item.tool)}</div></div>
            <div><strong>Action</strong><div>${esc(item.action)}</div></div>
            <div><strong>场景类型</strong><div>${esc(scenarioType)}</div></div>
            <div><strong>当前场景</strong><div>${esc(scenarioHint)}</div></div>
            <div><strong>最近更新</strong><div>${esc(updated)}</div></div>
          </div>
        </summary>
        <div class="case-body">
          <section>
            <strong>场景说明</strong>
            <div class="muted-box">
              当前用例测试的是 <strong>${esc(item.tool)}.${esc(item.action)}</strong> 的
              <strong>${esc(scenarioType)}</strong>。
              ${actionCaseCount > 1
                ? `同一 action 目前拆成 ${actionCaseCount} 条场景用例，差异可能来自参数、环境或前置状态。`
                : "当前 action 只有这一条场景用例。"}
              ${item.note ? `前置说明：${esc(item.note)}。` : ""}
            </div>
          </section>
          <section>
            <strong>AI 端描述</strong>
            <div class="muted-box">${renderAiDoc(item)}</div>
          </section>
          <section>
            <strong>预期结果</strong>
            <div class="muted-box">${esc(item.expected || "未提供预期结果")}</div>
          </section>
          ${
            item.prerequisites
              ? `<section>
            <strong>前置条件</strong>
            <div class="muted-box">${esc(item.prerequisites)}</div>
          </section>`
              : ""
          }
          ${
            item.setupSteps && item.setupSteps.length
              ? `<section>
            <strong>建议前置步骤（MCP）</strong>
            <div class="code-box">${esc(JSON.stringify(item.setupSteps, null, 2))}</div>
          </section>`
              : ""
          }
          ${
            item.needsRetest
              ? `<section>
            <strong>复测说明（仓库标记）</strong>
            <div class="muted-box">${esc(item.retestReason || "此条需在完整前置下重新执行 MCP 验证后再视为最终结论。")}</div>
          </section>`
              : ""
          }
          <section>
            <strong>请求输入</strong>
            <div class="code-box">${esc(JSON.stringify(item.input, null, 2))}</div>
          </section>
          <section class="case-grid">
            ${fieldSelect(item.id, "aiStatus", "AI 测试结果", row.aiStatus, statusOptions())}
            ${fieldSelect(item.id, "manualStatus", "人工测试结果", row.manualStatus, statusOptions())}
            ${fieldSelect(item.id, "severity", "严重级别", row.severity, severityOptions())}
            ${fieldSelect(item.id, "retestStatus", "复测结果", row.retestStatus, retestOptions())}
            ${fieldText(item.id, "owner", "责任人", row.owner, "填写处理人")}
            ${fieldText(item.id, "bugId", "问题单 / 链接", row.bugId, "例如 BUG-123")}
            ${fieldArea(item.id, "aiNote", "AI 备注", row.aiNote, "自动化证据、日志摘要、失败现象")}
            ${fieldArea(item.id, "manualNote", "人工备注", row.manualNote, "验证步骤、截图位置；存疑时写明不确定点与待确认项")}
            ${fieldArea(item.id, "issue", "问题描述", row.issue, "填写缺陷现象、复现步骤、影响范围、是否阻塞发布")}
          </section>
        </div>
      </details>
    `;
  }

  function fieldSelect(id, key, label, value, optionsHtml) {
    return `<div><label>${esc(label)}</label><select data-id="${id}" data-case-select="${key}">${optionsHtml(value)}</select></div>`;
  }

  function renderAiDoc(item) {
    const aiDoc = item.aiDoc || {};
    const toolSummary = aiDoc.toolSummary || "当前源码未提取到 tool 描述。";
    const zhToolSummary = aiDoc.zhToolSummary || "当前没有可用的中文翻译。";
    const actionDescription =
      aiDoc.actionDescription
      || "当前源码未找到这条 action 的 AI 描述。这通常表示测试用例超前、该能力来自 Pro/native，或描述还没补齐。";
    const zhActionDescription =
      aiDoc.zhActionDescription
      || "当前没有可用的中文翻译。";
    const naturalLanguageSpec = aiDoc.naturalLanguageSpec || {};
    const naturalLanguageTest =
      aiDoc.naturalLanguageTest
      || "当前没有生成自然语言测试用例。";
    const sourceFile = aiDoc.sourceFile
      ? `来源：${esc(aiDoc.sourceFile)}`
      : "来源：当前仓库源码中未定位到描述定义";

    return `
      <div><strong>Tool 描述（EN）：</strong>${esc(toolSummary)}</div>
      <div class="section-gap-less"><strong>Tool 描述（ZH）：</strong>${esc(zhToolSummary)}</div>
      <div class="section-gap-less"><strong>Action 描述（EN）：</strong>${esc(actionDescription)}</div>
      <div class="section-gap-less"><strong>Action 描述（ZH）：</strong>${esc(zhActionDescription)}</div>
      <div class="section-gap-less">
        <strong>自然语言测试用例：</strong>
        ${renderNaturalLanguageSpec(naturalLanguageSpec, naturalLanguageTest)}
      </div>
      <div class="tiny">${sourceFile}</div>
    `;
  }

  function renderNaturalLanguageSpec(spec, fallbackText) {
    if (!spec || !spec.aiInstruction) {
      return esc(fallbackText);
    }

    const rows = [
      ["AI 指令", spec.aiInstruction, true],
      ["适用场景", spec.scenarioNarrative, true],
      ["操作方式", spec.parameterNarrative, true],
      ["验证重点", spec.verificationFocus],
      ["动作目标", spec.actionGoal],
      ["场景类型", spec.scenarioType],
      ["场景名称", spec.scenarioTitle],
      ["前置条件", spec.scenarioCondition],
      ["MCP 调用", spec.mcpCall],
      ["原始参数", spec.fullPayload],
      ["预期结果", spec.expectedText],
    ];

    return `
      <div class="nl-spec-grid">
        ${rows
          .map(
            ([label, value, wide]) => `
              <div class="nl-spec-item ${wide ? "is-wide" : ""}">
                <div class="nl-spec-label">${esc(label)}</div>
                <div class="nl-spec-value">${esc(value || "未提供")}</div>
              </div>
            `,
          )
          .join("")}
      </div>
      <div class="tiny section-gap">提示词原文：${esc(fallbackText)}</div>
    `;
  }

  function fieldText(id, key, label, value, placeholder) {
    return `<div><label>${esc(label)}</label><input type="text" data-id="${id}" data-case-text="${key}" value="${escAttr(value)}" placeholder="${escAttr(placeholder)}"></div>`;
  }

  function fieldArea(id, key, label, value, placeholder) {
    return `<div class="full"><label>${esc(label)}</label><textarea data-id="${id}" data-case-text="${key}" placeholder="${escAttr(placeholder)}">${esc(value)}</textarea></div>`;
  }

  function planBox(title, text) {
    return `<div class="plan"><strong>${esc(title)}</strong><div class="tiny">${esc(text)}</div></div>`;
  }

  function actionKey(item) {
    return `${item.tool}::${item.action}`;
  }

  function buildActionCaseCounts() {
    const counts = new Map();
    DATA.cases.forEach((item) => {
      const key = actionKey(item);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }

  function classifyScenarioType(item) {
    const hasInput = item.input && Object.keys(item.input).some((key) => key !== "action");
    const note = String(item.note || "").toLowerCase();
    const expected = String(item.expected || "").toLowerCase();
    const title = String(item.title || "").toLowerCase();
    const envHints = [
      "未启动",
      "未加载",
      "断开",
      "插件",
      "编辑器",
      "bridge",
      "连接",
      "econnrefused",
      "环境",
      "启动后",
    ];
    const stateHints = [
      "选中",
      "为空",
      "默认",
      "当前",
      "已存在",
      "不存在",
      "恢复",
      "回退",
      "状态",
      "打开后",
    ];
    const combined = `${title} ${note} ${expected}`;

    if (hasInput) {
      return "参数场景";
    }
    if (envHints.some((hint) => combined.includes(hint))) {
      return "环境场景";
    }
    if (stateHints.some((hint) => combined.includes(hint))) {
      return "状态场景";
    }
    return "通用场景";
  }

  function buildScenarioHint(item, scenarioType) {
    if (scenarioType === "参数场景") {
      const entries = Object.entries(item.input || {}).filter(([key]) => key !== "action");
      return entries.length
        ? entries.map(([key, value]) => `${key}=${previewValue(value)}`).join("；")
        : "当前场景没有额外参数";
    }
    if (item.note) {
      return item.note;
    }
    if (item.expected) {
      return item.expected;
    }
    return "未提供额外场景说明";
  }

  function previewValue(value) {
    if (value === null) return "null";
    if (typeof value === "string") return value;
    return JSON.stringify(value);
  }

  function statusOptions() {
    return (selected) =>
      ["pending", "pass", "fail", "blocked", "uncertain"]
        .map(
          (value) =>
            `<option value="${value}" ${selected === value ? "selected" : ""}>${STATUS_LABEL[value]}</option>`,
        )
        .join("");
  }

  function severityOptions() {
    return (selected) =>
      ["none", "low", "medium", "high", "critical"]
        .map(
          (value) =>
            `<option value="${value}" ${selected === value ? "selected" : ""}>${SEVERITY_LABEL[value]}</option>`,
        )
        .join("");
  }

  function retestOptions() {
    const labels = {
      pending: "待复测",
      passed: "复测通过",
      failed: "复测失败",
      "n/a": "不需要",
    };
    return (selected) =>
      Object.entries(labels)
        .map(
          ([value, label]) =>
            `<option value="${value}" ${selected === value ? "selected" : ""}>${label}</option>`,
        )
        .join("");
  }

  function overallStatus(row) {
    if (row.aiStatus === "fail" || row.manualStatus === "fail") return "fail";
    if (row.aiStatus === "blocked" || row.manualStatus === "blocked") return "blocked";
    if (row.aiStatus === "uncertain" || row.manualStatus === "uncertain") return "uncertain";
    if (row.aiStatus === "pass" && row.manualStatus === "pass") return "pass";
    return "pending";
  }

  function badge(text, status) {
    return `<span class="badge ${status || "pending"}">${esc(text)}</span>`;
  }

  function computeStats() {
    const stats = {
      total: DATA.cases.length,
      edition: { community: 0, pro: 0 },
      ai: { pass: 0, fail: 0, blocked: 0, uncertain: 0, pending: 0 },
      manual: { pass: 0, fail: 0, blocked: 0, uncertain: 0, pending: 0 },
      manualDone: 0,
      dualComplete: 0,
      dualPass: 0,
      openIssues: 0,
      needsRetestPending: 0,
    };

    DATA.cases.forEach((item) => {
      const row = state.cases[item.id];
      stats.edition[item.edition] += 1;
      const aiS = row.aiStatus in stats.ai ? row.aiStatus : "pending";
      const manS = row.manualStatus in stats.manual ? row.manualStatus : "pending";
      stats.ai[aiS] += 1;
      stats.manual[manS] += 1;
      if (row.manualStatus !== "pending") stats.manualDone += 1;
      if (row.aiStatus !== "pending" && row.manualStatus !== "pending") stats.dualComplete += 1;
      if (row.aiStatus === "pass" && row.manualStatus === "pass") stats.dualPass += 1;
      if (isRetestStillPending(item, row)) stats.needsRetestPending += 1;
      if (
        row.issue.trim() ||
        row.aiStatus === "fail" ||
        row.manualStatus === "fail" ||
        row.aiStatus === "uncertain" ||
        row.manualStatus === "uncertain" ||
        row.severity !== "none"
      ) {
        stats.openIssues += 1;
      }
    });

    return stats;
  }

  function pct(a, b) {
    return b ? Math.round((a / b) * 100) : 0;
  }

  async function saveJson() {
    const content = JSON.stringify(buildExportPayload(), null, 2);
    const fileName = `interactive-test-plan-${stamp()}.json`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "JSON Files",
              accept: {
                "application/json": [".json"],
              },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        alert("已保存到本地 JSON 文件。");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") {
          return;
        }
      }
    }

    download(content, fileName, "application/json");
  }

  function exportCsv() {
    const rows = [
      [
        "id",
        "phase",
        "priority",
        "tool",
        "action",
        "scenario_type",
        "title",
        "ai_status",
        "manual_status",
        "severity",
        "retest_status",
        "owner",
        "bug_id",
        "issue",
        "ai_note",
        "manual_note",
        "expected",
      ],
    ];

    DATA.cases.forEach((item) => {
      const row = state.cases[item.id];
      rows.push([
        item.id,
        item.phase,
        item.priority,
        item.tool,
        item.action,
        classifyScenarioType(item),
        item.title,
        row.aiStatus,
        row.manualStatus,
        row.severity,
        row.retestStatus,
        row.owner,
        row.bugId,
        row.issue,
        row.aiNote,
        row.manualNote,
        item.expected,
      ]);
    });

    download(
      rows.map((row) => row.map(csvEscape).join(",")).join("\n"),
      `interactive-test-plan-${stamp()}.csv`,
      "text/csv;charset=utf-8",
    );
  }

  function buildExportPayload() {
    return {
      exportedAt: new Date().toISOString(),
      meta: state.meta,
      checklist: state.checklist,
      cases: state.cases,
    };
  }

  function importJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || "{}"));
        if (payload.meta && typeof payload.meta === "object") {
          state.meta = Object.assign({}, state.meta, payload.meta);
        }
        if (payload.checklist && typeof payload.checklist === "object") {
          DATA.plan.checklist.forEach((item) => {
            if (Object.prototype.hasOwnProperty.call(payload.checklist, item.id)) {
              state.checklist[item.id] = Boolean(payload.checklist[item.id]);
            }
          });
        }
        if (payload.cases && typeof payload.cases === "object") {
          Object.entries(payload.cases).forEach(([id, value]) => {
            if (state.cases[id] && value && typeof value === "object") {
              state.cases[id] = Object.assign({}, state.cases[id], value);
            }
          });
        }
        saveState();
        hydrateMeta();
        renderPlan();
        renderAll();
        alert("导入成功。");
      } catch {
        alert("导入失败，请确认文件格式正确。");
      } finally {
        dom.importFile.value = "";
      }
    };
    reader.readAsText(file, "utf8");
  }

  function resetState() {
    if (!confirm("确认清空当前页面填写结果？此操作只会删除浏览器本地记录。")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = loadState();
    hydrateMeta();
    renderPlan();
    renderAll();
  }

  function download(content, name, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvEscape(value) {
    const text = String(value == null ? "" : value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function stamp() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0"),
      String(d.getSeconds()).padStart(2, "0"),
    ].join("");
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escAttr(value) {
    return esc(value).replace(/\n/g, " ");
  }
})();
