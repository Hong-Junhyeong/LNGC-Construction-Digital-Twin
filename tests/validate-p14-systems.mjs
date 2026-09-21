import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  getCargoContainmentState,
  getOutfittingState,
  getVisualOverallProgress,
} from "../lib/twin/system-state.ts";
import { masterTasks } from "../data/master-schedule.ts";

const tanks = JSON.parse(
  readFileSync(new URL("../data/cargo-tanks.json", import.meta.url)),
);
const wind = JSON.parse(
  readFileSync(new URL("../data/wind-challengers.json", import.meta.url)),
);
assert.deepEqual(
  tanks.map((t) => t.entityId),
  ["T01", "T02", "T03", "T04"],
);
assert.equal(new Set(tanks.map((t) => t.entityId)).size, 4);
assert.deepEqual(
  wind.map((w) => w.entityId),
  ["WC01", "WC02"],
);
assert(masterTasks.some((t) => t.taskId === "CARGO_HOLD"));
assert(masterTasks.some((t) => t.taskId === "CCS"));
assert(masterTasks.some((t) => t.taskId === "OUTFIT"));

const cargo = (step) => getCargoContainmentState("T01", step);
assert.equal(cargo(0).stage, "NOT_STARTED");
assert.equal(cargo(38).stage, "HOLD_CONSTRUCTION");
assert.equal(cargo(40).stage, "INSULATION");
assert.equal(cargo(43).stage, "MEMBRANE_INSTALLATION");
assert.equal(cargo(52).stage, "INSPECTION");
assert.equal(cargo(55).stage, "COMPLETED");
assert.equal(cargo(60).progress, 100);
assert.equal(getOutfittingState(0).stage, "NOT_STARTED");
assert.equal(getOutfittingState(45).stage, "PIPING");
assert.equal(getOutfittingState(48).stage, "EQUIPMENT");
assert.equal(getOutfittingState(50).stage, "ELECTRICAL");
assert.equal(getOutfittingState(52).stage, "DECK_OUTFITTING");
assert.equal(getOutfittingState(54).stage, "SAFETY_SYSTEM");
assert.equal(getOutfittingState(56).stage, "COMPLETED");
assert.equal(
  getVisualOverallProgress(
    0,
    tanks.map((t) => getCargoContainmentState(t.entityId, 0)),
    getOutfittingState(0),
  ),
  0,
);
assert.equal(
  getVisualOverallProgress(
    100,
    tanks.map((t) => getCargoContainmentState(t.entityId, 60)),
    getOutfittingState(60),
  ),
  100,
);
for (const step of [0, 30, 45, 60]) {
  const cargoStates = tanks.map((t) =>
    getCargoContainmentState(t.entityId, step),
  );
  const overall = getVisualOverallProgress(
    (step / 60) * 100,
    cargoStates,
    getOutfittingState(step),
  );
  assert(overall >= 0 && overall <= 100);
  console.log(
    "Step",
    step,
    "overall",
    overall,
    "cargo",
    cargoStates[0].stage,
    "outfit",
    getOutfittingState(step).stage,
  );
}
assert.deepEqual(cargo(43), getCargoContainmentState("T01", 43));
console.log(
  "PASS P14: T01–T04, Cargo layers, lightweight Outfitting and shared progress mapping preserve the P13 schedule entities.",
);
