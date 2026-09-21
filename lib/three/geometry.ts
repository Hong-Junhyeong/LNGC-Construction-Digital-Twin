import {BufferGeometry,Float32BufferAttribute,Shape,ExtrudeGeometry,Path,Vector2} from 'three';
import {VESSEL,xAt,TANKS} from './constants';
/** P11 educational offsets; NOT a measured lines plan. u runs bow to stern. */
export const HULL_STATIONS = [[0,0,0,4],[.04,.45,.30,1],[.10,.88,.72,0],[.18,1,.96,0],[.80,1,.96,0],[.93,.80,.55,3],[1,.45,.20,9]];
function profile(u:number,column:number){
 for(let i=1;i<HULL_STATIONS.length;i++)if(u<=HULL_STATIONS[i][0]){
  const a=HULL_STATIONS[i-1],b=HULL_STATIONS[i],t=(u-a[0])/(b[0]-a[0]);
  // Monotone cubic Hermite interpolation: no breadth overshoot at shoulders.
  const slope=(j:number)=>{if(j===0)return (HULL_STATIONS[1][column]-HULL_STATIONS[0][column])/(HULL_STATIONS[1][0]-HULL_STATIONS[0][0]);if(j===HULL_STATIONS.length-1)return (b[column]-a[column])/(b[0]-a[0]);const p=HULL_STATIONS[j-1],q=HULL_STATIONS[j],r=HULL_STATIONS[j+1],d0=(q[column]-p[column])/(q[0]-p[0]),d1=(r[column]-q[column])/(r[0]-q[0]);return d0*d1<=0?0:2*d0*d1/(d0+d1)};
  const h=b[0]-a[0];return (2*t**3-3*t*t+1)*a[column]+(t**3-2*t*t+t)*h*slope(i-1)+(-2*t**3+3*t*t)*b[column]+(t**3-t*t)*h*slope(i);
 }return HULL_STATIONS.at(-1)![column];
}
export const halfWidth=(u:number)=>VESSEL.beam/2*profile(u,1);
export const keelHeight=(u:number)=>profile(u,3);
export function hullRing(u:number):[number,number,number][]{
 const w=halfWidth(u),low=VESSEL.beam/2*profile(u,2),k=keelHeight(u),r=Math.min(3,low*.35);
 const side:[number,number][]=[[26.5,w],[20,low+(w-low)*.55],[11.5,low],[k+r,low]];
 for(let i=1;i<=5;i++){const a=i*Math.PI/10;side.push([k+r-r*Math.sin(a),low-r+r*Math.cos(a)])}
 const yz=[...side.map(([y,z])=>[y,-z]),...side.slice().reverse()];
 return yz.map(([y,z])=>[xAt(u)-4.4*Math.max(0,1-u/.10)*(1-y/26.5),y,z]);
}
function meshFrom(p:number[],raw:number[]){
 const idx:number[]=[];
 for(let i=0;i<raw.length;i+=3){const [a,b,c]=raw.slice(i,i+3).map(v=>v*3),ab=[p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]],ac=[p[c]-p[a],p[c+1]-p[a+1],p[c+2]-p[a+2]];const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];if(cross.reduce((s,v)=>s+v*v,0)>1e-12)idx.push(...raw.slice(i,i+3))}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function hullGeometry(start:number,end:number,deck=false){
 const us=[...new Set([start,...Array.from({length:201},(_,i)=>i/200).filter(u=>u>start&&u<end),...HULL_STATIONS.map(s=>s[0]).filter(u=>u>start&&u<end),...TANKS.flatMap(t=>[t.start,t.end]).filter(u=>u>start&&u<end),end])].sort((a,b)=>a-b);
 const p:number[]=[],indices:number[]=[];
 if(deck){
  for(let i=0;i<us.length-1;i++){const a=us[i],b=us[i+1],tank=TANKS.find(t=>(a+b)/2>t.start&&(a+b)/2<t.end);const strips=tank?[[-halfWidth(a),-tank.width/2,-halfWidth(b),-tank.width/2],[tank.width/2,halfWidth(a),tank.width/2,halfWidth(b)]]:[[-halfWidth(a),halfWidth(a),-halfWidth(b),halfWidth(b)]];
   for(const [a0,a1,b0,b1] of strips){const n=p.length/3;p.push(xAt(a),26.5,a0,xAt(a),26.5,a1,xAt(b),26.5,b0,xAt(b),26.5,b1);indices.push(n,n+2,n+1,n+1,n+2,n+3)}
  }
 }else{
  const count=hullRing(start).length;for(const u of us)p.push(...hullRing(u).flat());
  for(let i=0;i<us.length-1;i++)for(let j=0;j<count-1;j++){const a=i*count+j,b=a+count;indices.push(a,a+1,b,a+1,b+1,b)}
  if(end===1){const a=(us.length-1)*count;for(let j=1;j<count-1;j++)indices.push(a,a+j,a+j+1)}
 }
 return meshFrom(p,indices);
}
export function sectionCap(u:number,reverse=false){const ring=hullRing(u),idx:number[]=[];for(let j=1;j<ring.length-1;j++)idx.push(0,reverse?j+1:j,reverse?j:j+1);return meshFrom(ring.flat(),idx)}
/** Chamfered membrane envelope; +X extrusion. */
export function prismGeometry(length:number,width:number,bottom:number,top:number,chamfer=2){
 const w=width/2,shape=new Shape();const ring=[[-w+chamfer,bottom],[w-chamfer,bottom],[w,bottom+chamfer],[w,top-chamfer],[w-chamfer,top],[-w+chamfer,top],[-w,top-chamfer],[-w,bottom+chamfer]];
 shape.moveTo(...ring[0] as [number,number]);ring.slice(1).forEach(([z,y])=>shape.lineTo(z,y));shape.closePath();const g=new ExtrudeGeometry(shape,{depth:length,bevelEnabled:false,steps:1});g.rotateY(Math.PI/2);return g;
}
/** Roof and starboard side removed, so cutaway shows a cavity rather than a solid tank. */
export function tankCavityGeometry(length:number,width:number){
 const w=width/2,ring=[[3,-w+2],[5,-w],[28,-w],[30,-w+2],[30,w-2],[28,w],[5,w],[3,w-2]],p:number[]=[],idx:number[]=[];
 for(const x of [0,length])for(const [y,z] of ring)p.push(x,y,z);
 for(const j of [0,1,2,6,7]){const k=(j+1)%8;idx.push(j,k,j+8,k,k+8,j+8)}
 // Both bulkheads remain transparent-free cutaway surfaces.
 for(let j=1;j<7;j++){idx.push(0,j+1,j,8,8+j,8+j+1)}
 return meshFrom(p,idx);
}
/** Thin hollow curved hard-sail section: nested stages never interpenetrate. */
export function sailGeometry(width:number,thickness:number){
 const outline=(w:number,t:number)=>{const points:[number,number][]=[];for(const sign of [1,-1])for(let n=0;n<=24;n++){const i=sign===1?n:24-n,z=(i/24-.5)*w;points.push([.65*(1-(2*z/15)**2)+sign*t/2,z])}return points};
 const shape=new Shape(outline(width,thickness).map(([x,y])=>new Vector2(x,y)));const hole=new Path();const points=outline(width-.20,thickness-.20).reverse();hole.moveTo(...points[0]);points.slice(1).forEach(([x,y])=>hole.lineTo(x,y));hole.closePath();shape.holes.push(hole);
 const g=new ExtrudeGeometry(shape,{depth:18,bevelEnabled:false,steps:1});g.rotateX(-Math.PI/2);return g;
}
export function deckSurface(u:number,z=0){if(u>=.04&&u<=.10&&Math.abs(z)<=10)return 28.5;const tank=TANKS.find(t=>u>=t.start&&u<=t.end);return tank&&Math.abs(z)<=tank.width/2-2.5?32:26.5}
