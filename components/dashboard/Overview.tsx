"use client";
import {
  ArrowUpRight,
  ShieldAlert,
  Package,
  Wind,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import {
  PageHeading,
  KpiCard,
  Panel,
  DataSourceBadge,
  Meter,
  TextLink,
} from "./Primitives";
import VesselViewer from "@/components/twin/VesselViewer";
import DayContextBar from "./DayContextBar";
import ScenarioContext from "@/components/simulation/ScenarioContext";
import { useTwin } from "@/application/TwinContext";
import { masterTasks } from "@/data/master-schedule";
export default function Overview() {
  const {
    selectBlock,
    baselineSchedule,
    prepareScenario,
    playbackStep,
    overallProgress,
    blockProgress,
    cargoStates,
    outfittingState,
    operationalSummary: summary,
    operationalStates: blocks,
  } = useTwin();
  const wcLift = masterTasks.find((task) => task.taskId === "WC_LIFT")!;
  return (
    <>
      <PageHeading
        eyebrow="PRODUCTION CONTROL / 01"
        title="A clear view of what’s next."
        description="174K membrane LNG carrier · 9 simulation blocks · 2 Wind Challenger systems"
        action={
          <Link className="primary-link" href="/twin">
            Open twin workspace
            <ArrowUpRight size={17} />
          </Link>
        }
      />
      <DayContextBar />
      <ScenarioContext />
      <div className="kpi-grid">
        <KpiCard
          label="Overall visual progress"
          value={overallProgress}
          unit="%"
          type="DERIVED"
          note={`S${playbackStep} · Block ${blockProgress}% · Cargo ${Math.round(cargoStates.reduce((sum, state) => sum + state.progress, 0) / cargoStates.length)}% · Outfit ${outfittingState.progress}%`}
        >
          <Meter value={overallProgress} label="Overall planned progress" />
        </KpiCard>
        <KpiCard
          label="Baseline delivery"
          value={baselineSchedule.finishDay}
          unit="DAY"
          note="Educational schedule · not a live forecast"
          type="ASSUMPTION"
        />
        <KpiCard
          label="Material readiness"
          value={summary.materialReadiness}
          unit="%"
          note="Mock operational fixture · independent of playback"
          type="DERIVED"
        />
        <KpiCard
          label="Quality gates"
          value={`${summary.releasedGates} / 9`}
          note={`${summary.openNcr} open NCR · ${summary.plannedRework} planned rework MH`}
          type="DERIVED"
        />
      </div>
      <div className="overview-main">
        <Panel
          title="Vessel & block workspace"
          kicker="SPATIAL CONTEXT"
          action={<TextLink href="/twin">Explore twin</TextLink>}
        >
          <VesselViewer compact />
        </Panel>
        <Panel
          title="Items to review"
          kicker="ATTENTION REQUIRED"
          action={<span className="count-chip">04</span>}
        >
          <Link
            href="/quality"
            className="risk-item"
            onClick={() => selectBlock("B04")}
          >
            <span className="risk-icon red">
              <ShieldAlert size={19} />
            </span>
            <div>
              <div className="split">
                <strong>B04 · Quality release review</strong>
                <DataSourceBadge />
              </div>
              <p>
                Recorded D25: weld repair and reinspection. Current gate:{" "}
                {blocks.find((b) => b.blockId === "B04")?.qualityGate ??
                  "Unavailable"}
                .
              </p>
              <span className="text-link">
                Inspect quality chain <ChevronRight size={13} />
              </span>
            </div>
          </Link>
          <Link
            href="/production"
            className="risk-item"
            onClick={() => selectBlock("B07")}
          >
            <span className="risk-icon amber">
              <Package size={19} />
            </span>
            <div>
              <strong>B07 · Outfitting material</strong>
              <p>
                Recorded D25: 80 / 100 kits. Current readiness:{" "}
                {blocks.find((b) => b.blockId === "B07")?.material
                  .readinessPct ?? "—"}
                %. Need-by Day 40.
              </p>
              <span className="text-link">
                Review material <ChevronRight size={13} />
              </span>
            </div>
          </Link>
          <Link
            href="/simulation"
            className="risk-item"
            onClick={() => prepareScenario("WIND_CHALLENGER_DELAY", "WC02")}
          >
            <span className="risk-icon cyan">
              <Wind size={19} />
            </span>
            <div>
              <strong>Wind Challenger installation</strong>
              <p>
                Master lift window D{wcLift.baselineStartDay}–D
                {wcLift.baselineFinishDay}. Prepare a disruption case.
              </p>
              <span className="text-link">
                Explore scenario <ChevronRight size={13} />
              </span>
            </div>
          </Link>
          <Link
            href="/twin"
            className="risk-item"
            onClick={() => selectBlock("B04")}
          >
            <span className="risk-icon amber">
              <CalendarDays size={19} />
            </span>
            <div>
              <strong>B04 · Critical erection task</strong>
              <p>E-B04 has zero baseline float. Inspect block context.</p>
            </div>
          </Link>
        </Panel>
      </div>
      <div className="overview-bottom">
        <Panel
          title="Block production"
          kicker={`PLAYBACK STEP ${playbackStep} · GEOMETRY PREVIEW`}
          action={<TextLink href="/production">All blocks</TextLink>}
        >
          <div className="mini-blocks">
            {blocks.map((b) => {
              const p = { progressPct: b.progress, stage: b.stage };
              return (
                <Link
                  href="/twin"
                  onClick={() => selectBlock(b.blockId)}
                  key={b.blockId}
                >
                  <div className="split">
                    <strong>{b.blockId}</strong>
                    <span>{p.progressPct}%</span>
                  </div>
                  <Meter
                    value={p.progressPct}
                    label={b.blockId + " progress"}
                  />
                  <small>{p.stage.replaceAll("_", " ")}</small>
                </Link>
              );
            })}
          </div>
        </Panel>
        <Panel
          title="Baseline critical sequence"
          kicker="CALCULATED CPM · FIRST OF PARALLEL PATHS"
          action={<DataSourceBadge type="DERIVED" />}
        >
          <div className="path-sequence">
            {baselineSchedule.criticalPaths[0].map((v, i) => (
              <span key={v} className={v === "E-B04" ? "highlight" : ""}>
                {v}
                {i < baselineSchedule.criticalPaths[0].length - 1 && (
                  <ChevronRight size={13} />
                )}
              </span>
            ))}
          </div>
          <div className="delivery-line">
            <CalendarDays size={22} />
            <div>
              <strong>
                Master delivery gate · D{baselineSchedule.finishDay}
              </strong>
              <p>
                {baselineSchedule.criticalPaths.length} calculated critical
                paths through final acceptance.
              </p>
            </div>
          </div>
          <TextLink href="/insight">Review production insights</TextLink>
        </Panel>
      </div>
    </>
  );
}
