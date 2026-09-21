'use client';
import {useMemo,useEffect} from 'react';
import {blocks} from '@/data/repository';
import {useTwin} from '@/application/TwinContext';
import {hullGeometry,halfWidth,sectionCap} from '@/lib/three/geometry';
import {metadata,xAt,TANKS} from '@/lib/three/constants';
import {STAGE_COLORS,type BlockState} from '@/lib/twin/block-state';
import BlockModel from './BlockModel';
import HullAppendages from './HullAppendages';
import {MATERIALS as M} from '@/lib/three/materials';
import {WeatherCover} from './CargoTankModel';
import {Paint,Selectable,Box} from './ModelParts';
function HullBlock({id,start,end,cutaway,state}:{id:string;start:number;end:number;cutaway:boolean;state:BlockState}){
 const {selectedObject}=useTwin();const selected=selectedObject===id+'/SHELL';
 const shell=useMemo(()=>hullGeometry(start,end),[start,end]);const deck=useMemo(()=>hullGeometry(start,end,true),[start,end]);
 useEffect(()=>()=>{shell.dispose();deck.dispose()},[shell,deck]);
 const caps=useMemo(()=>[sectionCap(start,true),sectionCap(end)],[start,end]);
 useEffect(()=>()=>caps.forEach(g=>g.dispose()),[caps]);
 const detached=state.position[2]!==0;
 const color=STAGE_COLORS[state.stage],opacity=state.stage==='NOT_STARTED'?.15:state.stage==='FABRICATION'?.35:state.stage==='SUB_ASSEMBLY'?.6:1;
 return <BlockModel state={state} length={xAt(start)-xAt(end)} width={Math.max(halfWidth(start),halfWidth(end))*2}><Selectable meta={metadata(id+'/SHELL',id,'BLOCK_COMPONENT',id+' hull shell')}><mesh name={id+'/HULL_SURFACE'} geometry={shell} raycast={cutaway?()=>{}:undefined}><Paint color={color} selected={selected} opacity={cutaway?.13:opacity}/></mesh>{!cutaway&&<mesh geometry={deck}><Paint color={M.deck} opacity={opacity}/></mesh>}{detached&&!cutaway&&caps.map((g,i)=>(i===0?start>0:end<1)&&<mesh key={i} geometry={g}><Paint color={color} opacity={opacity}/></mesh>)}<HullAppendages id={id} selected={selected}/></Selectable>{!cutaway&&TANKS.filter(t=>start<t.end&&end>t.start).map(t=><WeatherCover key={t.id} id={id} start={Math.max(start,t.start)} end={Math.min(end,t.end)} width={t.width} color={M.cover} opacity={opacity}/>)}{id==='B01'&&!cutaway&&<Selectable meta={metadata(id+'/SHELL',id,'BLOCK_COMPONENT',id+' forecastle')}><Box at={[xAt(.07),27.5,0]} size={[17.7,2,20]} color={M.deck} selected={selected}/></Selectable>}</BlockModel>;
}
export default function HullModel({cutaway}:{cutaway:boolean}){const {blockStates}=useTwin();return <group name="Hull">{blocks.map(b=><HullBlock key={b.entityId} id={b.entityId} start={b.uStart} end={b.uEnd} cutaway={cutaway} state={blockStates.find(s=>s.blockId===b.entityId)!}/>)}</group>}
