import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getBlockState,
  getConstructionSnapshot,
  QUALITY_DEMO,
} from "../lib/twin/block-state.ts";
const blocks = JSON.parse(
  readFileSync(new URL("../data/blocks.json", import.meta.url)),
);
const tasks = JSON.parse(
  readFileSync(new URL("../data/tasks.json", import.meta.url)),
);
const original = JSON.stringify({ blocks, tasks });
const state = (id, step) =>
  getBlockState(
    blocks.find((b) => b.entityId === id),
    step,
    tasks,
  );

assert.equal(state("B03", 0).stage, "NOT_STARTED");
assert.equal(state("B03", 5).stage, "FABRICATION");
assert.equal(state("B03", 10).stage, "SUB_ASSEMBLY");
assert.equal(state("B03", 15).stage, "BLOCK_ASSEMBLY");
assert.equal(state("B03", 20).stage, "GRAND_ASSEMBLY");
assert.equal(state("B03", 25).stage, "STAGING");
assert.equal(state("B03", 36).stage, "ERECTION");
assert.equal(state("B03", 38).stage, "ERECTED");
assert.equal(state("B03", 45).stage, "INTEGRATION");
assert.equal(state("B03", 48).stage, "OUTFITTING");
assert.equal(state("B03", 60).stage, "COMPLETED");
assert.equal(state("B04", 25).quality, "QUALITY_HOLD");
assert.equal(state("B04", 26).quality, "REWORK");
assert.equal(state("B04", 29).quality, "NONE");
assert.equal(QUALITY_DEMO.sourceType, "ASSUMPTION");
assert.equal(state("B04", 31).position[2], 70);
assert(state("B04", 32.5).position[1] > 0);
assert.deepEqual(state("B04", 34).position, state("B04", 34).finalPosition);
assert.equal(state("B03", 15).position[2], 140);
assert.equal(state("B03", 25).position[2], 70);
for (const b of blocks) {
  let last = 0;
  for (let s = 0; s <= 60; s += 0.25) {
    const current = getBlockState(b, s, tasks);
    assert(current.progress >= last && current.progress <= 100);
    assert(current.position.every(Number.isFinite));
    assert.equal(current.delayed, false);
    last = current.progress;
  }
  assert.equal(state(b.entityId, 0).progress, 0);
  assert.equal(state(b.entityId, 60).progress, 100);
  assert.equal(state(b.entityId, 60).stage, "COMPLETED");
}
const before = state("B04", 25);
state("B04", 60);
state("B04", 0);
assert.deepEqual(state("B04", 25), before);
assert.equal(JSON.stringify({ blocks, tasks }), original);
assert.equal(getConstructionSnapshot(blocks, 0, tasks).overallProgress, 0);
assert.equal(getConstructionSnapshot(blocks, 60, tasks).overallProgress, 100);
assert.equal(state("B04", Infinity).progress, 0);
for (const step of [0, 30, 45, 60]) {
  const snapshot = getConstructionSnapshot(blocks, step, tasks);
  console.log(
    "Step",
    step,
    "progress",
    snapshot.overallProgress,
    "B04",
    snapshot.states[3].stage,
    snapshot.states[3].quality,
    "Z",
    snapshot.states[3].position[2],
  );
}
console.log(
  "PASS P14: all 9 blocks preserve IDs and production states; staging/erection, reverse scrubbing and Step 0–60 progress are deterministic.",
);
