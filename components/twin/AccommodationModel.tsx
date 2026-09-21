'use client';
import {useTwin} from '@/application/TwinContext';
import {metadata,xAt} from '@/lib/three/constants';
import {MATERIALS as M} from '@/lib/three/materials';
import {Selectable,Box,Cylinder} from './ModelParts';
export default function AccommodationModel(){
 const {selectedObject}=useTwin();const selected=selectedObject==='B08/ACCOMMODATION';const x=xAt(.873);
 return <group name="AftArea"><Selectable meta={metadata('B08/ACCOMMODATION','B08','VESSEL_COMPONENT','Accommodation',{hostBlockId:'B08'})}>
 <group name="Accommodation">
 <Box at={[x,30.5,0]} size={[31,8,31]} color={M.white} selected={selected}/>
 <Box at={[x+2,37.5,0]} size={[25,6,30]} color={M.white} selected={selected}/>
 <Box at={[x+7,43,0]} size={[16,5,34]} color={M.white} selected={selected}/>
 <Box at={[x+15.1,43.7,0]} size={[.25,1.4,31]} color={M.glass}/>
 {[-1,1].map(side=><group key={side}>{[31,35,39].map(y=><Box key={y} at={[x+3,y,side*(y===31?15.575:15.075)]} size={[23,.65,.14]} color={M.glass}/>)}<Box at={[x+7,43.7,side*17.075]} size={[16,1.4,.15]} color={M.glass}/><Box at={[x,26.55,side*18.3]} size={[10,.1,3]} color={M.steel}/><Box at={[x,27.9,side*18.3]} size={[11,2.6,3.3]} color={M.lifeboat}/></group>)}
 <group name="B08/UPTAKE"><Box at={[xAt(.91),34.75,0]} size={[8,16.5,9]} color={M.white} selected={selected}/></group><Box at={[xAt(.91),47,0]} size={[8,8,9]} color={M.funnel}/><Box at={[xAt(.91),51.2,0]} size={[8.5,.5,9.5]} color={M.glass}/>
 <Cylinder at={[x+10,51,0]} radius={.28} height={11} color={M.white}/><Box at={[x+10,53.3,0]} size={[.25,.25,8]} color={M.white}/>
 </group></Selectable>

 </group>;
}
