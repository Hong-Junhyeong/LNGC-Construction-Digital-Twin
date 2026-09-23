import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getConstructionSnapshot } from "../lib/twin/block-state.ts";
import { getOperationalSnapshot } from "../lib/twin/block-operations.ts";
import { getScenarioQualityView } from "../lib/twin/scenario-quality-overlay.ts";
import { getQualityChain } from "../lib/twin/quality-chain.ts";
import { createScenario } from "../lib/simulation/scenarios.ts";
import { simulateScenario } from "../lib/simulation/simulate.ts";
import { masterTasks, masterDependencies, masterRequirements, masterAllocations } from "../data/master-schedule.ts";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}.json`, import.meta.url)));
const data = {
  blocks: read("blocks"), production: read("production"), materials: read("materials"),
  requirements: read("material-requirements"), quality: read("quality"), tasks: read("tasks"),
  dependencies: read("dependencies"), resources: read("resources"), allocations: read("allocations"),
};
const simulationInput = {
  tasks: masterTasks,
  dependencies: masterDependencies,
  requirements: masterRequirements,
  allocations: masterAllocations,
};
const baselineAt = (step) => getOperationalSnapshot(
  step,
  getConstructionSnapshot(data.blocks, step, data.tasks).states,
  data,
);
const resultFor = (blockId, delayDays, triggerPlaybackStep) => ({
  ...simulateScenario(simulationInput, createScenario("WELDING_REWORK", blockId, delayDays, 690)),
  triggerPlaybackStep,
});

for (const step of [20, 25, 30, 60]) {
  const baseline = baselineAt(step);
  const original = JSON.stringify(baseline);
  const view = getScenarioQualityView(null, step, baseline.states, baseline.summary);
  assert.equal(view.overlay, null);
  assert.deepEqual(view.states, baseline.states);
  assert.deepEqual(view.summary, baseline.summary);
  assert.equal(JSON.stringify(baseline), original);
}

const b03Result = resultFor("B03", 5, 25);
const b03Before = baselineAt(24);
const beforeView = getScenarioQualityView(b03Result, 24, b03Before.states, b03Before.summary);
assert.equal(beforeView.overlay, null);
assert.deepEqual(beforeView.states, b03Before.states);

for (const step of [25, 30]) {
  const baseline = baselineAt(step);
  const original = JSON.stringify(baseline);
  const view = getScenarioQualityView(b03Result, step, baseline.states, baseline.summary);
  const baseTarget = baseline.states.find((block) => block.blockId === "B03");
  const target = view.states.find((block) => block.blockId === "B03");
  const chain = getQualityChain(target, view.overlay);
  assert.equal(view.overlay.blockId, "B03");
  assert.equal(view.overlay.triggerPlaybackStep, 25);
  assert.equal(target.ncr.openCount, baseTarget.ncr.openCount + 1);
  assert.equal(target.rework.completedManHours, baseTarget.rework.completedManHours);
  assert.equal(target.rework.plannedManHours, baseTarget.rework.plannedManHours);
  assert.equal(target.qualityGate, "BLOCKED");
  assert.equal(view.summary.openNcr, baseline.summary.openNcr + 1);
  assert.equal(view.summary.releasedGates, baseline.summary.releasedGates - 1);
  assert.equal(view.summary.blocksOnHold, baseline.summary.blocksOnHold + 1);
  assert.deepEqual(chain.slice(1).map((node) => node.status), ["ISSUE", "ISSUE", "REWORK", "NOT_STARTED", "ISSUE"]);
  assert.match(chain[3].detail, /\+5d schedule allowance/);
  assert.equal(JSON.stringify(baseline), original);
}

const resetBaseline = baselineAt(30);
const resetView = getScenarioQualityView(null, 30, resetBaseline.states, resetBaseline.summary);
assert.deepEqual(resetView.states, resetBaseline.states);
assert.deepEqual(resetView.summary, resetBaseline.summary);

const b07Baseline = baselineAt(25);
const b07View = getScenarioQualityView(resultFor("B07", 3, 25), 25, b07Baseline.states, b07Baseline.summary);
assert.equal(b07View.overlay.blockId, "B07");
assert.match(getQualityChain(b07View.states.find((block) => block.blockId === "B07"), b07View.overlay)[3].detail, /\+3d/);

const b04Baseline = baselineAt(25);
const b04 = b04Baseline.states.find((block) => block.blockId === "B04");
assert.deepEqual(getQualityChain(b04), getQualityChain(b04, null));
assert.equal(b04.qualityGate, "BLOCKED");
assert.equal(b04.ncr.openCount, 1);

console.table([
  { case: "B03 S24", overlay: false, gate: b03Before.states.find((b) => b.blockId === "B03").qualityGate },
  { case: "B03 S25", overlay: true, gate: "BLOCKED", scenarioNcr: 1, rework: "REQUIRED" },
  { case: "B03 S30", overlay: true, gate: "BLOCKED", scenarioNcr: 1, rework: "REQUIRED" },
  { case: "B07 S25", overlay: true, gate: "BLOCKED", scenarioNcr: 1, rework: "REQUIRED" },
  { case: "RESET S30", overlay: false, gate: resetBaseline.states.find((b) => b.blockId === "B03").qualityGate },
]);
console.log("PASS P19: trigger-step quality overlay, KPI deltas, generic targets, reset, and unchanged B04 baseline.");
