import type { BlockOperationalState } from './block-operations';

export type QualityChainStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PASSED' | 'ISSUE' | 'REWORK' | 'COMPLETED';
export interface QualityChainNode { title: string; status: QualityChainStatus; detail: string }

/** Presentation only: all transitions come from the existing operational snapshot. */
export function getQualityChain(block: BlockOperationalState): QualityChainNode[] {
  const { welding, ndt, ncr, rework, qualityGate } = block;
  const hasRepair = rework.plannedManHours > 0;
  const repairDone = hasRepair && rework.completedManHours >= rework.plannedManHours;
  return [
    { title: 'Welding', status: welding.status === 'COMPLETE' ? 'COMPLETED' : welding.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: `${welding.progressPct}% · ${welding.completedWelds}/${welding.weldCount} welds` },
    { title: 'NDT', status: ndt.status === 'PASS' ? 'PASSED' : ndt.status === 'HOLD' ? 'ISSUE' : ndt.status === 'REINSPECTION' ? 'REWORK' : ndt.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: ndt.status === 'REINSPECTION' ? 'Reinspection active' : `${ndt.passCount}/${ndt.inspectedCount} inspections passed` },
    { title: 'NCR', status: ncr.openCount > 0 ? 'ISSUE' : ncr.closedCount > 0 ? 'COMPLETED' : 'NOT_STARTED', detail: `${ncr.openCount} open · ${ncr.closedCount} closed` },
    { title: 'Rework', status: repairDone ? 'COMPLETED' : qualityGate === 'REWORK' ? 'REWORK' : 'NOT_STARTED', detail: `${rework.completedManHours} / ${rework.plannedManHours} MH` },
    { title: 'Reinspection', status: repairDone && ndt.status === 'PASS' ? 'PASSED' : ndt.status === 'REINSPECTION' ? 'IN_PROGRESS' : 'NOT_STARTED', detail: !hasRepair ? 'No repair planned' : repairDone ? 'Repair verified' : ndt.status === 'REINSPECTION' ? 'Verification in progress' : 'Awaiting repair' },
    { title: 'Release', status: qualityGate === 'RELEASED' ? 'COMPLETED' : qualityGate === 'BLOCKED' ? 'ISSUE' : qualityGate === 'REWORK' ? 'REWORK' : 'NOT_STARTED', detail: qualityGate.replaceAll('_', ' ') },
  ];
}
export const qualityChainLabels: Record<QualityChainStatus, string> = {
  NOT_STARTED: '— Not started', IN_PROGRESS: '● In progress', PASSED: '✓ Passed', ISSUE: '! Issue', REWORK: '↻ Rework', COMPLETED: '✓ Completed',
};
