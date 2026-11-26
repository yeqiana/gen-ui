# Gen UI discoverability baseline — unmeasured

**Status:** NOT MEASURED. This is a reproducible measurement plan, not a report of search placement or AI citations.

## Sampling protocol

1. Record calendar date (ISO 8601), engine, region and language, account/login state if permitted, and model/version if visible.
2. Run the exact queries below without inserting the Gen UI brand unless the query explicitly contains it.
3. Record whether Gen UI appears, where (if known), the link cited, and whether the summary accurately describes **Markdown-first plus optional renderer**.
4. Save evidence URL or screenshots as permitted. Do not count a model-generated link unless the link was verified.
5. Mark findings **Observed / Not observed / Not checked**, never invent a proprietary GEO score.
6. Repeat with comparable settings (monthly if maintaining the project).

## Queries to test

| ID | Query | Channel | Initial state |
| --- | --- | --- | --- |
| G01 | "AI coding agent skill readable Markdown output" | GitHub search | Not checked |
| G02 | "codex skill improve code review markdown formatting" | GitHub search | Not checked |
| G03 | "generative UI skill for CLI coding agents" | Web search | Not checked |
| G04 | "how to make Claude Code responses interactive" | AI search | Not checked |
| G05 | "safe JSON UI renderer for coding agent output" | AI search | Not checked |
| G06 | "AI coding test acceptance report skill" | GitHub search | Not checked |
| G07 | "Gen UI yeqiana" | GitHub search | Not checked |
| G08 | "agent Markdown UI fallback without renderer" | AI search | Not checked |

## Observation template

```text
Date:
Engine / model:
Region / language:
Query ID:
Query text:
Gen UI found: Observed / Not observed / Not checked
Citation or result URL:
Accuracy of description:
Evidence screenshot / notes:
```

## Assessment

Initial result: **no visibility or ranking baseline has been measured**. Repository metadata and this documentation are recommended actions, not evidence of ranking improvement.

Avoid artificial mentions, automated spam, fabricated testimonials, or false third-party citations.
## 2026-11-26 initial observations (partial baseline)

- GitHub API: 0 stars, 0 forks, no homepage, Pages disabled, topics agent-skills / ai-coding / generative-ui. Repository metadata is observed; broad search placement remains NOT MEASURED.
- Web search sample: "GEN-UI yeqiana agent skill readable AI answers"; "Codex Claude Code skill readable HTML reports architecture diagrams agent skills"; "site:skills.sh/yeqiana/gen-ui gen-ui". No result linking the target repository appeared in the returned sample; this is not proof of non-indexing. AI answer citations: Not checked.
- Skills CLI: remote discovery before fix returned SKILLS_NO_VALID_SKILLS (YAML parse error); isolated local discovery and install after fix succeeded. Remote post-fix check and public directory listing are separate.

Additional queries for repeat sampling: "Codex skill for readable HTML reports", "Claude Code skill for structured technical documentation", "AI answer readability agent skill", "Codex HTML report and architecture diagram skill", "AI 回答可视化 Skill", "Codex HTML 技术报告生成 Skill", "Claude Code 技术文档排版 Skill". Record actual citation URLs and whether the described feature matches the project. Do not count maintainer tests as installs.

## Repeatable query set

| ID | Query | Intent |
| --- | --- | --- |
| B01 | "yeqiana/gen-ui" "GEN-UI" skill | exact project |
| E01 | Codex skill readable HTML reports AI architecture diagrams Markdown information design | English discovery |
| E02 | Claude Code skill generate readable HTML technical report architecture diagram | English discovery |
| C01 | Codex Skill AI 回答更容易理解 HTML 报告 结构化 架构图 | Chinese discovery |
| S01 | site:skills.sh/yeqiana/gen-ui | directory |
| E03 | open source agent skill for clearer AI explanations and readable Markdown | general |
| E04 | how to make long AI coding answers easier to understand | pain point |
| E05 | Codex and Claude Code skill for offline HTML technical documentation | task |
| C02 | 怎么让 AI 的长篇技术回答更容易理解 | pain point |
| C03 | Claude Code 生成易读 HTML 技术报告的开源 Skill | task |
| C04 | Codex 结构化技术方案和架构图 Skill | task |
| C05 | AI 信息设计 Markdown 优先 Agent Skill | positioning |

