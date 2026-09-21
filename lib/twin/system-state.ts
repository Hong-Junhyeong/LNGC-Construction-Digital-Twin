import type {
  CargoContainmentStage,
  CargoContainmentState,
  OutfittingStage,
  OutfittingState,
} from "../../types/domain.ts";

const clamp = (step: number) =>
  Number.isFinite(step) ? Math.max(0, Math.min(60, step)) : 0;
const between = (
  step: number,
  start: number,
  end: number,
  from: number,
  to: number,
) =>
  from + (to - from) * Math.max(0, Math.min(1, (step - start) / (end - start)));

/** Normalized educational display state. Master Schedule dates remain authoritative for CPM. */
export function getCargoContainmentState(
  entityId: string,
  step: number,
): CargoContainmentState {
  const s = clamp(step);
  let stage: CargoContainmentStage = "NOT_STARTED",
    progress = 0;
  if (s >= 38) {
    stage = "HOLD_CONSTRUCTION";
    progress = between(s, 38, 40, 0, 20);
  }
  if (s >= 40) {
    stage = "INSULATION";
    progress = between(s, 40, 43, 20, 40);
  }
  if (s >= 43) {
    stage = "MEMBRANE_INSTALLATION";
    progress = between(s, 43, 52, 40, 82);
  }
  if (s >= 52) {
    stage = "INSPECTION";
    progress = between(s, 52, 55, 82, 98);
  }
  if (s >= 55) {
    stage = "COMPLETED";
    progress = 100;
  }
  return {
    entityId,
    stage,
    progress: Math.round(progress * 10) / 10,
    playbackStep: s,
    classification: "ASSUMPTION",
  };
}

/** Lightweight outfitting categories appear progressively without adding a second timeline state. */
export function getOutfittingState(step: number): OutfittingState {
  const s = clamp(step);
  let stage: OutfittingStage = "NOT_STARTED",
    progress = 0;
  if (s >= 45) {
    stage = "PIPING";
    progress = between(s, 45, 48, 0, 30);
  }
  if (s >= 48) {
    stage = "EQUIPMENT";
    progress = between(s, 48, 50, 30, 50);
  }
  if (s >= 50) {
    stage = "ELECTRICAL";
    progress = between(s, 50, 52, 50, 70);
  }
  if (s >= 52) {
    stage = "DECK_OUTFITTING";
    progress = between(s, 52, 54, 70, 85);
  }
  if (s >= 54) {
    stage = "SAFETY_SYSTEM";
    progress = between(s, 54, 56, 85, 100);
  }
  if (s >= 56) {
    stage = "COMPLETED";
    progress = 100;
  }
  return {
    entityId: "OUTFIT",
    stage,
    progress: Math.round(progress * 10) / 10,
    playbackStep: s,
    classification: "ASSUMPTION",
  };
}

export function getVisualOverallProgress(
  blockProgress: number,
  cargoStates: CargoContainmentState[],
  outfitting: OutfittingState,
) {
  const cargo = cargoStates.length
    ? cargoStates.reduce((sum, state) => sum + state.progress, 0) /
      cargoStates.length
    : 0;
  return (
    Math.round(
      (blockProgress * 0.65 + cargo * 0.2 + outfitting.progress * 0.15) * 10,
    ) / 10
  );
}
