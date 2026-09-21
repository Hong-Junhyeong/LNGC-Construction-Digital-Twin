export type DataSourceType = "VERIFIED" | "DERIVED" | "ASSUMPTION" | "MOCK";
export interface DataMeta {
  sourceType: DataSourceType | null;
  availability: "AVAILABLE" | "UNKNOWN" | "NOT_APPLICABLE";
  sourceIds: string[];
  asOf: string | null;
  derivationRuleId?: string;
}
export interface EvidenceValue<T> {
  value: T | null;
  dataMeta: DataMeta;
}
export type ProductionStage =
  | "NOT_STARTED"
  | "FABRICATION"
  | "SUB_ASSEMBLY"
  | "BLOCK_ASSEMBLY"
  | "GRAND_ASSEMBLY"
  | "INSPECTION"
  | "STAGING"
  | "ERECTION"
  | "ERECTED"
  | "INTEGRATION"
  | "OUTFITTING"
  | "COMPLETED";
export interface Vessel {
  entityId: string;
  referenceName: string;
  cargoCapacityM3: EvidenceValue<number>;
  loaM: EvidenceValue<number>;
  breadthM: EvidenceValue<number>;
  containmentType: EvidenceValue<string>;
  windChallengerIds: string[];
  blockIds: string[];
  tankIds: string[];
}
export interface Block {
  entityId: string;
  vesselId: string;
  name: string;
  zone: string;
  objectIds: string[];
  relatedTankIds: string[];
  uStart: number;
  uEnd: number;
  dataMeta: DataMeta;
}
export interface PhysicalObject {
  objectId: string;
  entityId: string;
  parentObjectId: string | null;
  objectType: "BLOCK_COMPONENT" | "TANK" | "WC_COMPONENT";
  geometryRef: string | null;
}
export interface CargoTank {
  entityId: string;
  vesselId: string;
  relatedBlockIds: string[];
  tankKind: string;
  actualCapacityM3: EvidenceValue<number>;
  dataMeta: DataMeta;
}
export type CargoContainmentStage =
  | "NOT_STARTED"
  | "HOLD_CONSTRUCTION"
  | "INSULATION"
  | "MEMBRANE_INSTALLATION"
  | "INSPECTION"
  | "COMPLETED";
export interface CargoContainmentState {
  entityId: string;
  stage: CargoContainmentStage;
  progress: number;
  playbackStep: number;
  classification: "ASSUMPTION";
}
export type OutfittingStage =
  | "NOT_STARTED"
  | "PIPING"
  | "EQUIPMENT"
  | "ELECTRICAL"
  | "DECK_OUTFITTING"
  | "SAFETY_SYSTEM"
  | "COMPLETED";
