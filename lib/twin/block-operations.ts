import type {
  Block, Dependency, Material, MaterialRequirement, Production, Quality,
  Resource, ResourceAllocation, ScheduleTask,
} from '../../types/domain';
import type {BlockState, QualityOverlay} from './block-state';

export type OperationalNdtStatus='PENDING'|'IN_PROGRESS'|'HOLD'|'REINSPECTION'|'PASS';
export type OperationalGateStatus='NOT_READY'|'BLOCKED'|'REWORK'|'RELEASED';

export interface BlockOperationalState {
  blockId:string; name:string; zone:string; day:number;
  stage:BlockState['stage'];
  status:'NOT_STARTED'|'IN_PROGRESS'|'QUALITY_HOLD'|'REWORK'|'COMPLETED';
  progress:number; qualityOverlay:QualityOverlay;
  recorded:{dataDate:number;progressPct:number;stage:Production['stage'];status:Production['status']};
  material:{readinessPct:number;requiredQty:number;availableQty:number;shortageQty:number;unit:string;needByDay:number;availableDay:number|null;status:'READY'|'PARTIAL'|'DELAYED'};
  welding:{progressPct:number;status:'NOT_STARTED'|'IN_PROGRESS'|'COMPLETE';weldCount:number;completedWelds:number;pendingWelds:number};
  ndt:{status:OperationalNdtStatus;inspectedCount:number;passCount:number;passRate:number|null};
  ncr:{totalCount:number;openCount:number;closedCount:number};
  rework:{plannedManHours:number;completedManHours:number};
  qualityGate:OperationalGateStatus;
  schedule:{plannedStart:number;plannedFinish:number;actualStart:number|null;actualFinish:number|null;erectionStart:number;erectionFinish:number;floatDays:number|null;criticalPath:boolean|null;predecessors:string[];successors:string[]};
  resources:{id:string;name:string;status:string}[];
  provenance:{definition:'ASSUMPTION';plan:'DERIVED';operations:'MOCK'};
}

export interface OperationalData {
  blocks:Block[]; production:Production[]; materials:Material[]; requirements:MaterialRequirement[];
  quality:Quality[]; tasks:ScheduleTask[]; dependencies:Dependency[];
  resources:Resource[]; allocations:ResourceAllocation[];
}

const round1=(value:number)=>Math.round(value*10)/10;
const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));

