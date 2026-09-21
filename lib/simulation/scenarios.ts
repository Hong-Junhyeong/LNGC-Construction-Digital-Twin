import type {ScenarioType,WhatIfScenario} from '../../types/domain';
export const SCENARIO_LABELS:Record<ScenarioType,string>={WELDING_REWORK:'Welding rework',MATERIAL_DELAY:'Material delay',CRANE_BREAKDOWN:'Crane breakdown',WEATHER_SHUTDOWN:'Weather shutdown',WIND_CHALLENGER_DELAY:'Wind Challenger installation delay'};
export function createScenario(type:ScenarioType,target:string,delayDays:number,startDay=690):WhatIfScenario{
 const taskId=type==='WELDING_REWORK'?`E-${target}`:type==='MATERIAL_DELAY'?'OUTFIT':type==='WIND_CHALLENGER_DELAY'?'WC_LIFT':'';
 return {scenarioId:`SCN-${type}-${target}-${delayDays}-${startDay}`,name:`${target} ${SCENARIO_LABELS[type]} +${delayDays}d`,type,baselineId:'MASTER-P13',targetEntityId:target,targetTaskId:taskId,delayDays,...(type==='CRANE_BREAKDOWN'||type==='WEATHER_SHUTDOWN'?{startDay}:{}),description:'Educational master-schedule counterfactual; 3D playback steps are display-only.',status:'VALIDATED',dataMeta:{sourceType:'ASSUMPTION',availability:'AVAILABLE',sourceIds:['P13-MASTER-SCHEDULE','P09-SCENARIO-RULES'],asOf:'2026-09-21'}};
}
export const SCENARIO_PRESETS=[createScenario('WELDING_REWORK','B04',3),createScenario('MATERIAL_DELAY','B07',5),createScenario('CRANE_BREAKDOWN','RES-ERECTION-SLOT-01',2,690),createScenario('WEATHER_SHUTDOWN','OUTDOOR',2,690),createScenario('WIND_CHALLENGER_DELAY','WC02',3)];
