import type { BlockOperationalState } from './block-operations';
import type { ScenarioQualityOverlay } from './scenario-quality-overlay';

export type QualityChainStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'ISSUE' | 'REWORK' | 'COMPLETED';
export interface QualityChainNode { title: string; status: QualityChainStatus; detail: string }

/** Presentation only: all transitions come from the existing operational snapshot. */
export function getQualityChain(block: BlockOperationalState, overlay: ScenarioQualityOverlay | null = null): QualityChainNode[] {
  const { welding, ndt, ncr, rework, qualityGate } = block;
  const hasRepair = rework.plannedManHours > 0;
  const repairDone = hasRepair && rework.completedManHours >= rework.plannedManHours;
  const baseline: QualityChainNode[] = [
    { title: 'Welding', status: welding.status === 'COMPLETE' ? 'COMPLETED' : welding.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: `${welding.progressPct}% · ${welding.completedWelds}/${welding.weldCount} welds` },
    { title: 'NDT', status: ndt.status === 'PASS' ? 'PASSED' : ndt.status === 'HOLD' ? 'ISSUE' : ndt.status === 'REINSPECTION' ? 'REWORK' : ndt.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: ndt.status === 'REINSPECTION' ? 'Reinspection active' : `${ndt.passCount}/${ndt.inspectedCount} inspections passed` },
    { title: 'NCR', status: ncr.openCount > 0 ? 'ISSUE' : ncr.closedCount > 0 ? 'COMPLETED' : 'NOT_STARTED', detail: `${ncr.openCount} open · ${ncr.closedCount} closed` },
    { title: 'Rework', status: repairDone ? 'COMPLETED' : qualityGate === 'REWORK' ? 'REWORK' : 'NOT_STARTED', detail: `${rework.completedManHours} / ${rework.plannedManHours} MH` },
    { title: 'Reinspection', status: repairDone && ndt.status === 'PASS' ? 'PASSED' : ndt.status === 'REINSPECTION' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: !hasRepair ? 'No repair planned' : repairDone ? 'Repair verified' : ndt.status === 'REINSPECTION' ? 'Verification in progress' : 'Awaiting repair' },
    { title: 'Release', status: qualityGate === 'RELEASED' ? 'COMPLETED' : qualityGate === 'BLOCKED' ? 'ISSUE' : qualityGate === 'REWORK' ? 'REWORK' : 'NOT_STARTED', detail: qualityGate.replaceAll('_', ' ') },
  ];
  if (!overlay || overlay.blockId !== block.blockId) return baseline;
  return [
    { ...baseline[0], detail: `${baseline[0].detail} · scenario disruption active` },
    { title: 'NDT', status: 'ISSUE', detail: 'Scenario verification issue · baseline result retained' },
    { title: 'NCR', status: 'ISSUE', detail: `1 scenario NCR open · ${ncr.openCount - 1} baseline open` },
    { title: 'Rework', status: 'REWORK', detail: `Scenario rework required · +${overlay.delayDays}d schedule allowance` },
    { title: 'Reinspection', status: 'NOT_STARTED', detail: 'Pending · awaiting scenario rework verification' },
    { title: 'Release', status: 'ISSUE', detail: 'Scenario hold · blocked from release' },
  ];
}
export const qualityChainLabels: Record<QualityChainStatus, string> = {
  NOT_STARTED: '— Not started', IN_PROGRESS: '● In progress', PASSED: '✓ Passed', ISSUE: '! Issue', REWORK: '↻ Rework', COMPLETED: '✓ Completed',
};
