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
    # Landing pages must have all local images, styles and demo targets.
    for name in ("index.html", "zh.html"):
        parser = Links()
        parser.feed((output / name).read_text(encoding="utf-8"))
        for tag, key, value in parser.links:
            parts = urlsplit(value)
            if parts.scheme or parts.netloc or not parts.path:
                continue
            local = output / unquote(parts.path)
            if not local.is_file():
                raise ValueError(f"{name}: missing {key}={value}")
    urls = ["", "zh.html", "demo/before-after.en.html", "demo/before-after.zh.html",
            "demo/documents/index.html", "demo/documents/en/index.html", "demo/report.html", "demo/report.en.html"]
    for lang in ("", "en/"):
        for name in ("project-analysis", "architecture-design", "implementation-plan", "test-acceptance"):
            urls.append("demo/documents/" + lang + name + ".html")
    assert all((output / (p or "index.html")).is_file() for p in urls)
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += "".join("<url><loc>" + escape(BASE + p) + "</loc></url>\n" for p in urls)
    (output / "sitemap.xml").write_text(sitemap + "</urlset>\n", encoding="utf-8")
    (output / ".nojekyll").touch()
    print(f"public site: {len(urls)} indexable URLs; {sum(p.stat().st_size for p in output.rglob('*') if p.is_file())} bytes")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("output", type=Path)
    build(parser.parse_args().output)
