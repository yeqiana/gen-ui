import assert from "node:assert/strict";
export function losslessWebpDimensions(b){
 assert.equal(b.toString("ascii",0,4),"RIFF");
 assert.equal(b.toString("ascii",8,12),"WEBP");
 assert.equal(b.readUInt32LE(4)+8,b.length);
 for(let p=12;p+8<=b.length;){
  const kind=b.toString("ascii",p,p+4),n=b.readUInt32LE(p+4),start=p+8;
  assert.ok(start+n<=b.length,"truncated WebP chunk");
  if(kind==="VP8L"){
   assert.ok(n>=5);assert.equal(b[start],0x2f);
   const bits=b.readUInt32LE(start+1);
   return {width:(bits&0x3fff)+1,height:((bits>>>14)&0x3fff)+1};
  }
  p=start+n+(n%2);
 }
 throw Error("expected lossless VP8L image");
}
