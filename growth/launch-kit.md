# GEN-UI launch kit / 开源冷启动

Status: draft, not externally published. Maintainer-authored outreach; no simulated users or fabricated testimonials.

## Chinese developer community draft

Title: 我做了一个让 AI 回答更容易理解的开源 Skill（Codex / Claude Code）

用 AI 做项目分析、代码评审和技术方案时，我经常遇到一个问题：它给出的信息很多，但真正需要的结论、风险和下一步却埋在长篇文字里。

所以我做了 GEN-UI，一个面向 AI Agent 的轻量信息设计 Skill。它不是 UI 框架，也不是把所有回答都强制生成网页。默认 Markdown；确实需要 HTML 时，再用结构化内容、图表和本地资源来帮助理解。

仓库有优化前后对比、项目分析、架构设计、实施计划和测试验收等示例。所有示例都是说明材料，不冒充真实项目的生产测试结果。

在线对比：https://yeqiana.github.io/gen-ui/demo/before-after.zh.html

实操教程：https://yeqiana.github.io/gen-ui/guide.zh.html

GitHub: https://github.com/yeqiana/gen-ui

Install: npx skills add yeqiana/gen-ui --skill gen-ui

我想找几位经常用 Codex 或 Claude Code 写技术方案的开发者试用。最想了解的是：安装是否顺利、输出是否更容易阅读，以及哪些信息被遗漏或被错误呈现。如果愿意反馈，欢迎在仓库提 Issue。

## English developer community draft

Title: Show HN: GEN-UI – an Agent Skill for making AI answers easier to understand

I built GEN-UI because AI coding agents can produce long answers in which the decision, evidence, and next action are hard to find.

It is a lightweight, open-source information-design Skill, not a frontend framework. Markdown is the default; offline HTML, diagrams, and interaction are optional when the task calls for them. The goal is to make the same information easier to understand without losing facts or inventing verification results.

The repository includes before/after examples and four technical-document examples in English and Chinese.

Try the demo: https://yeqiana.github.io/gen-ui/demo/before-after.en.html

Walkthrough: https://yeqiana.github.io/gen-ui/guide.html

Source: https://github.com/yeqiana/gen-ui

Install: npx skills add yeqiana/gen-ui --skill gen-ui

I would love feedback from people who use coding agents for architecture, reviews, and technical reports. Does the structure help? What gets lost? Where does installation or output fall short?

## Reusable tutorial outline

Title: How to make Codex technical answers easier to read without losing evidence

1. Start with a real reading problem: a dense, illustrative engineering response.
2. Compare the same facts before and after information design.
3. Demonstrate Markdown first; request offline HTML only when it adds value.
4. Show the four example types and distinguish illustrative content from observed results.
5. Give the verified installation command and a small prompt.
6. Describe limitations, host requirements, and how to file reproducible feedback.

Use the existing screenshot and example links. Do not claim a reader-study benefit that has not been measured. Do not describe a GitHub Pages URL as live before HTTP and content verification.

## Distribution checklist

- V2EX 分享创造 (https://www.v2ex.com/go/create) or 掘金: post the Chinese draft once, using the author's account and community rules. Prefer a real before/after example rather than promotional repetition.
- Hacker News Show HN: follow https://news.ycombinator.com/showhn.html and make the demo accessible before posting. A maintainer should be available to answer comments.
- Other communities: adapt a useful technical walkthrough, disclose authorship, and follow self-promotion rules. No unsolicited mass posts.
- Skills directory: only link the detail URL after visible listing content is verified; currently it returns a soft 404. No fake installs, no paid stars, no repeated telemetry.
- On the first week after public launch, track real unique visitors, stars, forks, release downloads where available, substantive issues, and independent mentions. Never equate downloads or clone events with unique users.

## Repository administration

About description:
Agent Skill for Codex and Claude Code: turn dense AI answers into clear Markdown, readable HTML reports, and diagrams. Information design, not UI decoration.

Topics:
agent-skills, ai-coding, generative-ui, codex, claude-code, information-design, markdown, html-report, technical-documentation, architecture-diagrams, ai-agents, agentic-workflows

Pages:
Settings > Pages > Build and deployment > Source > GitHub Actions. Run the existing Deploy GEN-UI public site workflow. Verify the public homepage and sitemap before setting the About Website or submitting indexing requests. The available API credential returned 403; do not attempt to bypass that permission boundary.

## Search Console handoff (owner action)

- Google Search Console: https://search.google.com/search-console — add URL-prefix property https://yeqiana.github.io/gen-ui/ (not the whole shared github.io domain). Choose HTML tag verification and retain the provided tag on the English homepage, or upload the provided verification file to site/. Do not invent a verification token. After verification, submit sitemap.xml and inspect the homepage and both walkthroughs.
- Bing Webmaster Tools: https://www.bing.com/webmasters/ — import the verified Google property, or verify independently and submit the same sitemap.
- IndexNow: the public key is hosted under /gen-ui/; only submit actual changed/new GEN-UI sitemap URLs. The key is a public verification identifier, not a private account credential. An accepted submission is not proof of indexing.
- About website: https://yeqiana.github.io/gen-ui/ (publicly verified). Metadata and account login remain owner actions if the available permission cannot change them.
