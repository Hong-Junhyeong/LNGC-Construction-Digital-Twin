import type {CalculatedTask,Dependency,ScheduleTask,ScheduleSnapshot} from '../../types/domain';
import {buildGraph,EPS} from './graph.ts';
export interface Outage {start:number;end:number;taskIds:string[];}
export interface ScheduleChanges {durationAdds?:Record<string,number>;releaseDays?:Record<string,number>;outage?:Outage;}
const clean=(n:number)=>Math.round(n*1e8)/1e8;
function windowFor(id:string,changes:ScheduleChanges){return changes.outage?.taskIds.includes(id)?changes.outage:undefined;}
function startOutside(day:number,w?:Outage){return w&&day>=w.start&&day<w.end?w.end:day;}
function finishWork(start:number,duration:number,w?:Outage){if(!duration)return start;if(!w||start>=w.end||start+duration<=w.start)return start+duration;return start+duration+(w.end-w.start);}
function latestWork(finish:number,duration:number,w?:Outage){if(!duration)return finish;if(!w||finish<=w.start||finish-duration>=w.end)return finish-duration;const limit=finish<w.end?w.start:finish;return limit>=w.end?limit-duration-(w.end-w.start):limit-duration;}

/** FS CPM over elapsed 24x7 days. Outages remove work time only from explicitly mapped tasks. */
export function calculateSchedule(tasks:ScheduleTask[],dependencies:Dependency[],snapshotId:string,changes:ScheduleChanges={},finishId='DEL'):ScheduleSnapshot{
 const graph=buildGraph(tasks,dependencies,finishId),result=new Map<string,CalculatedTask>();
 for(const [id,value] of Object.entries(changes.durationAdds??{}))if(!graph.byId.has(id)||!Number.isFinite(value)||value<0)throw new Error(`Invalid duration change for ${id}.`);
 for(const [id,value] of Object.entries(changes.releaseDays??{}))if(!graph.byId.has(id)||!Number.isFinite(value)||value<0)throw new Error(`Invalid release constraint for ${id}.`);
 if(changes.outage&&(!Number.isFinite(changes.outage.start)||!Number.isFinite(changes.outage.end)||changes.outage.start<0||changes.outage.end<changes.outage.start||changes.outage.taskIds.some(id=>!graph.byId.has(id))))throw new Error('Invalid outage window or target task.');
 for(const id of graph.order){const task=graph.byId.get(id)!,duration=task.durationDays+(changes.durationAdds?.[id]??0),w=windowFor(id,changes);const ready=Math.max(0,changes.releaseDays?.[id]??0,...graph.incoming.get(id)!.map(e=>result.get(e.predecessorTaskId)!.ef+e.lagDays));const es=duration?startOutside(ready,w):ready,ef=finishWork(es,duration,w);result.set(id,{...task,entityIds:[...task.entityIds],objectIds:[...task.objectIds],durationDays:duration,es:clean(es),ef:clean(ef),ls:0,lf:0,totalFloat:0,isCritical:false});}
 const finishDay=result.get(finishId)!.ef;
 for(const id of [...graph.order].reverse()){const t=result.get(id)!,edges=graph.outgoing.get(id)!;const deadline=edges.length?Math.min(...edges.map(e=>result.get(e.successorTaskId)!.ls-e.lagDays)):finishDay;const ls=latestWork(deadline,t.durationDays,windowFor(id,changes));t.ls=clean(ls);t.lf=clean(finishWork(ls,t.durationDays,windowFor(id,changes)));t.totalFloat=clean(Math.max(0,ls-t.es));t.isCritical=t.totalFloat<=EPS;}
 const tight=(from:string,to:string,lag:number)=>{const a=result.get(from)!,b=result.get(to)!;return a.isCritical&&b.isCritical&&Math.abs((b.durationDays?startOutside(a.ef+lag,windowFor(to,changes)):a.ef+lag)-b.es)<=EPS;};
 const criticalPaths:string[][]=[];let pathsTruncated=false;
 function walk(id:string,path:string[]){if(criticalPaths.length>=256){pathsTruncated=true;return;}const next=[...path,id];if(id===finishId){criticalPaths.push(next);return;}for(const edge of graph.outgoing.get(id)!)if(tight(id,edge.successorTaskId,edge.lagDays))walk(edge.successorTaskId,next);}
 for(const id of graph.order)if(result.get(id)!.isCritical&&!graph.incoming.get(id)!.some(e=>tight(e.predecessorTaskId,id,e.lagDays)))walk(id,[]);
 return {snapshotId,startDay:Math.min(...Array.from(result.values(),t=>t.es)),finishDay,tasks:graph.order.map(id=>result.get(id)!),criticalPaths,pathsTruncated};
}