export interface OutfittingState {
  entityId: "OUTFIT";
  stage: OutfittingStage;
  progress: number;
  playbackStep: number;
  classification: "ASSUMPTION";
}
export interface WindChallenger {
  entityId: string;
  vesselId: string;
  hostBlockId: string;
  subsystemIds: string[];
  installationTaskIds: string[];
  actuationType: EvidenceValue<string>;
  hydraulicSystemId: string | null;
  dataMeta: DataMeta;
}
export interface Production {
  productionRecordId: string;
  entityId: string;
  taskId: string;
  stage: ProductionStage;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "HOLD";
  progressPct: number;
  progressBasis: "MOCK";
  dataDate: number;
  dataMeta: DataMeta;
}
export interface ScheduleTask {
  taskId: string;
  name: string;
  entityIds: string[];
  objectIds: string[];
  stage: string;
  baselineStartDay: number;
  baselineFinishDay: number;
  durationDays: number;
  calendarId: string;
  dataMeta: DataMeta;
}
export interface MasterScheduleTask extends ScheduleTask {
  phase: string;
  plannedStartDate: string;
  plannedFinishDate: string;
  predecessorIds: string[];
  successorIds: string[];
  classification: DataSourceType;
  visibleIn3D: boolean;
  playbackStartStep: number | null;
  playbackEndStep: number | null;
  ganttGroup:
    | "DESIGN"
    | "SUPPLY"
    | "PRODUCTION"
    | "ERECTION"
    | "SYSTEMS"
    | "COMMISSIONING"
    | "DELIVERY";
}
export interface Dependency {
  dependencyId: string;
  predecessorTaskId: string;
  successorTaskId: string;
  type: "FS";
  lagDays: number;
}
export interface Material {
  materialLotId: string;
  materialCode: string;
  quantity: number;
  unit: string;
  status: "RELEASED" | "PARTIAL" | "HOLD";
  availableDay: number | null;
  dataMeta: DataMeta;
}
export interface MaterialRequirement {
  requirementId: string;
  entityId: string;
  taskId: string;
  materialLotId: string;
  needByDay: number;
  requiredQty: number;
  critical: boolean;
}
export interface Quality {
  inspectionId: string;
  objectId: string;
  taskId: string;
  weldingProgressPct: number;
  inspectedCount: number;
  passCount: number;
  ndtStatus: "PASS" | "IN_PROGRESS" | "HOLD";
  openNcrCount: number;
  reworkManHours: number;
  gateStatus: "RELEASED" | "BLOCKED" | "NOT_READY";
  dataDate: number;
  dataMeta: DataMeta;
}
export interface Resource {
  resourceId: string;
  type: string;
  name: string;
  capacity: number;
  capacityUnit: "slot" | "team";
  calendarId: string;
  status: "AVAILABLE" | "OUTAGE";
  dataMeta: DataMeta;
}
export interface ResourceAllocation {
  allocationId: string;
  taskId: string;
  resourceId: string;
  demand: number;
}
export interface TimelineState {
  playbackStep: number;
  timelineMode: "manual" | "play";
  mode: "PLANNED_PREVIEW" | "SCENARIO_PREVIEW" | "ACTUAL_REPLAY";
  selectedBlock: string | null;
  selectedScenario: string | null;
}
export type ScenarioType =
  | "WEATHER_SHUTDOWN"
  | "CRANE_BREAKDOWN"
  | "MATERIAL_DELAY"
  | "WELDING_REWORK"
  | "WIND_CHALLENGER_DELAY";
export interface SimulationScenario {
  scenarioId: string;
  name: string;
  type: ScenarioType;
  baselineId: string;
  targetEntityId: string;
  targetTaskId: string;
  status: "DRAFT" | "VALIDATED";
  dataMeta: DataMeta;
}
export interface SimulationResult {
  resultId: string;
  scenarioId: string;
  baselineSnapshotId: string;
  scenarioSnapshotId: string;
  baselineFinishDay: number;
  scenarioFinishDay: number;
  incrementalDelayDays: number;
  changedTaskIds: string[];
  affectedEntityIds: string[];
  criticalPathsBefore: string[][];
  criticalPathsAfter: string[][];
  dataMeta: DataMeta;
}
export interface KPI {
  id: string;
  label: string;
  value: number | null;
  unit: string;
  basis: string;
  dataMeta: DataMeta;
}
export interface ThreeObjectMetadata {
  objectId: string;
  entityId: string;
  vesselId: string;
  objectType: PhysicalObject["objectType"];
  selectable: boolean;
}

// P09 calculated read models extend the existing P03 contracts; JSON fixtures stay immutable.
export interface WhatIfScenario extends SimulationScenario {
  delayDays: number;
  startDay?: number;
  description: string;
}
export interface CalculatedTask extends ScheduleTask {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  totalFloat: number;
  isCritical: boolean;
}
export interface ScheduleSnapshot {
  snapshotId: string;
  startDay: number;
  finishDay: number;
  tasks: CalculatedTask[];
  criticalPaths: string[][];
  pathsTruncated: boolean;
}
export interface TaskImpact {
  taskId: string;
  baselineStart: number;
  scenarioStart: number;
  baselineFinish: number;
  scenarioFinish: number;
  finishDelta: number;
  direct: boolean;
}
export interface FloatChange {
  taskId: string;
  baselineFloat: number;
  scenarioFloat: number;
  consumedDays: number;
}
export interface BlockImpact {
  blockId: string;
  taskIds: string[];
  maxFinishDelta: number;
  direct: boolean;
}
export interface WhatIfResult extends SimulationResult {
  scenario: WhatIfScenario | null;
  baseline: ScheduleSnapshot;
  scenarioSchedule: ScheduleSnapshot;
  taskImpacts: TaskImpact[];
  floatChanges: FloatChange[];
  blockImpacts: BlockImpact[];
  directTaskIds: string[];
  criticalPathChanged: boolean;
  newCriticalTaskIds: string[];
  targetFloatConsumed: number;
  explanation: string;
}
