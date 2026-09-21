'use client';
import {useMemo,useRef,useEffect,useState,type ReactNode} from 'react';
import {useFrame,useThree} from '@react-three/fiber';
import {Edges,Html} from '@react-three/drei';
import {Group,Vector3} from 'three';
import type {BlockState} from '@/lib/twin/block-state';
import {INDICATOR_COLORS} from '@/lib/twin/block-state';
import {useTwin} from '@/application/TwinContext';
import {metadata} from '@/lib/three/constants';
export default function BlockModel({state,length,width,children}:{state:BlockState;length:number;width:number;children:ReactNode}){
 const ref=useRef<Group>(null),{invalidate}=useThree(),{selectedObject,simulationResult}=useTwin();const [initialPosition]=useState(state.position);
 const impact=simulationResult?.blockImpacts.find(b=>b.blockId===state.blockId);
 const selected=selectedObject===state.blockId+'/SHELL';
 const [reduceMotion,setReduceMotion]=useState(false);
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduceMotion(media.matches);change();media.addEventListener('change',change);return()=>media.removeEventListener('change',change)},[]);
 const target=useMemo(()=>new Vector3(...state.position),[state.position]);
 useEffect(()=>{invalidate()},[target,invalidate]);
 useFrame((_,delta)=>{if(!ref.current)return;if(reduceMotion)ref.current.position.copy(target);else ref.current.position.lerp(target,1-Math.exp(-Math.min(delta,.1)*12));if(ref.current.position.distanceTo(target)>.01)invalidate();else ref.current.position.copy(target)});
 const warning=state.quality!=='NONE';
 return <group ref={ref} name={state.blockId} position={initialPosition} visible={state.stage!=='NOT_STARTED'} userData={{...metadata(state.blockId+'/SHELL',state.blockId,'BLOCK_COMPONENT',state.blockId+' Simulation Block'),blockId:state.blockId,stage:state.stage,progress:state.progress,qualityStatus:state.quality,progressBasis:state.progressBasis}}>
 <group position={[-state.finalPosition[0],0,0]}>{children}</group>
 {(selected||warning)&&<mesh position={[0,16,0]} raycast={()=>{}}><boxGeometry args={[length+.3,32.4,width+.3]}/><meshBasicMaterial visible={false}/><Edges color={selected?INDICATOR_COLORS.selected:warning?(state.quality==='REWORK'?INDICATOR_COLORS.rework:INDICATOR_COLORS.hold):'#668299'} lineWidth={selected?2:1}/></mesh>}
 {warning&&<mesh position={[0,35,0]} raycast={()=>{}}><octahedronGeometry args={[2,0]}/><meshBasicMaterial color={state.quality==='REWORK'?INDICATOR_COLORS.rework:INDICATOR_COLORS.hold}/></mesh>}
 {impact&&<mesh position={[0,16,0]} raycast={()=>{}}><boxGeometry args={[length+1.4,34,width+1.4]}/><meshBasicMaterial visible={false}/><Edges color={impact.direct?INDICATOR_COLORS.hold:INDICATOR_COLORS.delayed} lineWidth={2}/></mesh>}
 {(selected||warning||impact)&&<Html position={[0,40,0]} center style={{pointerEvents:'none'}}><span className={'block-3d-label '+(warning?'issue':'')}>{state.blockId} · {warning?state.quality.replaceAll('_',' '):state.stage.replaceAll('_',' ')}{impact?` · SCENARIO +${impact.maxFinishDelta}d`:''}</span></Html>}
 </group>;
}
