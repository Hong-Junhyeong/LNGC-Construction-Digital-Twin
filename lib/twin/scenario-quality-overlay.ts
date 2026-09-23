import type { WhatIfResult } from "../../types/domain";
import type { BlockOperationalState } from "./block-operations";

export interface ScenarioQualityOverlay {
  blockId: string;
  triggerPlaybackStep: number;
  delayDays: number;
  classification: "ASSUMPTION";
}

export interface BaselineQualitySummary {
  overallProgress: number;
  materialReadiness: number;
  ndtPassRate: number | null;
  openNcr: number;
  plannedRework: number;
  releasedGates: number;
  blocksOnHold: number;
}

/**
 * Produces a presentation-only quality view for an active welding scenario.
 * Baseline operational records and the schedule simulation result are never mutated.
 */
export function getScenarioQualityView(
  result: WhatIfResult | null,
  playbackStep: number,
  baselineStates: BlockOperationalState[],
  baselineSummary: BaselineQualitySummary,
) {
  const scenario = result?.scenario;
  const triggerPlaybackStep = result?.triggerPlaybackStep;
  const target = scenario
    ? baselineStates.find((block) => block.blockId === scenario.targetEntityId)
    : undefined;

  if (
    !scenario ||
    scenario.type !== "WELDING_REWORK" ||
    triggerPlaybackStep === undefined ||
    playbackStep < triggerPlaybackStep ||
    !target
  ) {
    return {
      states: baselineStates,
      summary: baselineSummary,
      overlay: null,
    };
  }

  const overlay: ScenarioQualityOverlay = {
    blockId: target.blockId,
    triggerPlaybackStep,
    delayDays: scenario.delayDays,
    classification: "ASSUMPTION",
  };
  const targetAlreadyHeld = target.qualityGate === "BLOCKED" || target.qualityGate === "REWORK";
  const targetWasReleased = target.qualityGate === "RELEASED";
  const derivedTarget: BlockOperationalState = {
    ...target,
    status: "REWORK",
    ndt: { ...target.ndt, status: "HOLD" },
    ncr: {
      ...target.ncr,
      totalCount: target.ncr.totalCount + 1,
      openCount: target.ncr.openCount + 1,
    },
    qualityGate: "BLOCKED",
  };

  return {
    states: baselineStates.map((block) =>
      block.blockId === target.blockId ? derivedTarget : block,
    ),
    summary: {
      ...baselineSummary,
      openNcr: baselineSummary.openNcr + 1,
      releasedGates: baselineSummary.releasedGates - (targetWasReleased ? 1 : 0),
      blocksOnHold: baselineSummary.blocksOnHold + (targetAlreadyHeld ? 0 : 1),
    },
    overlay,
  };
}
