import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url);
const {validate}=require('../assets/architecture-views.js');
const base=()=>({type:'系统架构',title:'模型边界测试',layout:'stack',groups:[{id:'a',name:'入口层',items:['API']},{id:'b',name:'业务层',items:['Service']}]});
test('accepts ordinary architecture and twelve explicit relationships',()=>{
 const model=base();model.flows=Array.from({length:12},(_,i)=>({from:'a',to:'b',label:'关系 '+(i+1),basis:'design',evidence:'docs/architecture.md'}));
 assert.equal(validate(model),model);
});
test('rejects cross-group ID/name collisions even without flows',()=>{
 const model=base();model.groups=[{id:'B',name:'A',items:['a']},{id:'A',name:'B',items:['b']}];
 assert.throws(()=>validate(model),/ambiguous group reference/);
});
test('rejects cross-group ID/name collisions before validating flows',()=>{
 const model=base();model.groups=[{id:'B',name:'A',items:['a']},{id:'A',name:'B',items:['b']}];model.flows=[{from:'A',to:'B',label:'关系'}];
 assert.throws(()=>validate(model),/ambiguous group reference/);
});
test('allows an ID to equal its own group name',()=>{
 const model=base();model.groups=[{id:'entry',name:'entry',items:['API']},{id:'service',name:'业务层',items:['Service']}];
 model.flows=[{from:'entry',to:'service',label:'调用'}];assert.equal(validate(model),model);
});

test('implementation relationships require non-empty evidence',()=>{
 const model=base();model.flows=[{from:'a',to:'b',label:'代码调用',basis:'implementation'}];
 assert.throws(()=>validate(model),/invalid architecture flows/);
 model.flows[0].evidence='src/service/OrderService.java';assert.equal(validate(model),model);
});
test('accepts exact aggregate limits of 128 groups and 512 items',()=>{
 const groups=Array.from({length:16},(_,i)=>({name:'root-'+i,children:Array.from({length:7},(_,j)=>({name:'child-'+i+'-'+j,items:['x']}))}));
 assert.equal(validate({type:'系统架构',title:'128 groups',layout:'stack',groups}).groups.length,16);
 const itemGroups=Array.from({length:16},(_,i)=>({name:'item-root-'+i,items:Array(24).fill('x'.repeat(100)),children:[{name:'item-child-'+i,items:Array(8).fill('y'.repeat(100))}]}));
 assert.equal(validate({type:'系统架构',title:'512 items',layout:'stack',groups:itemGroups}).groups.length,16);
});
test('rejects aggregate group count above 128, including nested groups',()=>{
 const model=base();model.groups=Array.from({length:16},(_,i)=>({name:'root-'+i,children:Array.from({length:8},(_,j)=>({name:'child-'+i+'-'+j,children:[{name:'leaf-'+i+'-'+j,items:['x']}]}))}));
 assert.throws(()=>validate(model),/128 groups/);
});
test('rejects aggregate item count above 512',()=>{
 const model=base();model.groups=Array.from({length:16},(_,i)=>({name:'root-'+i,items:Array(24).fill('root item'),children:[{name:'child-'+i,items:Array(9).fill('child item')}]}));
 assert.throws(()=>validate(model),/512 items/);
});
test('rejects UTF-8 JSON payloads above 64 KiB',()=>{
 const model=base();model.groups=Array.from({length:16},(_,i)=>({name:'root-'+i,items:Array(24).fill('界'.repeat(100))}));
 assert.throws(()=>validate(model),/64 KiB/);
});
test('rejects nesting deeper than three levels without recursive overflow',()=>{
 const model=base();let node={name:'level-4',items:['x']};for(let i=3;i>=1;i--)node={name:'level-'+i,children:[node]};model.groups=[node];
 assert.throws(()=>validate(model),/3 levels/);
});
test('static architecture examples retain readable nodes and relationships without JavaScript',()=>{
 const html=fs.readFileSync(new URL('../demo/architecture-patterns.html',import.meta.url),'utf8');
 const summaries=[...html.matchAll(/<noscript>([\s\S]*?)<\/noscript>/g)].map(match=>match[1]);
 assert.equal(summaries.length,8);
 assert.ok(summaries.every(summary=>summary.includes('节点与分组：')&&summary.includes('关系：')&&summary.includes('→')));
});
