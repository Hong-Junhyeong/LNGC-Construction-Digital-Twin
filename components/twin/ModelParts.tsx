'use client';
import {useMemo,type ReactNode} from 'react';
import {DoubleSide} from 'three';
import type {ThreeEvent} from '@react-three/fiber';
import {useTwin} from '@/application/TwinContext';
import {MATERIALS as M} from '@/lib/three/materials';
import type {ViewerMetadata} from '@/lib/three/constants';
import {usePresence} from './SystemPresence';
export function Selectable({meta,children}:{meta:ViewerMetadata;children:ReactNode}){
 const {selectObject}=useTwin();
 return <group name={meta.objectId} userData={meta} onClick={(e:ThreeEvent<MouseEvent>)=>{e.stopPropagation();selectObject(meta.objectId)}}>{children}</group>;
}
export function Paint({color,selected=false,opacity=1}:{color:string;selected?:boolean;opacity?:number}){
 const alpha=opacity*usePresence();return <meshStandardMaterial color={selected?M.selected:color} roughness={.68} metalness={.12} side={DoubleSide} transparent={alpha<1} opacity={alpha} depthWrite={alpha===1} emissive={selected?M.emissive:'#000000'} emissiveIntensity={selected?.15:0}/>;
}
export function Box({at,size,color=M.steel,selected=false}:{at:[number,number,number];size:[number,number,number];color?:string;selected?:boolean}){
 return <mesh position={at}><boxGeometry args={size}/><Paint color={color} selected={selected}/></mesh>;
}
export function Cylinder({at,radius,height,color=M.steel,selected=false}:{at:[number,number,number];radius:number;height:number;color?:string;selected?:boolean}){
 return <mesh position={at}><cylinderGeometry args={[radius,radius,height,12]}/><Paint color={color} selected={selected}/></mesh>;
}
export function Wire({points,color=M.steel}:{points:number[][];color?:string}){
 const array=useMemo(()=>new Float32Array(points.flat()),[points]);
 return <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[array,3]}/></bufferGeometry><lineBasicMaterial color={color}/></lineSegments>;
}
