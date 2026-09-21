import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getConstructionSnapshot} from '../lib/twin/block-state.ts';
import {getOperationalSnapshot} from '../lib/twin/block-operations.ts';

const read=name=>JSON.parse(readFileSync(new URL(`../data/${name}.json`,import.meta.url)));
const data={blocks:read('blocks'),production:read('production'),materials:read('materials'),requirements:read('material-requirements'),quality:read('quality'),tasks:read('tasks'),dependencies:read('dependencies'),resources:read('resources'),allocations:read('allocations')};
const snapshot=day=>getOperationalSnapshot(day,getConstructionSnapshot(data.blocks,day,data.tasks).states,data);

for(const day of [0,25,26,29,40,60]){
  const result=snapshot(day);
  assert.equal(result.states.length,9);
  assert.equal(new Set(result.states.map(block=>block.blockId)).size,9);
  for(const block of result.states){
    assert(block.progress>=0&&block.progress<=100);
    assert(block.material.readinessPct>=0&&block.material.readinessPct<=100);
    assert.equal(block.material.requiredQty,100);
    assert.equal(block.provenance.operations,'MOCK');
    assert.equal(block.schedule.floatDays,null);
    assert.equal(block.schedule.criticalPath,null);
  }
}

const d25=snapshot(25),b04d25=d25.states.find(block=>block.blockId==='B04'),b07d25=d25.states.find(block=>block.blockId==='B07');
assert.equal(b04d25.status,'QUALITY_HOLD');
assert.equal(b04d25.qualityGate,'BLOCKED');
assert.equal(b04d25.ndt.status,'HOLD');
assert.equal(b04d25.ncr.openCount,1);
assert.equal(b04d25.rework.plannedManHours,48);
assert.equal(b04d25.recorded.progressPct,85);
assert.equal(b07d25.material.readinessPct,80);
assert.equal(b07d25.material.shortageQty,20);

const b04d26=snapshot(26).states.find(block=>block.blockId==='B04');
assert.equal(b04d26.status,'REWORK');
assert.equal(b04d26.ndt.status,'REINSPECTION');
const d40=snapshot(40),b04d40=d40.states.find(block=>block.blockId==='B04');
assert.equal(b04d40.qualityGate,'RELEASED');
assert.equal(b04d40.ndt.status,'PASS');
assert.equal(b04d40.ncr.openCount,0);
assert.equal(b04d40.ncr.closedCount,1);
assert.equal(b04d40.rework.completedManHours,48);
assert.equal(d40.summary.openNcr,0);

console.log('Day 25:',b04d25.blockId,b04d25.status,b04d25.progress+'%',b04d25.qualityGate,'NCR',b04d25.ncr.openCount,'Rework plan',b04d25.rework.plannedManHours+'MH');
console.log('Day 40:',b04d40.blockId,b04d40.status,b04d40.progress+'%',b04d40.qualityGate,'NCR closed',b04d40.ncr.closedCount,'Rework done',b04d40.rework.completedManHours+'MH');
console.log('PASS: 9 block contracts, Day 25/40 state transitions, material shortage and provenance.');

for(const key of ['production','quality','materials','requirements']){
 const partial={...data,[key]:[]};
 const missing=getOperationalSnapshot(25,getConstructionSnapshot(data.blocks,25,data.tasks).states,partial);
 assert.equal(missing.states.length,0);assert.equal(missing.issues.length,9);
 assert(Number.isFinite(missing.summary.overallProgress));
}
const preHold=snapshot(22).states.find(b=>b.blockId==='B04');
assert.equal(preHold.ndt.status,'PASS');assert.equal(preHold.qualityGate,'RELEASED');
console.log('PASS: missing operational records are reported without fabricated values or crashes; pre-hold NDT and gate agree.');