At each weekly check, log date, engine/surface, query ID, whether GEN-UI is mentioned, whether it is linked, exact source URL, and whether capabilities are described accurately. Use fresh sessions without project context for AI recommendation checks. Distinguish ordinary web search from generative answers. No fabricated clicks or installs.

## 2026-11-26 follow-up verification

- Remote GitHub repository: 0 stars, 0 forks; 3 existing topics; homepage empty; Pages disabled, HTTP 404; deployment skipped; traffic API returned 403, so visitors and clones are unknown.
- Skills.sh detail URL returned HTTP 200 but visible content displayed a 404 unavailable message with robots noindex; repository page HTTP 404. Listing not verified. Official listing mechanism is genuine install telemetry: https://www.skills.sh/docs/faq. No fake installs.
- Release install ZIP returned HTTP 200. Earlier remote CLI discovery returned one valid Skill; QA installs used disabled telemetry.
- Web search sample (exact repository, Skills.sh site query, English report/diagram intent, Chinese report/diagram intent): the returned sample did not surface GEN-UI. This is not proof that any particular engine has excluded it. Other HTML-report skills appeared. Independent AI answer citations: Not checked.
- Static site: all 30 exported HTML files had resolving local href/src links. There are 16 intended sitemap URLs; public indexing requires actual deployment.
- Outreach drafts: growth/launch-kit.md (not posted). Recheck using the same queries after site launch; do not infer ranking improvements from code changes.

- Added bilingual practical walkthroughs and expanded the sitemap; local build must pass all exported HTML link checks. Public indexing is not measured.

## Public launch — 2026-11-26

- GitHub Pages enabled by maintainer; deployment run 45779364470 succeeded (build and deploy).
- https://yeqiana.github.io/gen-ui/sitemap.xml returned HTTP 200; all 18 listed URLs returned HTTP 200 with matching page titles.
- Search engine indexing and independent AI citations: not yet measured.

## Search discovery submission — 2026-11-26

- Repository snapshot before this round: 0 stars, 0 forks, 3 topics, no About homepage; Pages enabled. Previous commit 6718e87 validation CI succeeded. Release download counter: 3, including possible maintainer QA; not a user count.
- Public English and Chinese homepages and sitemap returned HTTP 200, with no noindex directive; host-root robots.txt returned HTTP 404. Skills.sh still displayed a soft 404 and noindex. Sample branded and site-restricted web searches did not establish indexing.
- IndexNow public verification file under /gen-ui/ returned HTTP 200 with exact matching contents. Submitted all 18 unique sitemap URLs in one scoped POST to https://api.indexnow.org/indexnow. HTTP 202: accepted, key validation pending. No retry spam, no indexing or ranking claims.
- Google Search Console verification and Bing Webmaster Tools property import remain owner actions. Community drafts include live links; no external posts were sent.

## Owner verification and first directory outreach — 2026-11-26

- Owner reported Google HTML-file verification passed, live URL eligible for indexing, and Request indexing clicked. Sitemap submission, actual indexing and Bing import remain unconfirmed.
- API snapshot: 0 stars, 0 forks, release download counter 3 (not necessarily organic); repository About homepage still empty, original three topics. Skills.sh detail still soft 404 with noindex.
- BehiSecc/awesome-claude-skills: public README checked, 10,489 stars at the time of API check, no GEN-UI entry; fork API returned 403 and duplicate issue search API returned 422. Recommendation prepared in growth/launch-kit.md, not submitted. VoltAgent directory deferred due to its real-community-usage requirement.

## Repository metadata and directory submission — 2026-11-26

- Owner-authorized local GitHub authentication succeeded with administrator permissions. Repository description, About homepage https://yeqiana.github.io/gen-ui/, and 12 Topics were updated and independently read back via the GitHub API. Stars and forks were still 0 at this check.
- Verified existing owner fork yeqiana/awesome-claude-skills and add-gen-ui branch against upstream main: exactly one README entry, one commit, no deletions. Opened https://github.com/BehiSecc/awesome-claude-skills/pull/1577 and verified open / not merged. Directory inclusion remains pending maintainer review. No simulated traffic or adoption claims.
