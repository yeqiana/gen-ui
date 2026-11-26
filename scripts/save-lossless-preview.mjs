import {spawnSync} from "node:child_process";
import fs from "node:fs";
export function saveLosslessPreview(file,png){
 const code="from PIL import Image; import sys,io; im=Image.open(io.BytesIO(sys.stdin.buffer.read())).convert('RGBA'); out=io.BytesIO(); im.save(out,format='WEBP',lossless=True,method=6,exact=True); data=out.getvalue(); assert Image.open(io.BytesIO(data)).convert('RGBA').tobytes()==im.tobytes(); sys.stdout.buffer.write(data)";
 const run=spawnSync(process.env.GEN_UI_PYTHON||"python",["-c",code],{input:png,maxBuffer:16*1024*1024});
 if(run.status!==0||run.stdout?.toString("ascii",8,12)!=="WEBP")throw Error("Lossless preview requires Python with Pillow: "+(run.stderr||run.error||""));
 fs.writeFileSync(file,run.stdout);
}
