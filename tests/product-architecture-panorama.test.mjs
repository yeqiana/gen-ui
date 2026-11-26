import {losslessWebpDimensions} from "./preview-format.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("demo/product-architecture-panorama.html");
const spec=read("references/product-architecture-panorama.md");
const arch=read("references/architecture-patterns.md");
const svgTheme=read("assets/product-panorama-svg-theme.css");

const panoramaPreview=fs.readFileSync(path.join(root,"demo/assets/product-architecture-panorama-preview.webp"));
test("产品全景图截图来自真实 Chrome 无损 WebP 并包含完整画布",()=>{
  assert.ok(losslessWebpDimensions(panoramaPreview).width>0);
  assert.ok(panoramaPreview.length>16000);
  assert.ok(losslessWebpDimensions(panoramaPreview).width>=1000);
  assert.ok(losslessWebpDimensions(panoramaPreview).height>=1100);
});

test("产品架构全景板保留渠道、统一入口、完整横向层次和左右支撑",()=>{
  assert.match(html,/<html lang="zh-CN">/);
  assert.match(html,/data-product-panorama/);
  assert.match(html,/data-blueprint-entry/);
  assert.match(html,/<aside class="bp-rail left"/);
  assert.match(html,/<aside class="bp-rail right"/);
  assert.match(html,/客户门户（PC）/);
  assert.match(html,/移动端 APP/);
  const layers=[...html.matchAll(/data-blueprint-layer="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(layers,["应用展示层","中台能力层","业务后台层","分析建模层","标准层","数据整合层"]);
  assert.ok((html.match(/class="bp-module"/g)||[]).length>=30);
  assert.match(html,/数据中台/);
  assert.match(html,/业务中台/);
  assert.match(html,/ODS/);
  assert.match(html,/DWD/);
});

test("离线无脚本，并有窄屏图内滚动、打印和文字替代路径",()=>{
  assert.doesNotMatch(html,/<script\b|<iframe\b/i);
  assert.deepEqual([...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(m=>m[1]),["../assets/product-panorama-svg-theme.css"]);
  assert.doesNotMatch(html,/<link[^>]+(?:https?:\/\/|\/\/)/i);
  assert.doesNotMatch(html,/<(?:img|source|video)\b/i);
  assert.match(html,/\.bp-viewport\{overflow-x:auto/);
  assert.match(html,/@media print/);
  assert.match(html,/role="region" tabindex="0"/);
  assert.match(html,/<details class="bp-text">/);
  assert.match(html,/非实际部署/);
  for(const [,id] of html.matchAll(/aria-labelledby="([^"]+)"/g)){
    assert.ok(html.includes('id="'+id+'"'),"missing label for "+id);
  }
});

test("架构按需路由，不强制增加全局 HTML 或画无依据连线",()=>{
  assert.match(arch,/产品架构全景图/);
  assert.match(arch,/product-architecture-panorama\.md/);
  assert.match(spec,/普通回答默认 Markdown/);
  assert.match(spec,/箭头是关系，不是装饰/);
  assert.match(spec,/不得凭审美添加/);
  assert.match(spec,/实际生成时应/);
  assert.match(spec,/纯 HTML \+ CSS/);
});


test("通用产品全景沿用 SVG 系列的蓝色强调及白底细边框，且无外部依赖",()=>{
 assert.match(svgTheme,/#3a83f7/i);
 assert.match(svgTheme,/#dfe5ed/i);
 assert.match(svgTheme,/\.bp-entry/);
 assert.match(svgTheme,/\.genui-product-panorama/);
 assert.doesNotMatch(svgTheme,/@import\b|url\s*\(/i);
});

test("全景图五类浅色能力层可区分，禁止每张色块左侧单独加粗竖线",()=>{
 for(const tone of ["#e7f1ff","#e5f6ee","#eeeaff","#fff2d9","#e4f5f8"])
  assert.ok(svgTheme.includes(tone),"缺少语义浅色层："+tone);
 assert.doesNotMatch(svgTheme,/border-left(?:-color|-width)?\s*:/i);
 assert.match(svgTheme,/\.bp-layer :?\.?bp-label|\.bp-layer \.bp-label/);
});
