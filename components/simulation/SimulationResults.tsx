"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Panel,
  KpiCard,
  DataSourceBadge,
} from "@/components/dashboard/Primitives";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { useTwin } from "@/application/TwinContext";
import type { WhatIfResult, ScheduleSnapshot } from "@/types/domain";

function PathList({
  title,
  schedule,
}: {
  title: string;
  schedule: ScheduleSnapshot;
}) {
  return (
    <section className="critical-path-list">
      <h3>
        {title} · {schedule.criticalPaths.length} paths
      </h3>
      {schedule.criticalPaths.map((path, i) => (
        <details key={path.join(">")} open={i === 0}>
          <summary>
            Path {i + 1} · {path.length} tasks · D{schedule.finishDay}
          </summary>
          <ol>
            {path.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ol>
        </details>
      ))}
      {schedule.pathsTruncated && (
        <p>Showing the first 256 critical paths. All tasks were calculated.</p>
      )}
    </section>
  );
}
export default function SimulationResults({
  result: r,
}: {
  result: WhatIfResult;
}) {
  const { selectBlock, playbackStep } = useTwin();
  const [previewDay, setPreviewDay] = useState(
    Math.min(700, r.baselineFinishDay),
  );
  const maxDay = Math.max(r.baselineFinishDay, r.scenarioFinishDay),
    byId = new Map(r.scenarioSchedule.tasks.map((t) => [t.taskId, t]));
  const timelineIds = [
    ...new Set([
      ...r.directTaskIds,
      ...r.taskImpacts.slice(0, 10).map((t) => t.taskId),
      "INT_COM",
      "DEL",
    ]),
  ];
  const active = (schedule: ScheduleSnapshot) =>
    schedule.tasks
      .filter((t) => t.es <= previewDay && t.ef > previewDay)
      .map((t) => t.taskId)
      .join(", ") || "No active task";
  return (
    <div className="simulation-results" aria-label="Simulation results">
      <Panel
        title={r.scenario?.name ?? "Baseline"}
        kicker="SIMULATION COMPLETE"
        action={<DataSourceBadge type="DERIVED" />}
      >
        <div className="delivery-comparison">
          <div>
            <span>BASELINE DELIVERY</span>
            <strong>Day {r.baselineFinishDay}</strong>
            <DataSourceBadge type="ASSUMPTION" />
          </div>
          <div>
            <span>SCENARIO DELIVERY</span>
            <strong>Day {r.scenarioFinishDay}</strong>
            <small>Calculated from dependencies</small>
          </div>
          <div className="delivery-impact">
            <span>DELIVERY IMPACT</span>
            <strong>+{r.incrementalDelayDays} days</strong>
            <small>Incident: +{r.scenario?.delayDays ?? 0}d</small>
          </div>
        </div>
        <p className="simulation-explanation">{r.explanation}</p>
      </Panel>
      <div className="kpi-grid scenario-kpis">
        <KpiCard
          label="Affected tasks"
          value={r.changedTaskIds.length}
          type="DERIVED"
          note="Start or finish changed"
        />
        <KpiCard
          label="Affected blocks"
          value={r.blockImpacts.length}
          type="DERIVED"
          note="Includes shared hull/outfit packages"
        />
        <KpiCard
          label="Critical path"
          value={r.criticalPathChanged ? "CHANGED" : "UNCHANGED"}
          type="DERIVED"
          note={`${r.newCriticalTaskIds.length} newly critical tasks`}
        />
        <KpiCard
          label="Target float consumed"
          value={r.targetFloatConsumed}
          unit="d"
          type="DERIVED"
          note="Maximum among direct targets; not summed along paths"
        />
      </div>
      <Panel title="Affected blocks & systems" kicker="SCENARIO OVERLAY">
        <div className="impact-blocks">
          {r.blockImpacts.map((b) => (
            <Link
              key={b.blockId}
              href="/twin"
              onClick={() => selectBlock(b.blockId)}
              data-direct={b.direct}
            >
              <strong>
                {b.blockId} +{b.maxFinishDelta}d
              </strong>
              <span>
                {b.direct ? "Direct target" : "Downstream / shared task"}
              </span>
            </Link>
          ))}
          {!r.blockImpacts.length && <p>No hull-block schedule change.</p>}
        </div>
        <p className="simulation-explanation">
          System entities:{" "}
          {r.affectedEntityIds.filter((id) => /^WC/.test(id)).join(", ") ||
            "none"}
          . Block impact is the maximum finish shift of its linked tasks; these
          values are not additive.{" "}
          <Link href="/twin" className="text-link">
            View scenario overlay in Twin ↗
          </Link>
        </p>
      </Panel>
      <Panel
        title="Critical path comparison"
        kicker="ZERO TOTAL FLOAT · TIGHT FS EDGES"
        className="section-gap"
      >
        <div className="critical-path-compare">
          <PathList title="Baseline" schedule={r.baseline} />
          <PathList title="Scenario" schedule={r.scenarioSchedule} />
        </div>
        <p className="simulation-explanation">
          Newly critical: {r.newCriticalTaskIds.join(", ") || "none"}. Multiple
          parallel critical paths are retained.
        </p>
      </Panel>
      <Panel
        title="Delay propagation & schedule comparison"
        kicker="BASELINE → SCENARIO FINISH · DAYS"
        className="section-gap"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Task",
                "Source",
                "Baseline start / finish",
                "Scenario start / finish",
                "Finish shift",
                "Float before → after",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.taskImpacts.map((t) => (
              <TableRow key={t.taskId}>
                <TableCell>
                  {t.taskId}
                  <small className="cell-sub">{byId.get(t.taskId)?.name}</small>
                </TableCell>
                <TableCell>
                  {t.direct ? "Direct incident" : "Dependency"}
                </TableCell>
                <TableCell>
                  D{t.baselineStart} / D{t.baselineFinish}
                </TableCell>
                <TableCell>
                  D{t.scenarioStart} / D{t.scenarioFinish}
                </TableCell>
                <TableCell>+{t.finishDelta}d</TableCell>
                <TableCell>
                  {
                    r.baseline.tasks.find((b) => b.taskId === t.taskId)
                      ?.totalFloat
                  }{" "}
                  → {byId.get(t.taskId)?.totalFloat}d
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!r.taskImpacts.length && (
          <p className="empty-state">
            No task timing changes. The incident has no delivery impact.
          </p>
        )}
      </Panel>
      <Panel
        title="Scenario timeline preview"
        kicker="SEPARATE CURSOR · BASELINE TIMELINE UNCHANGED"
        className="section-gap"
      >
        <div className="scenario-timeline">
          <label htmlFor="scenario-day">
            Scenario preview day <strong>{previewDay}</strong> / {maxDay} ·
            3D playback remains S{playbackStep}
          </label>
          <input
            id="scenario-day"
            type="range"
            min={0}
            max={maxDay}
            step={0.5}
            value={previewDay}
            onChange={(e) => setPreviewDay(Number(e.target.value))}
          />
          <p>Baseline active: {active(r.baseline)}</p>
          <p>Scenario active: {active(r.scenarioSchedule)}</p>
          <div className="timeline-key">
            <span>Blue: baseline</span>
            <span>Amber: scenario</span>
            <span>Line: preview day</span>
          </div>
          {timelineIds.map((id) => {
            const b = r.baseline.tasks.find((t) => t.taskId === id)!,
              s = byId.get(id)!;
            return (
              <div className="comparison-row" key={id}>
                <span>{id}</span>
                <div>
                  <i
                    className="baseline-bar"
                    style={{
                      left: `${(b.es / maxDay) * 100}%`,
                      width: `${((b.ef - b.es) / maxDay) * 100}%`,
                    }}
                    title={`Baseline ${id}: D${b.es}–${b.ef}`}
                  />
                  <i
                    className="scenario-bar"
                    style={{
                      left: `${(s.es / maxDay) * 100}%`,
                      width: `${((s.ef - s.es) / maxDay) * 100}%`,
                    }}
                    title={`Scenario ${id}: D${s.es}–${s.ef}`}
                  />
                  <b style={{ left: `${(previewDay / maxDay) * 100}%` }} />
                </div>
                <small>
                  D{b.ef} → D{s.ef}
                </small>
              </div>
            );
          })}
          <p>
            Selected direct tasks, first 10 affected tasks, commissioning and
            delivery. All timings appear in the tables.
          </p>
        </div>
      </Panel>
      <details className="cpm-details">
        <summary>
          Inspect all {r.scenarioSchedule.tasks.length} tasks · ES / EF / LS /
          LF / Total Float
        </summary>
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Task",
                "Base ES/EF",
                "Base LS/LF",
                "Base float",
                "Scenario ES/EF",
                "Scenario LS/LF",
                "Scenario float",
                "Critical",
              ].map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.scenarioSchedule.tasks.map((t) => {
              const b = r.baseline.tasks.find((b) => b.taskId === t.taskId)!;
              return (
                <TableRow key={t.taskId}>
                  <TableCell>{t.taskId}</TableCell>
                  <TableCell>
                    {b.es} / {b.ef}
                  </TableCell>
                  <TableCell>
                    {b.ls} / {b.lf}
                  </TableCell>
                  <TableCell>{b.totalFloat}</TableCell>
                  <TableCell>
                    {t.es} / {t.ef}
                  </TableCell>
                  <TableCell>
                    {t.ls} / {t.lf}
                  </TableCell>
                  <TableCell>{t.totalFloat}</TableCell>
                  <TableCell>{t.isCritical ? "YES" : "NO"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </details>
      <details className="cpm-details">
        <summary>Float changes · {r.floatChanges.length} tasks</summary>
        <Table>
          <TableHeader>
            <TableRow>
              {["Task", "Baseline float", "Scenario float", "Consumed"].map(
                (h) => (
                  <TableHead key={h}>{h}</TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {r.floatChanges.map((t) => (
              <TableRow key={t.taskId}>
                <TableCell>{t.taskId}</TableCell>
                <TableCell>{t.baselineFloat}d</TableCell>
                <TableCell>{t.scenarioFloat}d</TableCell>
                <TableCell>{t.consumedDays}d</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <p className="simulation-explanation">
          Float is relative to each schedule’s own delivery. Unaffected branches
          may gain float when delivery moves. Path float must not be summed.
        </p>
      </details>
    </div>
  );
}
