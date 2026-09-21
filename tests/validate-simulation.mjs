import assert from 'node:assert/strict';
import {calculateSchedule} from '../lib/simulation/cpm.ts';
import {simulateScenario} from '../lib/simulation/simulate.ts';
import {createScenario,SCENARIO_PRESETS} from '../lib/simulation/scenarios.ts';
import {masterTasks,masterDependencies,masterRequirements,masterAllocations,masterProjectFinish} from '../data/master-schedule.ts';
const input={tasks:masterTasks,dependencies:masterDependencies,requirements:masterRequirements,allocations:masterAllocations};
const original=JSON.stringify(input);
const base=simulateScenario(input,null);
assert.equal(base.incrementalDelayDays,0);assert.equal(base.baselineFinishDay,masterProjectFinish);assert.equal(masterProjectFinish,1070);
for(const t of base.baseline.tasks){assert.equal(t.es,t.baselineStartDay);assert.equal(t.ef,t.baselineFinishDay);assert(t.totalFloat>=0);assert.equal(t.totalFloat,t.ls-t.es);}
const outcomes=SCENARIO_PRESETS.map(s=>simulateScenario(input,s));
assert.deepEqual(outcomes.map(r=>r.incrementalDelayDays),[3,0,2,2,0]);
assert(outcomes.every(r=>r.criticalPathChanged===false));
assert.equal(outcomes[1].targetFloatConsumed,5);assert.equal(outcomes[4].targetFloatConsumed,3);
assert.deepEqual(outcomes[2].directTaskIds,['E-B03']); // One outage, not +2 per crane task.
assert.equal(outcomes[4].blockImpacts.length,0); // WC is not a hull block.
assert.equal(simulateScenario(input,createScenario('WIND_CHALLENGER_DELAY','WC02',2)).incrementalDelayDays,0);
assert.equal(simulateScenario(input,createScenario('MATERIAL_DELAY','B07',2)).incrementalDelayDays,0);
assert.equal(simulateScenario(input,createScenario('CRANE_BREAKDOWN','RES-ERECTION-SLOT-01',2,50)).changedTaskIds.length,0);
assert.equal(simulateScenario(input,createScenario('WELDING_REWORK','B04',0)).incrementalDelayDays,0);
assert.equal(simulateScenario(input,createScenario('WIND_CHALLENGER_DELAY','WC02',2.5)).incrementalDelayDays,0);
// Independent two-branch graph: A=5, B=3, then delivery. B has exactly 2d float.
const template=input.tasks[0];const task=(id,start,duration)=>({...template,taskId:id,baselineStartDay:start,baselineFinishDay:start+duration,durationDays:duration,entityIds:[id]});
const small=[task('A',0,5),task('B',0,3),task('DEL',5,1)];
const edges=['A','B'].map(id=>({dependencyId:id,predecessorTaskId:id,successorTaskId:'DEL',type:'FS',lagDays:0}));
assert.equal(calculateSchedule(small,edges,'small').tasks.find(t=>t.taskId==='B').totalFloat,2);
assert.equal(calculateSchedule(small,edges,'inside',{durationAdds:{B:2}}).finishDay,6);
assert.equal(calculateSchedule(small,edges,'exceeds',{durationAdds:{B:3}}).finishDay,7);
assert.equal(calculateSchedule(small,edges,'critical',{durationAdds:{A:1}}).finishDay,7);
// Resource interruption, boundary half-open, and backward pass across an outage.
const outage=calculateSchedule(small,edges,'outage',{outage:{start:1,end:3,taskIds:['B']}});
assert.equal(outage.finishDay,6);assert.equal(outage.tasks.find(t=>t.taskId==='B').ef,5);assert.equal(outage.tasks.find(t=>t.taskId==='B').totalFloat,0);
const boundary=calculateSchedule(small,edges,'boundary',{outage:{start:3,end:5,taskIds:['B']}});assert.equal(boundary.tasks.find(t=>t.taskId==='B').ef,3);
assert.throws(()=>calculateSchedule(small,[...edges,{dependencyId:'cycle',predecessorTaskId:'DEL',successorTaskId:'A',type:'FS',lagDays:0}],'bad'),/Circular/);
assert.throws(()=>calculateSchedule(small,[...edges,{dependencyId:'missing',predecessorTaskId:'NONE',successorTaskId:'A',type:'FS',lagDays:0}],'bad'),/Missing dependency/);
assert.throws(()=>calculateSchedule([{...small[0],durationDays:-1},...small.slice(1)],edges,'bad'),/Invalid schedule/);
assert.throws(()=>simulateScenario(input,createScenario('WELDING_REWORK','B99',3)),/Invalid welding/);
for(const d of [-1,NaN,Infinity])assert.throws(()=>simulateScenario(input,createScenario('WELDING_REWORK','B04',d)),/Delay/);
for(const r of outcomes){
 const byId=new Map(r.scenarioSchedule.tasks.map(t=>[t.taskId,t]));
 for(const e of input.dependencies)assert(byId.get(e.successorTaskId).es>=byId.get(e.predecessorTaskId).ef+e.lagDays-1e-8);
 for(const path of r.criticalPathsAfter){assert.equal(path.at(-1),'DEL');for(const id of path)assert(byId.get(id).isCritical);for(let i=1;i<path.length;i++)assert(input.dependencies.some(e=>e.predecessorTaskId===path[i-1]&&e.successorTaskId===path[i]));}
}
assert.equal(JSON.stringify(input),original);
assert.deepEqual(simulateScenario(input,SCENARIO_PRESETS[0]),outcomes[0]);
console.table(outcomes.map(r=>({scenario:r.scenario.name,baseline:r.baselineFinishDay,delivery:r.scenarioFinishDay,impact:r.incrementalDelayDays,targetFloatConsumed:r.targetFloatConsumed,affectedTasks:r.changedTaskIds.length,affectedBlocks:r.blockImpacts.length,pathChanged:r.criticalPathChanged})));
console.log('PASS: baseline exact reproduction; float/parallel paths; critical and noncritical delays; calendar windows; graph/input errors; paths; immutability and determinism.');

const acceptance=simulateScenario(input,createScenario('WELDING_REWORK','B04',3.5));
assert.equal(acceptance.scenarioFinishDay,1073.5);assert.equal(acceptance.incrementalDelayDays,3.5);
assert.equal(acceptance.taskImpacts.length,21);assert.equal(acceptance.targetFloatConsumed,0);
assert.equal(acceptance.scenarioSchedule.tasks.find(t=>t.taskId==='E-B04').ef,678.5);
assert.equal(simulateScenario(input,null).scenarioFinishDay,1070);
console.log('P13 PASS: B04 +3.5d → D1073.5, 21 affected tasks; reset recomputes D1070 Master Schedule.');
