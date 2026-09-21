"use client";
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import {
  blocks,
  tasks,
  production,
  materials,
  requirements,
  quality,
  dependencies,
  resources,
  allocations,
  cargoTanks,
} from "@/data/repository";
import {
  getConstructionSnapshot,
  type BlockState,
} from "@/lib/twin/block-state";
import {
  getOperationalSnapshot,
  type BlockOperationalState,
} from "@/lib/twin/block-operations";
import type {
  TimelineState,
  ScenarioType,
  WhatIfResult,
  ScheduleSnapshot,
  CargoContainmentState,
  OutfittingState,
} from "@/types/domain";
import { objectById } from "@/lib/three/constants";
import { baselineCalculation } from "@/lib/simulation/project";
import {
  getCargoContainmentState,
  getOutfittingState,
  getVisualOverallProgress,
} from "@/lib/twin/system-state";
interface Context extends TimelineState {
  scenarioDraft: { target: string; duration: string; start: string } | null;
  setScenarioDraft: (
    draft: { target: string; duration: string; start: string } | null,
  ) => void;
  prepareScenario: (type: ScenarioType, target: string) => void;
  operationalIssues: string[];
  baselineSchedule: ScheduleSnapshot;
  simulationResult: WhatIfResult | null;
  setSimulationResult: (result: WhatIfResult | null) => void;
  blockStates: BlockState[];
  cargoStates: CargoContainmentState[];
  outfittingState: OutfittingState;
  operationalStates: BlockOperationalState[];
  operationalSummary: ReturnType<typeof getOperationalSnapshot>["summary"];
  blockProgress: number;
  overallProgress: number;
  selectedObject: string | null;
  selectObject: (id: string | null) => void;
  selectBlock: (id: string | null) => void;
  setPlaybackStep: (step: number) => void;
  setPlayback: (mode: "manual" | "play") => void;
  selectScenario: (id: string | null) => void;
  scenarioType: ScenarioType;
  setScenarioType: (type: ScenarioType) => void;
}
const TwinContext = createContext<Context | null>(null);
export function TwinProvider({ children }: { children: ReactNode }) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>("B04");
  const [playbackStep, setPlaybackStepState] = useState(60);
  const [selectedObject, setSelectedObject] = useState<string | null>(
    "B04/SHELL",
  );
  function selectBlock(id: string | null) {
    const valid = blocks.some((b) => b.entityId === id) ? id : null;
    setSelectedBlock(valid);
    setSelectedObject(valid ? valid + "/SHELL" : null);
  }
  function selectObject(id: string | null) {
    const object = objectById(id);
    setSelectedObject(object?.objectId ?? null);
    setSelectedBlock(
      object && blocks.some((b) => b.entityId === object.entityId)
        ? object.entityId
        : null,
    );
  }
  const [timelineMode, setPlayback] = useState<"manual" | "play">("manual");
  const [selectedScenario, selectScenario] = useState<string | null>(null);
  const [scenarioType, setScenarioType] =
    useState<ScenarioType>("WELDING_REWORK");
  const [simulationResult, setSimulationResult] = useState<WhatIfResult | null>(
    null,
  );
  const [scenarioDraft, setScenarioDraft] = useState<{
    target: string;
    duration: string;
    start: string;
  } | null>(null);
  function prepareScenario(type: ScenarioType, target: string) {
    setScenarioType(type);
    setScenarioDraft({ target, duration: "3", start: "690" });
    setSimulationResult(null);
    selectScenario(null);
    if (blocks.some((b) => b.entityId === target)) selectBlock(target);
    else if (objectById(target)) selectObject(target);
  }
  const snapshot = useMemo(
    () => getConstructionSnapshot(blocks, playbackStep, tasks),
    [playbackStep],
  );
  const cargoStates = useMemo(
    () =>
      cargoTanks.map((tank) =>
        getCargoContainmentState(tank.entityId, playbackStep),
      ),
    [playbackStep],
  );
  const outfittingState = useMemo(
    () => getOutfittingState(playbackStep),
    [playbackStep],
  );
  const overallProgress = useMemo(
    () =>
      getVisualOverallProgress(
        snapshot.overallProgress,
        cargoStates,
        outfittingState,
      ),
    [snapshot.overallProgress, cargoStates, outfittingState],
  );
  const operations = useMemo(
    () =>
      getOperationalSnapshot(playbackStep, snapshot.states, {
        blocks,
        production,
        materials,
        requirements,
        quality,
        tasks,
        dependencies,
        resources,
        allocations,
      }),
    [playbackStep, snapshot.states],
  );
  const operationalStates = useMemo(
    () =>
      operations.states.map((state) => {
        const task = baselineCalculation.baseline.tasks.find(
          (t) => t.taskId === `E-${state.blockId}`,
        )!;
        return {
          ...state,
          schedule: {
            ...state.schedule,
            floatDays: task.totalFloat,
            criticalPath: task.isCritical,
          },
        };
      }),
    [operations.states],
  );
  const setPlaybackStep = useCallback(
    (d: number) =>
      setPlaybackStepState(
        Number.isFinite(d) ? Math.max(0, Math.min(60, Math.round(d))) : 0,
      ),
    [],
  );
  return (
    <TwinContext.Provider
      value={{
        scenarioDraft,
        setScenarioDraft,
        prepareScenario,
        operationalIssues: operations.issues,
        selectedBlock,
        selectBlock,
        selectedObject,
        selectObject,
        playbackStep,
        setPlaybackStep,
        baselineSchedule: baselineCalculation.baseline,
        simulationResult,
        setSimulationResult,
        blockStates: snapshot.states,
        cargoStates,
        outfittingState,
        operationalStates,
        operationalSummary: operations.summary,
        blockProgress: snapshot.overallProgress,
        overallProgress,
        timelineMode,
        setPlayback,
        selectedScenario,
        selectScenario,
        mode: "PLANNED_PREVIEW",
        scenarioType,
        setScenarioType,
      }}
    >
      {children}
    </TwinContext.Provider>
  );
}
export function useTwin() {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("TwinProvider required");
  return ctx;
}
