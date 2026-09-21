import type {Dependency,MaterialRequirement,ResourceAllocation,ScheduleTask,WhatIfScenario,WhatIfResult} from '../../types/domain';
import {calculateSchedule,type ScheduleChanges} from './cpm.ts';
import {EPS} from './graph.ts';
export interface SimulationInput {tasks:ScheduleTask[];dependencies:Dependency[];requirements:MaterialRequirement[];allocations:ResourceAllocation[];}
/** A new snapshot per call. Neither baseline fixtures nor the submitted scenario are mutated. */
export function simulateScenario(input:SimulationInput,scenario:WhatIfScenario|null):WhatIfResult{
 const baseline=calculateSchedule(input.tasks,input.dependencies,'MASTER-P13');
 const changes:ScheduleChanges={};let directTaskIds:string[]=[],explanation='No scenario. Baseline schedule is unchanged.';
 if(scenario){
  if(scenario.baselineId!=='MASTER-P13')throw new Error('Unknown baseline. Select MASTER-P13.');
  if(!Number.isFinite(scenario.delayDays)||scenario.delayDays<0||scenario.delayDays>365)throw new Error('Delay must be a finite number from 0 to 365 master-calendar days.');
  const id=scenario.targetEntityId,days=scenario.delayDays;
  switch(scenario.type){
   case 'WELDING_REWORK':{const t=input.tasks.find(t=>t.taskId===`E-${id}`&&t.entityIds.includes(id));if(!t||scenario.targetTaskId!==t.taskId)throw new Error('Invalid welding target. Select an existing block erection task.');directTaskIds=[t.taskId];changes.durationAdds={[t.taskId]:days};explanation=`Explicit +${days}d repair/reinspection allowance extends ${t.taskId} in Master Schedule calendar time. 48 MH is context only; it is not converted into days. Playback steps do not calculate delivery delay.`;break;}
   case 'MATERIAL_DELAY':{const reqs=input.requirements.filter(r=>r.entityId===id);if(!reqs.length||!reqs.some(r=>r.taskId===scenario.targetTaskId))throw new Error('Invalid material target. Select a block with a material requirement.');changes.releaseDays={};for(const r of reqs){changes.releaseDays[r.taskId]=Math.max(changes.releaseDays[r.taskId]??0,r.needByDay+days);}directTaskIds=[...new Set(reqs.map(r=>r.taskId))];explanation=`Selected block ${id}: material release is assumed at master need-by + ${days}d. Its consumer ${directTaskIds.join(', ')} is a shared package. Mock inventory is not silently converted into schedule duration.`;break;}
   case 'WIND_CHALLENGER_DELAY':{const task=input.tasks.find(t=>t.taskId==='WC_LIFT'&&t.entityIds.includes(id));if(!task||scenario.targetTaskId!=='WC_LIFT')throw new Error('Invalid Wind Challenger target. Select WC01 or WC02.');directTaskIds=['WC_LIFT'];changes.durationAdds={WC_LIFT:days};explanation=`${id} adds ${days}d once to the shared WC_LIFT package. Both WC01/WC02 are system entities, not hull blocks. WC_TEST joins commissioning through the existing graph.`;break;}
   case 'CRANE_BREAKDOWN':case 'WEATHER_SHUTDOWN':{
    const start=scenario.startDay;if(start===undefined||!Number.isFinite(start)||start<0||start>baseline.finishDay)throw new Error(`Outage start must be a finite master-calendar day from 0 to ${baseline.finishDay}.`);
    const eligible=scenario.type==='CRANE_BREAKDOWN'?input.allocations.filter(a=>a.resourceId===id).map(a=>a.taskId):id==='OUTDOOR'?input.tasks.filter(t=>t.taskId.startsWith('E-')||['WC_FND_INSTALL','WC_LIFT'].includes(t.taskId)).map(t=>t.taskId):[];
    if(!eligible.length)throw new Error('Invalid outage target: no resource allocations or outdoor tasks match.');
    changes.outage={start,end:start+days,taskIds:eligible};explanation=`One half-open outage [D${start}, D${start+days}) suspends only ${scenario.type==='CRANE_BREAKDOWN'?'tasks allocated to '+id:'assumed outdoor erection / WAPS lifting tasks'}. Tasks shifted outside the window incur no second penalty. No resource leveling or weather thresholds are inferred.`;break;
   }
   default:throw new Error('Unsupported scenario type.');
  }
 }
 const scenarioSchedule=calculateSchedule(input.tasks,input.dependencies,scenario?scenario.scenarioId:'NO-SCENARIO',changes);
 const before=new Map(baseline.tasks.map(t=>[t.taskId,t]));
 if(changes.outage){const ids=changes.outage.taskIds;directTaskIds=scenarioSchedule.tasks.filter(t=>{const b=before.get(t.taskId)!;const readiness=Math.max(0,...input.dependencies.filter(d=>d.successorTaskId===t.taskId).map(d=>scenarioSchedule.tasks.find(s=>s.taskId===d.predecessorTaskId)!.ef+d.lagDays));return ids.includes(t.taskId)&&(t.ef-t.es>b.durationDays+EPS||t.es>readiness+EPS);}).map(t=>t.taskId);}
 const taskImpacts=scenarioSchedule.tasks.filter(t=>{const b=before.get(t.taskId)!;return Math.abs(t.es-b.es)>EPS||Math.abs(t.ef-b.ef)>EPS;}).map(t=>{const b=before.get(t.taskId)!;return {taskId:t.taskId,baselineStart:b.es,scenarioStart:t.es,baselineFinish:b.ef,scenarioFinish:t.ef,finishDelta:Math.round((t.ef-b.ef)*1e8)/1e8,direct:directTaskIds.includes(t.taskId)};});
 const floatChanges=scenarioSchedule.tasks.filter(t=>Math.abs(t.totalFloat-before.get(t.taskId)!.totalFloat)>EPS||directTaskIds.includes(t.taskId)).map(t=>{const b=before.get(t.taskId)!;return {taskId:t.taskId,baselineFloat:b.totalFloat,scenarioFloat:t.totalFloat,consumedDays:Math.max(0,b.totalFloat-t.totalFloat)};});
 const affectedEntityIds=[...new Set(taskImpacts.flatMap(t=>before.get(t.taskId)!.entityIds))];
 const blockImpacts=affectedEntityIds.filter(id=>/^B0[1-9]$/.test(id)).sort().map(blockId=>{const list=taskImpacts.filter(t=>before.get(t.taskId)!.entityIds.includes(blockId));return {blockId,taskIds:list.map(t=>t.taskId),maxFinishDelta:Math.max(...list.map(t=>t.finishDelta)),direct:scenario?.targetEntityId===blockId&&list.some(t=>t.direct)};});
 const criticalKey=(paths:string[][])=>paths.map(p=>p.join('>')).sort().join('|');
 return {resultId:`RESULT-${scenario?.scenarioId??'BASELINE'}`,scenarioId:scenario?.scenarioId??'NONE',baselineSnapshotId:baseline.snapshotId,scenarioSnapshotId:scenarioSchedule.snapshotId,baselineFinishDay:baseline.finishDay,scenarioFinishDay:scenarioSchedule.finishDay,incrementalDelayDays:Math.round((scenarioSchedule.finishDay-baseline.finishDay)*1e8)/1e8,changedTaskIds:taskImpacts.map(t=>t.taskId),affectedEntityIds,criticalPathsBefore:baseline.criticalPaths,criticalPathsAfter:scenarioSchedule.criticalPaths,dataMeta:{sourceType:'DERIVED',availability:'AVAILABLE',sourceIds:['P02','P03','P09-CPM'],asOf:null},scenario:scenario?structuredClone(scenario):null,baseline,scenarioSchedule,taskImpacts,floatChanges,blockImpacts,directTaskIds,criticalPathChanged:criticalKey(baseline.criticalPaths)!==criticalKey(scenarioSchedule.criticalPaths),newCriticalTaskIds:scenarioSchedule.tasks.filter(t=>t.isCritical&&!before.get(t.taskId)!.isCritical).map(t=>t.taskId),targetFloatConsumed:Math.max(0,...floatChanges.filter(t=>directTaskIds.includes(t.taskId)).map(t=>t.consumedDays)),explanation};
}
