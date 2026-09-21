import type {Dependency,ScheduleTask} from '../../types/domain';
export const EPS=1e-8;
export function buildGraph(tasks:ScheduleTask[],dependencies:Dependency[],finishId:string){
 const byId=new Map(tasks.map(t=>[t.taskId,t]));
 if(!tasks.length||byId.size!==tasks.length)throw new Error('Invalid schedule: task IDs must be unique and the schedule cannot be empty.');
 for(const t of tasks){if(!t.taskId||![t.durationDays,t.baselineStartDay,t.baselineFinishDay].every(Number.isFinite)||t.durationDays<0||t.baselineStartDay<0||Math.abs(t.baselineFinishDay-t.baselineStartDay-t.durationDays)>EPS)throw new Error(`Invalid schedule for ${t.taskId}: check duration and start/finish days.`);if(t.calendarId!=='CAL-24X7')throw new Error(`Unsupported calendar on ${t.taskId}. This engine supports CAL-24X7 only.`);}
 if(!byId.has(finishId))throw new Error(`Missing delivery task: ${finishId}.`);
 const incoming=new Map(tasks.map(t=>[t.taskId,[] as Dependency[]])),outgoing=new Map(tasks.map(t=>[t.taskId,[] as Dependency[]]));
 const pairs=new Set<string>();
 for(const d of dependencies){if(!byId.has(d.predecessorTaskId)||!byId.has(d.successorTaskId))throw new Error(`Missing dependency task: ${d.predecessorTaskId} → ${d.successorTaskId}.`);if(d.type!=='FS'||!Number.isFinite(d.lagDays)||d.lagDays<0)throw new Error('Invalid dependency: use FS with a non-negative finite lag.');const pair=d.predecessorTaskId+'>'+d.successorTaskId;if(pairs.has(pair))throw new Error(`Duplicate dependency: ${pair}.`);pairs.add(pair);incoming.get(d.successorTaskId)!.push(d);outgoing.get(d.predecessorTaskId)!.push(d);}
 const counts=new Map(tasks.map(t=>[t.taskId,incoming.get(t.taskId)!.length]));const queue=tasks.filter(t=>!counts.get(t.taskId)).map(t=>t.taskId),order:string[]=[];
 for(let i=0;i<queue.length;i++){const id=queue[i];order.push(id);for(const edge of outgoing.get(id)!){const count=counts.get(edge.successorTaskId)!-1;counts.set(edge.successorTaskId,count);if(!count)queue.push(edge.successorTaskId);}}
 if(order.length!==tasks.length)throw new Error('Circular dependency detected. Remove the cycle before running the simulation.');
 const ancestors=new Set([finishId]);for(const id of [...order].reverse())if(ancestors.has(id))for(const e of incoming.get(id)!)ancestors.add(e.predecessorTaskId);
 if(ancestors.size!==tasks.length||outgoing.get(finishId)!.length)throw new Error('Invalid schedule: every task must lead to the terminal delivery task.');
 return {byId,incoming,outgoing,order};
}
