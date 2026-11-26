"""Build a static public GEN-UI site without adding runtime dependencies."""
import argparse
import html
import posixpath
import re
import shutil
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://yeqiana.github.io/gen-ui/"
REPO = "https://github.com/yeqiana/gen-ui/blob/main/"

# Only corresponding localized pages are paired. The two report galleries have
# different content and must remain independent canonical pages.
DEMO_PAIRS = [("demo/before-after.en.html", "demo/before-after.zh.html"),
              ("demo/documents/en/index.html", "demo/documents/index.html")]
DEMO_PAIRS += [(f"demo/documents/en/{name}.html", f"demo/documents/{name}.html")
               for name in ("project-analysis", "architecture-design", "implementation-plan", "test-acceptance")]
DEMO_DESCRIPTIONS = {
    "demo/before-after.en.html": "Compare two presentations of the same technical facts: a dense AI answer and a GEN-UI information design example.",
    "demo/before-after.zh.html": "对比同一份技术信息的两种呈现方式：原始 AI 回答与 GEN-UI 信息设计示例，保留事实和证据边界。",
}

class PageHead(HTMLParser):
    def __init__(self):
        super().__init__()
        self.meta = []
        self.canonicals = []
        self.alternates = []
        self.titles = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self.titles += 1
        if tag == "meta":
            self.meta.append((a.get("name", "").lower(), a.get("content", "")))
        if tag == "link" and a.get("rel") == "canonical":
            self.canonicals.append(a.get("href"))
        if tag == "link" and a.get("rel") == "alternate" and a.get("hreflang"):
            self.alternates.append((a["hreflang"], a.get("href")))

def page_head(text):
    head = re.search(r"<head\b[^>]*>(.*?)</head\s*>", text, re.I | re.S)
    if not head:
        raise ValueError("Missing HTML head")
    parsed = PageHead()
    parsed.feed(head.group(1))
    return head, parsed

def demo_metadata(text, target):
    head, parsed = page_head(text)
    if parsed.canonicals or parsed.alternates:
        raise ValueError(f"{target}: unexpected pre-existing canonical/alternate metadata")
    tags = [f'<link rel="canonical" href="{BASE}{target}">']
    for en, zh in DEMO_PAIRS:
        if target in (en, zh):
            tags.extend([f'<link rel="alternate" hreflang="en" href="{BASE}{en}">',
                         f'<link rel="alternate" hreflang="zh-CN" href="{BASE}{zh}">',
                         f'<link rel="alternate" hreflang="x-default" href="{BASE}{en}">'])
            break
    if target in DEMO_DESCRIPTIONS and not any(k == "description" for k, _ in parsed.meta):
        tags.append(f'<meta name="description" content="{html.escape(DEMO_DESCRIPTIONS[target], quote=True)}">')
    return text[:head.end(1)] + "\n" + "\n".join(tags) + "\n" + text[head.end(1):]

def validate_index_metadata(output, urls):
    pairs = [("", "zh.html"), ("guide.html", "guide.zh.html"), *DEMO_PAIRS]
    for path in urls:
        _, parsed = page_head((output / (path or "index.html")).read_text(encoding="utf-8"))
        if parsed.canonicals != [BASE + path] or parsed.titles != 1:
            raise ValueError(f"{path}: invalid canonical or title")
        if len([v for k, v in parsed.meta if k == "description" and v.strip()]) != 1:
            raise ValueError(f"{path}: missing or duplicate description")
        if any("noindex" in v.lower() for k, v in parsed.meta if k in ("robots", "googlebot")):
            raise ValueError(f"{path}: index prohibited")
        pair = next(((en, zh) for en, zh in pairs if path in (en, zh)), None)
        expected = [] if pair is None else [("en", BASE + pair[0]), ("zh-CN", BASE + pair[1]), ("x-default", BASE + pair[0])]
        if sorted(parsed.alternates) != sorted(expected):
            raise ValueError(f"{path}: incorrect language alternates")
    print(f"public site: {len(urls)} index metadata checks passed")

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("href", "src") and value:
                self.links.append((tag, key, value))

def build(output):
    output = output.resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("Use an output directory outside the source repository")
    if output.exists() and any(output.iterdir()):
        raise ValueError("Output directory must be empty")
    output.mkdir(parents=True, exist_ok=True)
    files = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode().strip("\0").split("\0")
    tracked = set(files)
    for name in files:
        if name.startswith("site/"):
            target = name.removeprefix("site/")
        elif name.startswith(("demo/", "assets/")) and not name.endswith(".md"):
            target = name
        else:
            continue
        dest = output / target
        dest.parent.mkdir(parents=True, exist_ok=True)
        if name.endswith(".html"):
            text = (ROOT / name).read_text(encoding="utf-8")
            def rewrite(m):
                raw = html.unescape(m.group(2))
                parts = urlsplit(raw)
                if parts.scheme or parts.netloc or not parts.path:
                    return m.group(0)
                local = posixpath.normpath(posixpath.join(posixpath.dirname(target), unquote(parts.path)))
                if local in tracked and local.endswith(".md"):
                    return m.group(1) + REPO + local + ("#" + parts.fragment if parts.fragment else "") + m.group(3)
                return m.group(0)
            text = re.sub(r"""(href\s*=\s*["'])([^"']+)(["'])""", rewrite, text)
            dest.write_text(text, encoding="utf-8")
        else:
            shutil.copyfile(ROOT / name, dest)
    # Verify all exported HTML resource and navigation links, not just the homepage.
    for page in sorted(output.rglob("*.html")):
        parser = Links()
        parser.feed(page.read_text(encoding="utf-8"))
        for tag, key, value in parser.links:
            parts = urlsplit(value)
            if parts.scheme or parts.netloc or not parts.path:
                continue
            local = (page.parent / unquote(parts.path)).resolve()
            if not local.is_relative_to(output) or not local.exists():
                raise ValueError(f"{page.relative_to(output)}: missing or unsafe {key}={value}")
    urls = ["", "zh.html", "guide.html", "guide.zh.html", "demo/before-after.en.html", "demo/before-after.zh.html",
            "demo/documents/index.html", "demo/documents/en/index.html", "demo/report.html", "demo/report.en.html"]
    for lang in ("", "en/"):
        for name in ("project-analysis", "architecture-design", "implementation-plan", "test-acceptance"):
            urls.append("demo/documents/" + lang + name + ".html")
    assert all((output / (p or "index.html")).is_file() for p in urls)
    for path in urls:
        if path.startswith("demo/"):
            dest = output / path
            dest.write_text(demo_metadata(dest.read_text(encoding="utf-8"), path), encoding="utf-8")
    validate_index_metadata(output, urls)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "".join("<url><loc>" + escape(BASE + p) + "</loc></url>\n" for p in urls)
    (output / "sitemap.xml").write_text(sitemap + "</urlset>\n", encoding="utf-8")
    (output / ".nojekyll").touch()
    print(f"public site: {len(urls)} sitemap URLs; {len(list(output.rglob('*.html')))} HTML pages validated; {sum(p.stat().st_size for p in output.rglob('*') if p.is_file())} bytes")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    build(parser.parse_args().output)
