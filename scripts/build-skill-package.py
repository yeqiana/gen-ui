from pathlib import Path
import io, posixpath, re, subprocess, tempfile, zipfile
ROOT=Path(__file__).resolve().parents[1]
MAX_ZIP=1024*1024
MAX_TREE=3*1024*1024
RUNTIME_SCRIPTS={
 "scripts/prepare-html-assets.mjs","scripts/validate-html-report.mjs",
 "scripts/accept-html-delivery.mjs","scripts/build-html-portal.mjs",
 "scripts/serve-html-portal.mjs","scripts/evaluate-agent-output.mjs",
}
EXTRA={"SKILL.md","LICENSE","README.md","README.zh-CN.md","CHANGELOG.md",
 "evals/agent-cases.json","evals/agent-evaluation.md",
 "evals/unseen-panorama-workflow-2026-11-17.md"}
def tracked():
    return sorted(subprocess.check_output(["git","ls-files","-z"],cwd=ROOT).decode().strip("\0").split("\0"))
def build(output):
    files=tracked()
    assert all((ROOT/p).is_file() and not (ROOT/p).is_symlink() for p in files), "missing or symlinked tracked file"
    total=sum((ROOT/p).stat().st_size for p in files)
    if total>MAX_TREE: raise ValueError(f"source tree {total} exceeds {MAX_TREE}")
    selected={p for p in files if p in EXTRA|RUNTIME_SCRIPTS or p.startswith(("agents/","assets/","references/","docs/","examples/")) or (p.startswith("demo/") and not p.endswith((".png",".webp",".zip")))}
    # Preserve local image dependencies of the offline HTML, not README marketing previews.
    for p in sorted(selected):
        if not p.endswith((".html",".css",".js")): continue
        text=(ROOT/p).read_text(encoding="utf-8")
        for target in re.findall(r'''(?:src|href)\s*=\s*["']([^"']+\.(?:png|webp|zip))["']''',text,re.I):
            local=posixpath.normpath(posixpath.join(posixpath.dirname(p),target))
            if local in files: selected.add(local)
    assert EXTRA|RUNTIME_SCRIPTS <= selected
    data={}
    for p in sorted(selected):
        raw=(ROOT/p).read_bytes()
        if p.endswith((".md",".html",".css",".js",".mjs",".json",".yaml",".yml",".svg",".txt")) or p=="LICENSE":
            raw=raw.replace(b"\r\n",b"\n")
        if p.endswith(".md"):
            # In the install package only, link omitted developer evidence back to source.
            def link(m):
                target=m.group(1)
                local=posixpath.normpath(posixpath.join(posixpath.dirname(p),target.split("#",1)[0]))
                if local in files and local not in selected:
                    return "]("+ "https://github.com/yeqiana/gen-ui/blob/main/"+local+("#"+target.split("#",1)[1] if "#" in target else "")+")"
                return m.group(0)
            raw=re.sub(r"\]\(([^)\s]+)\)",link,raw.decode("utf-8")).encode("utf-8")
        data[p]=raw
    for p,raw in data.items():
        if not p.endswith(".html"): continue
        for target in re.findall(r"""(?:src|href)\s*=\s*["']([^"']+)["']""",raw.decode("utf-8"),re.I):
            if target.startswith(("#","http:","https:","mailto:","data:","javascript:")): continue
            local=posixpath.normpath(posixpath.join(posixpath.dirname(p),target.split("#",1)[0]))
            if local in files and local not in data:
                raise ValueError(f"omitted local HTML dependency: {p}: {target}")
    data["INSTALL.md"]=("Install: extract gen-ui/ into your host's Skills directory.\n"
        "This is the runtime package; source-only tests, historical evidence and marketing previews are omitted.\n"
        "Repository checks (scripts/test-skill.ps1 and tests/) require the source checkout.\n"
        "Offline HTML examples and required runtime assets remain local. Links to omitted developer evidence need internet.\n").encode()
    stream=io.BytesIO()
    with zipfile.ZipFile(stream,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
        for p,raw in sorted(data.items()):
            info=zipfile.ZipInfo("gen-ui/"+p,(1980,1,1,0,0,0))
            info.external_attr=0o100644<<16
            z.writestr(info,raw,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    payload=stream.getvalue()
    if len(payload)>MAX_ZIP: raise ValueError(f"install zip {len(payload)} exceeds {MAX_ZIP}")
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_bytes(payload)
    print(f"source_bytes={total} package_files={len(data)} package_bytes={len(payload)}")
if __name__=="__main__":
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument("output",type=Path)
    build(parser.parse_args().output)
