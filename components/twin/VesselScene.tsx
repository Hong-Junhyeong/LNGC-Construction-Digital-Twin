'use client';
import {useEffect,useRef,type ComponentRef} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import {PerspectiveCamera,Vector3} from 'three';
import {useTwin} from '@/application/TwinContext';
import {fitCamera,VESSEL_BOUNDS,MODEL_BOUNDS,type CameraView} from '@/lib/three/camera';
import {MATERIALS as M} from '@/lib/three/materials';
import VesselModel from './VesselModel';
import DockModel from './DockModel';
function RendererLifecycle(){const {gl}=useThree();useEffect(()=>()=>{gl.setAnimationLoop(null);gl.dispose()},[gl]);return null;}
function CameraRig({view,revision}:{view:CameraView;revision:number}){
 const {blockStates,playbackStep}=useTwin();const assembled=blockStates.every(b=>playbackStep>=b.erectionFinish);
 const controls=useRef<ComponentRef<typeof OrbitControls>>(null);const {camera,size,invalidate}=useThree();
 useEffect(()=>{if(!(camera instanceof PerspectiveCamera))return;const target=fitCamera(camera,view,controls.current?.target??new Vector3(147.45,40.5,0),assembled?VESSEL_BOUNDS:MODEL_BOUNDS);controls.current?.target.copy(target);controls.current?.update();invalidate()},[camera,size.width,size.height,view,revision,invalidate,assembled]);
 return <OrbitControls ref={controls} makeDefault enableDamping dampingFactor={.12} minDistance={20} maxDistance={1200} maxPolarAngle={Math.PI*.94} target={[147.45,40.5,0]}/>;
}
export default function VesselScene({cutaway,view,revision,debug}:{cutaway:boolean;view:CameraView;revision:number;debug:boolean}){
 const {selectObject}=useTwin();
 return <Canvas frameloop="demand" dpr={[1,1.5]} camera={{position:[370,190,350],fov:35,near:.5,far:3000}} gl={{antialias:true,preserveDrawingBuffer:true}} onPointerMissed={()=>selectObject(null)}>
 <color attach="background" args={[M.background]}/><hemisphereLight args={['#ffffff','#7b929e',2.2]}/><directionalLight position={[180,250,140]} intensity={2.4}/><directionalLight position={[-100,80,-150]} intensity={1}/>
 <RendererLifecycle/><DockModel/><VesselModel cutaway={cutaway}/><gridHelper args={[500,25,M.grid,M.grid]} position={[147.45,-2.55,0]}/>
 {debug&&<axesHelper args={[70]}/>}<CameraRig view={view} revision={revision}/>
 </Canvas>;
}
