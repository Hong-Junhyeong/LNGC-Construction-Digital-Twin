'use client';
import {useTwin} from '@/application/TwinContext';
import {metadata,xAt} from '@/lib/three/constants';
import {MATERIALS as M} from '@/lib/three/materials';
import {Selectable,Box,Wire} from './ModelParts';
import SystemPresence from './SystemPresence';
/** Interior equipment envelope only; no claim about actual engine quantity or arrangement. */
export default function EngineRoomModel(){
 const {selectedObject,blockStates,playbackStep}=useTwin();const x=xAt(.873),host=blockStates.find(b=>b.blockId==='B08')!;
 if(playbackStep<host.erectionFinish)return null;
 return <Selectable meta={metadata('B08/ENGINE_ROOM','B08','VESSEL_COMPONENT','Engine room envelope',{hostBlockId:'B08'})}><group name="B08/ENGINE_ROOM" userData={{geometrySource:'ASSUMPTION',actualEngineCount:null}}>
 <Box at={[x,3.25,0]} size={[26,.5,18]} color={M.steel}/>
 <Wire points={[[x-13,3.5,-9],[x-13,24,-9],[x-13,24,-9],[x+13,24,-9],[x+13,24,-9],[x+13,3.5,-9]]}/>
 <SystemPresence taskId="MACH"><group name="B08/MAIN_ENGINE_PROXY"><Box at={[x,4.25,0]} size={[22,1.5,12]} color={M.bottom}/><Box at={[x,11,0]} size={[20,12,10]} color={M.steel} selected={selectedObject==='B08/ENGINE_ROOM'}/><Box at={[x,17.4,0]} size={[20,.8,10]} color={M.blue}/></group></SystemPresence>
 </group></Selectable>;
}
