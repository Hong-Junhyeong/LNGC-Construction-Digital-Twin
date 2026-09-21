import type {Block,ProductionStage,ScheduleTask} from '../../types/domain';
import {masterTasks} from '../../data/master-schedule.ts';
export type Vec3=[number,number,number];
export type QualityOverlay='NONE'|'QUALITY_HOLD'|'REWORK';
export interface BlockState {
 blockId:string;stage:ProductionStage;progress:number;quality:QualityOverlay;delayed:boolean;
 finalPosition:Vec3;assemblyPosition:Vec3;stagingPosition:Vec3;position:Vec3;
 taskId:string|null;plannedFinish:number;erectionStart:number;erectionFinish:number;
 progressBasis:'PLANNED_PREVIEW';sourceType:'DERIVED';
}
/** P07 display-only educational events, not actual quality history or schedule inputs. */
export const QUALITY_DEMO={blockId:'B04',holdStart:24,reworkStart:26,releaseDay:29,sourceType:'ASSUMPTION'} as const;
export const STAGE_ORDER:ProductionStage[]=['NOT_STARTED','FABRICATION','SUB_ASSEMBLY','BLOCK_ASSEMBLY','GRAND_ASSEMBLY','INSPECTION','STAGING','ERECTION','ERECTED','INTEGRATION','OUTFITTING','COMPLETED'];
export const STAGE_COLORS:Record<ProductionStage,string>={NOT_STARTED:'#9ba8b2',FABRICATION:'#83a9c0',SUB_ASSEMBLY:'#739db7',BLOCK_ASSEMBLY:'#648fae',GRAND_ASSEMBLY:'#5585a4',INSPECTION:'#477e9f',STAGING:'#668caa',ERECTION:'#3986b6',ERECTED:'#557f94',INTEGRATION:'#45859b',OUTFITTING:'#377e92',COMPLETED:'#588c79'};
export const INDICATOR_COLORS={selected:'#d69a26',hold:'#be4454',rework:'#bd662e',delayed:'#ad7a18'};
export function clampDay(day:number){return Number.isFinite(day)?Math.min(60,Math.max(0,day)):0}
export function taskFraction(task:ScheduleTask,day:number){return Math.min(1,Math.max(0,(day-task.baselineStartDay)/(task.baselineFinishDay-task.baselineStartDay||1)))}
const lerp=(a:Vec3,b:Vec3,t:number):Vec3=>a.map((v,i)=>v+(b[i]-v)*t) as Vec3;
/** Pure snapshot resolver. No mutation, dependency propagation, CPM or actual progress inference. */
export function getBlockState(block:Block,day:number,schedule:ScheduleTask[]):BlockState{
 const t=clampDay(day), id=block.entityId;
 const erection=masterTasks.find(task=>task.taskId===`E-${id}`)!;
 void schedule;
 const erectionStart=erection.playbackStartStep!,erectionFinish=erection.playbackEndStep!;
 let stage:ProductionStage='NOT_STARTED';
 if(t>=5)stage='FABRICATION';
 if(t>=10)stage='SUB_ASSEMBLY';
 if(t>=15)stage='BLOCK_ASSEMBLY';
 if(t>=20)stage='GRAND_ASSEMBLY';
 if(t>=25)stage='STAGING';
 if(t>=erectionStart)stage='ERECTION';
 if(t>=erectionFinish)stage='ERECTED';
 if(t>=45)stage='INTEGRATION';
 if(t>=48)stage='OUTFITTING';
 if(t>=60)stage='COMPLETED';
 // Normalized visual progress only. Master-calendar performance is calculated separately.
 const progress=Math.round(Math.min(100,t/60*100)*10)/10;
 const xc=294.9*(1-(block.uStart+block.uEnd)/2),laneX=147.45+1.2*(xc-147.45);
 const finalPosition:Vec3=[xc,0,0],assemblyPosition:Vec3=[laneX,0,140],stagingPosition:Vec3=[laneX,0,70];
 let position=finalPosition;
 if(t>=5&&t<25)position=assemblyPosition;
 else if(t>=25&&t<erectionStart)position=stagingPosition;
 else if(t>=erectionStart&&t<erectionFinish){
  const p=(t-erectionStart)/(erectionFinish-erectionStart||1),lift=35;
  if(p<.2)position=lerp(stagingPosition,[stagingPosition[0],lift,stagingPosition[2]],p/.2);
  else if(p<.65)position=lerp([stagingPosition[0],lift,stagingPosition[2]],[finalPosition[0],lift,finalPosition[2]],(p-.2)/.45);
  else if(p<.82)position=lerp([finalPosition[0],lift,finalPosition[2]],finalPosition,(p-.65)/.17);
  else position=finalPosition;
 }
 const quality:QualityOverlay=id===QUALITY_DEMO.blockId&&t>=QUALITY_DEMO.holdStart&&t<QUALITY_DEMO.releaseDay?(t<QUALITY_DEMO.reworkStart?'QUALITY_HOLD':'REWORK'):'NONE';
 return {blockId:id,stage,progress,quality,delayed:false,finalPosition,assemblyPosition,stagingPosition,position,taskId:stage==='ERECTION'?erection.taskId:null,plannedFinish:60,erectionStart,erectionFinish,progressBasis:'PLANNED_PREVIEW',sourceType:'DERIVED'};
}
export function getConstructionSnapshot(blocks:Block[],day:number,tasks:ScheduleTask[]){
 const states=blocks.map(b=>getBlockState(b,day,tasks));return {day:clampDay(day),states,overallProgress:Math.round(states.reduce((s,b)=>s+b.progress,0)/states.length*10)/10};
}
