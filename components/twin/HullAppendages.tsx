'use client';
import {Paint,Box} from './ModelParts';
import {MATERIALS as M} from '@/lib/three/materials';
/** Generic underwater teaching proxies, not reference-vessel CAD or verified shaft count. */
export default function HullAppendages({id,selected}:{id:string;selected:boolean}){
 if(id==='B01')return <group name="B01/BULBOUS_BOW" userData={{geometrySource:'ASSUMPTION',referenceGeometry:'UNKNOWN'}}><mesh position={[288.7,5,0]} scale={[6.2,3,3]}><sphereGeometry args={[1,32,20]}/><Paint color={M.bottom} selected={selected}/></mesh></group>;
 if(id!=='B09')return null;
 return <group name="B09/PROPULSION_ZONE" userData={{geometrySource:'ASSUMPTION',actualShaftCount:null}}>
 <mesh name="SHAFT_LINE" position={[11,3.5,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.55,.55,14,16]}/><Paint color={M.steel} selected={selected}/></mesh>
 <mesh name="SKEG" position={[14,5,0]}><boxGeometry args={[7,4,1.2]}/><Paint color={M.bottom} selected={selected}/></mesh>
 <group name="PROPELLER" position={[6,3.5,0]} rotation={[0,0,Math.PI/2]}>
 <mesh><cylinderGeometry args={[.9,.65,1.8,20]}/><Paint color={M.propeller} selected={selected}/></mesh>
 {[0,1,2,3,4].map(i=><group key={i} rotation={[0,i*Math.PI*2/5,0]}><mesh position={[1.5,0,0]} rotation={[.18,0,.22]} scale={[1.65,.18,.58]}><sphereGeometry args={[1,16,10]}/><Paint color={M.propeller} selected={selected}/></mesh></group>)}
 </group>
 <group name="RUDDER"><Box at={[1.2,7,0]} size={[1.4,11, .7]} color={M.bottom} selected={selected}/><Box at={[2.4,3.4,0]} size={[3.2,5.4,.65]} color={M.bottom} selected={selected}/></group>
 </group>;
}
