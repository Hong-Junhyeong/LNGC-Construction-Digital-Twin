"use client";
import { useState, useRef, useEffect } from "react";
import { FlaskConical, RotateCcw } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PageHeading,
  Panel,
  DataSourceBadge,
  Note,
} from "@/components/dashboard/Primitives";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { blocks } from "@/data/repository";
import { useTwin } from "@/application/TwinContext";
import {
  SCENARIO_LABELS,
  SCENARIO_PRESETS,
  createScenario,
} from "@/lib/simulation/scenarios";
import { simulateScenario } from "@/lib/simulation/simulate";
import { simulationInput } from "@/lib/simulation/project";
import type { ScenarioType, WhatIfScenario } from "@/types/domain";
import SimulationResults from "./SimulationResults";

type Status =
  "READY" | "CALCULATING" | "SIMULATION COMPLETE" | "SIMULATION ERROR";
function defaultTarget(type: ScenarioType, block: string | null) {
  return type === "CRANE_BREAKDOWN"
    ? "RES-ERECTION-SLOT-01"
    : type === "WEATHER_SHUTDOWN"
      ? "OUTDOOR"
      : type === "WIND_CHALLENGER_DELAY"
        ? "WC02"
        : (block ?? "B04");
}
export default function SimulationWorkspace() {
  const {
    scenarioDraft,
    setScenarioDraft,
    scenarioType,
    setScenarioType,
    selectedBlock,
    selectBlock,
    selectScenario,
    playbackStep,
    operationalStates,
    baselineSchedule,
    simulationResult,
    setSimulationResult,
  } = useTwin();
  const saved = simulationResult?.scenario;
  const [target, setTarget] = useState(
    scenarioDraft?.target ??
      (saved?.type === scenarioType
        ? saved.targetEntityId
        : defaultTarget(scenarioType, selectedBlock)),
  );
  const [duration, setDuration] = useState(
    scenarioDraft?.duration ?? String(saved?.delayDays ?? 3),
  );
  const [start, setStart] = useState(
    scenarioDraft?.start ?? String(saved?.startDay ?? 690),
  );
  const [status, setStatus] = useState<Status>(
    simulationResult ? "SIMULATION COMPLETE" : "READY",
  );
  const [error, setError] = useState("");
  const [comparison, setComparison] = useState<
    { name: string; finish: number; delay: number }[]
  >([]);
  useEffect(() => {
    setScenarioDraft({ target, duration, start });
  }, [target, duration, start, setScenarioDraft]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const outage =
    scenarioType === "WEATHER_SHUTDOWN" || scenarioType === "CRANE_BREAKDOWN";
  const options =
    scenarioType === "CRANE_BREAKDOWN"
      ? [
          ["RES-ERECTION-SLOT-01", "Main erection crane · assumed slot"],
          ["RES-WC-SLOT-01", "WAPS installation slot"],
        ]
      : scenarioType === "WEATHER_SHUTDOWN"
        ? [["OUTDOOR", "Outdoor erection and WAPS lifting"]]
        : scenarioType === "WIND_CHALLENGER_DELAY"
          ? [
              ["WC01", "WC01 · shared WC_LIFT"],
              ["WC02", "WC02 · shared WC_LIFT"],
            ]
          : blocks.map((b) => [b.entityId, `${b.entityId} · ${b.name}`]);
  const context = operationalStates.find((b) => b.blockId === target);
  function changed() {
    if (timer.current) clearTimeout(timer.current);
    setError("");
    setStatus("READY");
    setSimulationResult(null);
    selectScenario(null);
  }
  function chooseType(type: ScenarioType) {
    changed();
    setScenarioType(type);
    setTarget(defaultTarget(type, selectedBlock));
  }
  function preset(s: WhatIfScenario) {
    changed();
    setScenarioType(s.type);
    setTarget(s.targetEntityId);
    setDuration(String(s.delayDays));
    setStart(String(s.startDay ?? 690));
    if (/^B0/.test(s.targetEntityId)) selectBlock(s.targetEntityId);
  }
  function run() {
    setSimulationResult(null);
    setError("");
    if (!duration.trim() || (outage && !start.trim())) {
      setStatus("SIMULATION ERROR");
      setError("Enter a delay and, for outages, a start day.");
      return;
    }
    setStatus("CALCULATING");
    const scenario = createScenario(
      scenarioType,
      target,
      Number(duration),
      Number(start),
    );
    timer.current = setTimeout(() => {
      try {
        const result = simulateScenario(simulationInput, scenario);
        setSimulationResult(result);
        selectScenario(scenario.scenarioId);
        setStatus("SIMULATION COMPLETE");
      } catch (e) {
        setStatus("SIMULATION ERROR");
        setError(
          e instanceof Error
            ? e.message
            : "Simulation failed. Check the schedule and inputs.",
        );
      }
    }, 0);
  }
  function reset() {
    changed();
    setComparison([]);
    setScenarioType("WELDING_REWORK");
    setTarget("B04");
    setDuration("3");
    setStart("690");
  }
  function compare() {
    try {
      setComparison(
        SCENARIO_PRESETS.map((s) => {
          const r = simulateScenario(simulationInput, s);
          return {
            name: s.name,
            finish: r.scenarioFinishDay,
            delay: r.incrementalDelayDays,
          };
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Comparison failed.");
      setStatus("SIMULATION ERROR");
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="WHAT-IF WORKBENCH / 05"
        title="Understand the impact. Before it happens."
        description={`Compare an educational disruption with the immutable D${baselineSchedule.finishDay} Master Schedule. Dependency paths and available float determine delivery impact; 3D playback remains independent.`}
      />
      <div className="scenario-presets" aria-label="Scenario presets">
        {SCENARIO_PRESETS.map((s) => (
          <button
            key={s.scenarioId}
            disabled={status === "CALCULATING"}
            onClick={() => preset(s)}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div className="scenario-workbench">
        <Panel
          title="Configure a scenario"
          kicker="01 / EDUCATIONAL INPUT"
          action={<DataSourceBadge type="ASSUMPTION" />}
        >
          <div className="form-body">
            <label className="field-title" id="scenario-type-label">
              Scenario type
            </label>
            <Select
              value={scenarioType}
              onValueChange={(value) => chooseType(value as ScenarioType)}
            >
              <SelectTrigger
                aria-labelledby="scenario-type-label"
                className="wide"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCENARIO_LABELS).map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label
              className="field-title scenario-target-label"
              id="target-label"
            >
              Affected target
            </label>
            <Select
              value={target}
              onValueChange={(value) => {
                changed();
                setTarget(value);
                if (/^B0/.test(value)) selectBlock(value);
              }}
            >
              <SelectTrigger aria-labelledby="target-label" className="wide">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map(([id, label]) => (
                  <SelectItem key={id} value={id}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="form-grid">
              <div>
                <label htmlFor="duration">Additional delay (days)</label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  max={365}
                  step={0.5}
                  value={duration}
                  onChange={(e) => {
                    changed();
                    setDuration(e.target.value);
                  }}
                />
              </div>
              {outage && (
                <div>
                  <label htmlFor="start-day">Outage start day</label>
                  <Input
                    id="start-day"
                    type="number"
                    min={0}
                    max={baselineSchedule.finishDay}
                    step={0.5}
                    value={start}
                    onChange={(e) => {
                      changed();
                      setStart(e.target.value);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="scenario-preview">
              <strong>Scenario preview</strong>
              <p>
                {target} · {SCENARIO_LABELS[scenarioType]} · +{duration || "—"}d
                {outage ? ` from D${start || "—"}` : ""}
              </p>
              <small>
                3D playback S{playbackStep}. This run recomputes the full Master
                Schedule; it does not move geometry or lock completed work.
              </small>
              {context && (
                <p>
                  Mock operational record: NCR {context.ncr.openCount} open · NDT{" "}
                  {context.ndt.status} · rework {context.rework.plannedManHours}{" "}
                  MH planned. Enter delay explicitly; no MH-to-day conversion.
                </p>
              )}
            </div>
            <div className="scenario-run-actions">
              <Button onClick={run} disabled={status === "CALCULATING"}>
                <FlaskConical size={16} />
                Run simulation
              </Button>
              <Button variant="outline" onClick={reset}>
                <RotateCcw size={16} />
                Reset scenario
              </Button>
            </div>
            <p role="status" aria-live="polite" className="simulation-status">
              {status}
            </p>
            {error && (
              <p role="alert" className="validation-error">
                {error}
              </p>
            )}
          </div>
        </Panel>
        <Panel
          title="Baseline reference"
          kicker="02 / READ-ONLY SCHEDULE"
          action={<DataSourceBadge type="ASSUMPTION" />}
        >
          <dl className="result-details">
            <dt>Project start</dt>
            <dd>D{baselineSchedule.startDay} · 2025-01-06</dd>
            <dt>Delivery</dt>
            <dd>D{baselineSchedule.finishDay}</dd>
            <dt>Tasks / dependencies</dt>
            <dd>
              {baselineSchedule.tasks.length} /{" "}
              {simulationInput.dependencies.length}
            </dd>
            <dt>Critical paths</dt>
            <dd>{baselineSchedule.criticalPaths.length}</dd>
            <dt>Calendar</dt>
            <dd>Elapsed 24×7 days</dd>
            <dt>3D playback</dt>
            <dd>Step {playbackStep} / 60 · geometry only</dd>
          </dl>
          <p className="simulation-explanation">
            Welding delay maps to the selected erection task. Material uses
            need-by constraints on the shared OUTFIT consumer. WC01/WC02 share
            one installation package. Outages suspend only mapped tasks during
            one Master Schedule window.
          </p>
          <Note>
            The target’s incident duration can differ from delivery delay. No
            actual yard dates or cost loss are inferred.
          </Note>
        </Panel>
      </div>
      {simulationResult && (
        <SimulationResults
          key={simulationResult.resultId}
          result={simulationResult}
        />
      )}
      <Panel
        title="Preset scenario comparison"
        kicker="INDEPENDENT RUNS FROM THE SAME BASELINE"
        className="section-gap"
        action={
          <Button variant="outline" onClick={compare}>
            Calculate preset comparison
          </Button>
        }
      >
        {comparison.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scenario</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Scenario delivery</TableHead>
                <TableHead>Impact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison.map((row) => (
                <TableRow key={row.name}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>D{baselineSchedule.finishDay}</TableCell>
                  <TableCell>D{row.finish}</TableCell>
                  <TableCell>+{row.delay}d</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="simulation-explanation">
            Calculate the five presets independently. This does not combine
            incidents or change the active scenario.
          </p>
        )}
      </Panel>
    </>
  );
}
