import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=n=>JSON.parse(readFileSync(new URL('../data/'+n+'.json',import.meta.url)));
const blocks=read('blocks'),tasks=read('tasks'),edges=read('dependencies'),objects=read('physical-objects');
const taskIds=new Set(tasks.map(t=>t.taskId)),entityIds=new Set([...blocks,...read('cargo-tanks'),...read('wind-challengers'),read('vessel')].map(e=>e.entityId));
assert.equal(blocks.length,9);assert.equal(new Set(blocks.map(b=>b.entityId)).size,9);assert.equal(taskIds.size,tasks.length);
assert.equal(new Set(objects.map(o=>o.objectId)).size,objects.length);
for(const t of tasks){assert.equal(t.baselineFinishDay-t.baselineStartDay,t.durationDays,t.taskId);for(const e of t.entityIds)assert(entityIds.has(e));for(const o of t.objectIds)assert(objects.some(x=>x.objectId===o));}
const incoming=new Map(tasks.map(t=>[t.taskId,0]));
for(const e of edges){assert(taskIds.has(e.predecessorTaskId),e.predecessorTaskId);assert(taskIds.has(e.successorTaskId),e.successorTaskId);assert.equal(e.type,'FS');assert.equal(e.lagDays,0);assert.notEqual(e.predecessorTaskId,e.successorTaskId);incoming.set(e.successorTaskId,incoming.get(e.successorTaskId)+1);const p=tasks.find(t=>t.taskId===e.predecessorTaskId),s=tasks.find(t=>t.taskId===e.successorTaskId);assert(p.baselineFinishDay<=s.baselineStartDay,`${p.taskId} -> ${s.taskId} baseline violates FS`);}
const queue=[...incoming].filter(([,n])=>n===0).map(([id])=>id);let visited=0;while(queue.length){const id=queue.shift();visited++;for(const e of edges.filter(e=>e.predecessorTaskId===id)){const n=incoming.get(e.successorTaskId)-1;incoming.set(e.successorTaskId,n);if(n===0)queue.push(e.successorTaskId);}}
assert.equal(visited,tasks.length,'Dependency graph must be acyclic');
const b04=tasks.find(t=>t.taskId==='E-B04');assert.deepEqual([b04.baselineStartDay,b04.baselineFinishDay],[22,24]);assert.equal(tasks.find(t=>t.taskId==='DEL').baselineFinishDay,60);
for(const p of read('production')){assert(entityIds.has(p.entityId));assert(taskIds.has(p.taskId));assert(p.progressPct>=0&&p.progressPct<=100);assert.equal(p.dataMeta.sourceType,'MOCK');}
for(const q of read('quality')){assert(objects.some(o=>o.objectId===q.objectId));assert(taskIds.has(q.taskId));assert(q.passCount<=q.inspectedCount);}
for(const r of read('material-requirements')){assert(taskIds.has(r.taskId));assert(entityIds.has(r.entityId));assert(read('materials').some(m=>m.materialLotId===r.materialLotId));}
for(const a of read('allocations')){assert(taskIds.has(a.taskId));assert(read('resources').some(r=>r.resourceId===a.resourceId));}
for(const w of read('wind-challengers')){assert.equal(w.actuationType.value,null);assert.equal(w.actuationType.dataMeta.availability,'UNKNOWN');for(const t of w.installationTaskIds)assert(taskIds.has(t));}
console.log(`PASS: ${blocks.length} blocks, ${tasks.length} tasks, ${edges.length} FS dependencies; identity, references, DAG, P02 dates and mock provenance verified.`);
