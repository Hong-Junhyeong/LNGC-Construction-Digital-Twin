import type { Resource } from "../../types/domain";
import type { BlockOperationalState } from "./block-operations";

export interface PlaybackResourceState {
  resourceId: string;
  activeUnits: number;
  activityLabel: string;
  demandPct: number;
  status: "STANDBY" | "ACTIVE" | "CONSTRAINED" | "COMPLETE";
  detail: string;
}

export interface PlaybackResourceSummary {
  activeWorkFronts: number;
  demandPct: number;
  activeCrews: number;
}

const clampStep = (step: number) => Math.max(0, Math.min(60, step));

/** Display-only workload derived from the shared normalized playback state. */
export function getPlaybackResourceSnapshot(
  step: number,
  resources: Resource[],
  blocks: BlockOperationalState[],
) {
  const s = clampStep(step);
  const inFlight = blocks.filter(
    (block) => block.status !== "NOT_STARTED" && block.status !== "COMPLETED",
  ).length;
  const activeWorkFronts = s === 0 || s >= 60
    ? 0
    : Math.min(inFlight, Math.ceil(s / 7));
  const demandPct = Math.round((activeWorkFronts / Math.max(1, blocks.length)) * 100);
  const repairFronts = blocks.filter((block) => block.status === "REWORK").length;
  const inspectionFronts = blocks.filter((block) =>
    ["IN_PROGRESS", "HOLD", "REINSPECTION"].includes(block.ndt.status),
  ).length;

  const states: PlaybackResourceState[] = resources.map((resource) => {
    let activeUnits = 0;
    let resourceDemand = 0;
    let activityLabel = `0 / ${resource.capacity} ${resource.capacityUnit}`;
    let detail = `No active demand at playback S${s}.`;

    if (resource.type === "ERECTION_SLOT") {
      activeUnits = activeWorkFronts > 0 ? Math.min(resource.capacity, 1) : 0;
      resourceDemand = demandPct;
      activityLabel = `${activeWorkFronts} / ${blocks.length} fronts`;
      detail = activeWorkFronts
        ? `${activeWorkFronts} parallel block fronts contribute to current construction demand.`
        : s >= 60 ? "Block construction fronts are complete." : "Block fronts have not been released.";
    } else if (resource.type === "WC_INSTALL_SLOT") {
      activeUnits = s >= 52 && s < 60 ? Math.min(resource.capacity, 1) : 0;
      resourceDemand = activeUnits ? 100 : 0;
      activityLabel = `${activeUnits} / ${resource.capacity} ${resource.capacityUnit}`;
      detail = activeUnits
        ? "Wind Challenger installation demand is active in the late playback phase."
        : s >= 60 ? "Wind Challenger installation is complete." : "WAPS slot is reserved for the late installation phase.";
    } else if (resource.type === "WELDING_TEAM") {
      activeUnits = repairFronts > 0 ? Math.min(resource.capacity, repairFronts) : 0;
      resourceDemand = activeUnits ? 100 : 0;
      activityLabel = `${activeUnits} / ${resource.capacity} ${resource.capacityUnit}`;
      detail = repairFronts
        ? `${repairFronts} rework front requires repair-team capacity.`
        : s >= 60 ? "Repair work is complete." : "No active rework demand at this step.";
    } else if (resource.type === "INSPECTION_TEAM") {
      activeUnits = inspectionFronts > 0 ? Math.min(resource.capacity, inspectionFronts) : 0;
      resourceDemand = activeUnits ? 100 : 0;
      activityLabel = `${activeUnits} / ${resource.capacity} ${resource.capacityUnit}`;
      detail = inspectionFronts
        ? `${inspectionFronts} quality front requires inspection attention.`
        : s >= 60 ? "Playback inspection work is complete." : "No active inspection hold or review.";
    }

    return {
      resourceId: resource.resourceId,
      activeUnits,
      activityLabel,
      demandPct: resourceDemand,
      status: s >= 60 ? "COMPLETE" : resourceDemand >= 100 && activeUnits >= resource.capacity ? "CONSTRAINED" : activeUnits > 0 ? "ACTIVE" : "STANDBY",
      detail,
    };
  });

  const activeCrews = states.filter((state) => state.activeUnits > 0).length;
  return { states, summary: { activeWorkFronts, demandPct, activeCrews } satisfies PlaybackResourceSummary };
}