/** Combines P03 fixtures with the P07 plan snapshot. It performs no CPM or delay propagation. */
export function getOperationalSnapshot(day:number,construction:BlockState[],data:OperationalData){
  const issues:string[]=[];
  const states:BlockOperationalState[]=data.blocks.flatMap(block=>{
    const plan=construction.find(item=>item.blockId===block.entityId);
    const recorded=data.production.find(item=>item.entityId===block.entityId);
    const quality=data.quality.find(item=>item.objectId===`${block.entityId}/SHELL`);
    const requirement=data.requirements.find(item=>item.entityId===block.entityId);
    const material=requirement&&data.materials.find(item=>item.materialLotId===requirement.materialLotId);
    if(!plan||!recorded||!quality||!requirement||!material){issues.push(`${block.entityId}: operational data unavailable (incomplete record).`);return [];}

    const isB04=block.entityId==='B04';
    // The fixture quantity is the lot ceiling. Playback shows how much of that lot
    // has been staged for the block, reaching the recorded ceiling before need-by.
    const fixtureQty=Math.min(requirement.requiredQty,material.quantity);
    const stagingCompleteDay=Math.max(1,Math.round(requirement.needByDay*.625));
    const stagedQty=Math.round(fixtureQty*clamp(day/stagingCompleteDay,0,1));
    const availableQty=day>=(material.availableDay??Infinity)?requirement.requiredQty:stagedQty;
    const readinessPct=round1(clamp(availableQty/Math.max(1,requirement.requiredQty)*100,0,100));
    const materialStatus=readinessPct>=100?'READY':day>requirement.needByDay?'DELAYED':'PARTIAL';
    const weldTarget=isB04&&day>=29?100:quality.weldingProgressPct;
    const weldingProgress=round1(weldTarget*clamp((day-6)/12,0,1));
    const weldCount=quality.inspectedCount;
    const completedWelds=Math.min(weldCount,Math.round(weldCount*weldingProgress/100));

    let ndtStatus:OperationalNdtStatus=day<18?'PENDING':day<20?'IN_PROGRESS':quality.ndtStatus;
    let inspectedCount=day<18?0:day<20?Math.round(quality.inspectedCount*(day-18)/2):quality.inspectedCount;
    let passCount=day<20?Math.min(inspectedCount,Math.round(inspectedCount*quality.passCount/Math.max(1,quality.inspectedCount))):quality.passCount;
    let qualityGate:OperationalGateStatus=day<20?'NOT_READY':'RELEASED';
    let openNcr=0,closedNcr=0,completedRework=0;
    if(isB04&&plan.quality==='QUALITY_HOLD'){
      ndtStatus='HOLD'; qualityGate='BLOCKED'; openNcr=quality.openNcrCount;
    }else if(isB04&&plan.quality==='REWORK'){
      ndtStatus='REINSPECTION'; qualityGate='REWORK'; openNcr=quality.openNcrCount;
      completedRework=round1(quality.reworkManHours*clamp((day-26)/3,0,1));
    }else if(isB04&&day>=29){
      ndtStatus='PASS'; qualityGate='RELEASED'; inspectedCount=quality.inspectedCount;
      passCount=quality.inspectedCount; closedNcr=quality.openNcrCount; completedRework=quality.reworkManHours;
    }
    if(isB04&&day>=20&&day<24){ndtStatus='PASS';passCount=inspectedCount;}
    const passRate=inspectedCount?round1(passCount/inspectedCount*100):null;
    const taskIds=data.tasks.filter(task=>task.entityIds.includes(block.entityId)).map(task=>task.taskId);
    const erectionTask=`E-${block.entityId}`;
    const assignedResources=data.allocations.filter(item=>taskIds.includes(item.taskId)).map(item=>data.resources.find(resource=>resource.resourceId===item.resourceId)).filter((resource):resource is Resource=>Boolean(resource));
    const status=plan.quality==='QUALITY_HOLD'?'QUALITY_HOLD':plan.quality==='REWORK'?'REWORK':plan.stage==='NOT_STARTED'?'NOT_STARTED':plan.stage==='COMPLETED'?'COMPLETED':'IN_PROGRESS';

    return [{
      blockId:block.entityId,name:block.name,zone:block.zone,day,stage:plan.stage,status,progress:plan.progress,qualityOverlay:plan.quality,
      recorded:{dataDate:recorded.dataDate,progressPct:recorded.progressPct,stage:recorded.stage,status:recorded.status},
      material:{readinessPct,requiredQty:requirement.requiredQty,availableQty,shortageQty:Math.max(0,requirement.requiredQty-availableQty),unit:material.unit,needByDay:requirement.needByDay,availableDay:material.availableDay,status:materialStatus},
      welding:{progressPct:weldingProgress,status:weldingProgress<=0?'NOT_STARTED':weldingProgress>=100?'COMPLETE':'IN_PROGRESS',weldCount,completedWelds,pendingWelds:weldCount-completedWelds},
      ndt:{status:ndtStatus,inspectedCount,passCount,passRate},ncr:{totalCount:openNcr+closedNcr,openCount:openNcr,closedCount:closedNcr},
      rework:{plannedManHours:quality.reworkManHours,completedManHours:completedRework},qualityGate,
      schedule:{plannedStart:6,plannedFinish:plan.plannedFinish,actualStart:null,actualFinish:null,erectionStart:plan.erectionStart,erectionFinish:plan.erectionFinish,floatDays:null,criticalPath:null,
        predecessors:data.dependencies.filter(dep=>dep.successorTaskId===erectionTask).map(dep=>dep.predecessorTaskId),successors:data.dependencies.filter(dep=>dep.predecessorTaskId===erectionTask).map(dep=>dep.successorTaskId)},
      resources:assignedResources.map(resource=>({id:resource.resourceId,name:resource.name,status:resource.status})),provenance:{definition:'ASSUMPTION',plan:'DERIVED',operations:'MOCK'},
    } satisfies BlockOperationalState];
  });
  const inspected=states.reduce((sum,state)=>sum+state.ndt.inspectedCount,0),passed=states.reduce((sum,state)=>sum+state.ndt.passCount,0);
  return {day,states,issues,summary:{overallProgress:round1(states.reduce((sum,state)=>sum+state.progress,0)/Math.max(1,states.length)),materialReadiness:round1(states.reduce((sum,state)=>sum+state.material.readinessPct,0)/Math.max(1,states.length)),ndtPassRate:inspected?round1(passed/inspected*100):null,openNcr:states.reduce((sum,state)=>sum+state.ncr.openCount,0),plannedRework:states.reduce((sum,state)=>sum+state.rework.plannedManHours,0),releasedGates:states.filter(state=>state.qualityGate==='RELEASED').length,blocksOnHold:states.filter(state=>state.qualityGate==='BLOCKED'||state.qualityGate==='REWORK').length}};
}
