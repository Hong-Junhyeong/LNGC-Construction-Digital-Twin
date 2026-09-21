import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {Vector3,PerspectiveCamera} from 'three';
const require=createRequire(import.meta.url),viteRequire=createRequire(require.resolve('vite'));
const {build}=viteRequire('esbuild');
const outfile=fileURLToPath(new URL('../.p12-geometry-test.mjs',import.meta.url));
try{
 await build({stdin:{contents:"export * from './lib/three/geometry';export * from './lib/three/constants';export * from './lib/three/camera';",resolveDir:fileURLToPath(new URL('..',import.meta.url)),loader:'ts'},outfile,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const G=await import(new URL('../.p12-geometry-test.mjs',import.meta.url)),blocks=JSON.parse(readFileSync(new URL('../data/blocks.json',import.meta.url)));
 function check(g,label){const p=g.attributes.position,idx=g.index;assert(p.count>0,label);for(const v of p.array)assert(Number.isFinite(v),label+' finite');const indices=idx?idx.array:Array.from({length:p.count},(_,i)=>i);for(let i=0;i<indices.length;i+=3){const a=new Vector3().fromBufferAttribute(p,indices[i]),b=new Vector3().fromBufferAttribute(p,indices[i+1]),c=new Vector3().fromBufferAttribute(p,indices[i+2]);assert(b.sub(a).cross(c.sub(a)).lengthSq()>1e-12,label+' nondegenerate')}g.computeBoundingBox();g.dispose()}
 for(const b of blocks){check(G.hullGeometry(b.uStart,b.uEnd),b.entityId);const d=G.hullGeometry(b.uStart,b.uEnd,true);for(const i of d.index.array)assert(d.attributes.normal.getY(i)>.99,b.entityId+' deck normals');check(d,b.entityId+' deck');}
 for(let i=0;i<blocks.length-1;i++){const a=G.hullGeometry(blocks[i].uStart,blocks[i].uEnd).attributes.position,b=G.hullGeometry(blocks[i+1].uStart,blocks[i+1].uEnd).attributes.position,count=G.hullRing(blocks[i].uEnd).length;for(let k=0;k<count;k++)for(let axis=0;axis<3;axis++)assert.equal(a.array[(a.count-count+k)*3+axis],b.array[k*3+axis],'shared block seam');}
 for(let i=0;i<=1000;i++){const u=i/1000,w=G.halfWidth(u);assert(w>=0&&w<=23.20001);for(const [x,y,z] of G.hullRing(u)){assert(x>=-.001&&x<=294.901);assert(y>=0&&y<=26.5);assert(Math.abs(z)<=23.20001)}}
 const bow=G.hullRing(.04);assert(bow[0][0]>bow[8][0],'raked bow');assert(Math.abs(bow[0][2])>Math.abs(bow[8][2]),'bow flare');assert(G.keelHeight(1)>G.keelHeight(.8),'rising stern');
 const port=G.hullGeometry(.2,.3);assert(port.attributes.normal.getZ(1)<0,'outward port normals');
 for(const t of G.TANKS){check(G.tankCavityGeometry(G.xAt(t.start)-G.xAt(t.end),t.width),t.id+' cavity');assert(t.width/2<G.halfWidth(t.start));assert(t.width/2<G.halfWidth(t.end));}
 for(const [w,t] of [[15,1.4],[14.5,1],[14,.6]])check(G.sailGeometry(w,t),'sail');
 assert.equal(26.5+3.5+27.5+18,75.5,'assumed deployed sail top');assert.equal(3.5+18,21.5,'assumed stowed sail height');
 assert.equal(G.deckSurface(.055,5),28.5);assert.equal(G.deckSurface(.965,5),26.5);assert.equal(G.deckSurface(.4,5),32);assert.equal(G.deckSurface(.32,5),26.5);
 for(const bounds of [G.MODEL_BOUNDS,G.VESSEL_BOUNDS])for(const aspect of [.6,1,2])for(const view of ['reset','side','front','top','fit']){
  const camera=new PerspectiveCamera(35,aspect,.5,3000);camera.position.set(370,190,350);G.fitCamera(camera,view,new Vector3(147.45,40.5,0),bounds);camera.updateMatrixWorld();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){const p=new Vector3(x,y,z).project(camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1&&Math.abs(p.z)<1,`${view} fits envelope at aspect ${aspect}`)}
 }
 assert.equal(G.OBJECTS.filter(o=>o.objectType==='BLOCK_COMPONENT').length,9);for(const id of ['T01/CARGO_VOLUME','T02/CARGO_VOLUME','T03/CARGO_VOLUME','T04/CARGO_VOLUME','WC01','WC02','B08/ENGINE_ROOM'])assert(G.objectById(id));
 console.log('PASS P12: finite nondegenerate meshes, outward normals, exact block seams, vessel envelope, flare/rake/aft run, cavity and sail geometry, deck anchors, camera frustum at 3 aspects, existing selection IDs. This is CPU geometry validation, NOT WebGL visual verification.');
}finally{rmSync(outfile,{force:true})}
