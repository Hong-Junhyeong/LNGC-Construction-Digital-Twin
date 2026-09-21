'use client';
import {keelHeight} from '@/lib/three/geometry';
import {xAt} from '@/lib/three/constants';
import {MATERIALS as M} from '@/lib/three/materials';

/** Fixed educational dock environment. Supports are world objects, never hull children. */
export default function DockModel(){
 const stations=Array.from({length:15},(_,i)=>.04+i*.064);
 return <group name="DOCK" userData={{objectId:'DOCK',entityId:'DOCK',geometrySource:'ASSUMPTION',selectable:false}}>
  <mesh name="DOCK/FLOOR" position={[147.45,-2,0]} raycast={()=>{}}><boxGeometry args={[325,1,64]}/><meshStandardMaterial color="#aebbc1" roughness={.92}/></mesh>
  {[-1,1].map(side=><mesh key={side} name={`DOCK/STAGING_LANE_${side<0?'PORT':'STBD'}`} position={[147.45,-1.4,side*70]} raycast={()=>{}}><boxGeometry args={[325,.2,34]}/><meshStandardMaterial color="#c6d0d4" roughness={.95}/></mesh>)}
  {stations.flatMap((u,index)=>[-1,1].map(side=>{const top=keelHeight(u),bottom=-1.5,height=top-bottom,id=`DOCK/SUPPORT_${String(index*2+(side>0?2:1)).padStart(2,'0')}`;return <group key={id} name={id} userData={{objectId:id,entityId:'DOCK',geometrySource:'ASSUMPTION',fixedToDock:true,selectable:false}}><mesh position={[xAt(u),bottom+height/2,side*2.4]} raycast={()=>{}}><boxGeometry args={[2.2,height,3.2]}/><meshStandardMaterial color={M.steel} roughness={.86}/></mesh><mesh position={[xAt(u),top-.12,side*2.4]} raycast={()=>{}}><boxGeometry args={[3.4,.25,4.2]}/><meshStandardMaterial color="#667780" roughness={.9}/></mesh></group>}))}
 </group>;
}
