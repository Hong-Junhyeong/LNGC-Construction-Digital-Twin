"use client";
import Link from "next/link";
import { ShieldAlert, Package, Wind, ArrowUpRight } from "lucide-react";
import {
  PageHeading,
  Panel,
  DataSourceBadge,
  Note,
  KpiCard,
} from "@/components/dashboard/Primitives";
import { useTwin } from "@/application/TwinContext";
import type { ScenarioType } from "@/types/domain";
const findings = [
  {
    id: "01",
    icon: ShieldAlert,
    title: "Release B04 through the quality chain",
    entity: "B04",
    type: "WELDING_REWORK" as ScenarioType,
    problem: "A mock weld inspection hold blocks the B04 quality release.",
    evidence: "1 open NCR · 48 planned rework MH · E-B04",
    response:
      "Prepare repair and reinspection durations, then compare a scenario against the baseline.",
    href: "/quality",
    tag: "QUALITY",
  },
  {
    id: "02",
    icon: Package,
    title: "Review B07 outfitting material",
    entity: "B07",
    type: "MATERIAL_DELAY" as ScenarioType,
    problem: "The mock fixture has 80 of 100 required kits available.",
    evidence: "MAT-B07 → MATREQ-B07 → OUTFIT · Need-by Day 40",
    response:
      "Check remaining quantity and release day before assigning a material delay.",
    href: "/production",
    tag: "MATERIAL",
  },
  {
    id: "03",
    icon: Wind,
    title: "Keep WAPS installation in the schedule",
    entity: "B02",
    type: "WIND_CHALLENGER_DELAY" as ScenarioType,
    problem:
      "Two Wind Challenger systems share one installation package in the baseline.",
    evidence: "WC_FND_INSTALL → WC_LIFT → INT_COM → inspection → sea trial",
    response:
      "Prepare a WC installation-delay case. No hydraulic assumption is required.",
    href: "/twin",
    tag: "WAPS",
  },
];
export default function InsightDashboard() {
  const {
    selectBlock,
    prepareScenario,
    simulationResult: result,
    playbackStep,
    baselineSchedule,
  } = useTwin();
  return (
    <>
      <PageHeading
        eyebrow="DECISION SUPPORT / 06"
        title="Connect the evidence."
        description="Trace the active scenario from its source through affected work, critical paths and delivery impact."
      />
      {result ? (
        <section aria-label="Scenario decision support">
          <Panel
            title={result.scenario?.name ?? "Baseline"}
            kicker="ACTIVE SCENARIO / DECISION SUPPORT"
            action={<DataSourceBadge type="DERIVED" />}
          >
            <div className="kpi-grid">
              <KpiCard
                note="Immutable educational plan"
                label="Baseline delivery"
                value={result.baselineFinishDay}
                unit="DAY"
                type="ASSUMPTION"
              />
              <KpiCard
                note="Calculated from dependencies"
                label="Scenario delivery"
                value={result.scenarioFinishDay}
                unit="DAY"
                type="DERIVED"
              />
              <KpiCard
                note="Scenario minus baseline"
                label="Delivery impact"
                value={"+" + result.incrementalDelayDays}
                unit="DAYS"
                type="DERIVED"
              />
              <KpiCard
                note="Maximum across direct targets"
                label="Target float consumed"
                value={result.targetFloatConsumed}
                unit="DAYS"
                type="DERIVED"
              />
            </div>
            <p className="simulation-explanation">{result.explanation}</p>
            <dl className="result-details">
              <dt>Current risk</dt>
              <dd>
                {result.scenario?.targetEntityId} ·{" "}
                {result.scenario?.type.replaceAll("_", " ")}
              </dd>
              <dt>Affected area</dt>
              <dd>
                {result.blockImpacts.map((b) => b.blockId).join(" · ") ||
                  result.affectedEntityIds.join(" · ")}
              </dd>
              <dt>Affected tasks</dt>
              <dd>{result.taskImpacts.length}</dd>
              <dt>Critical path</dt>
              <dd>
                {result.criticalPathChanged ? "Changed" : "Unchanged"} ·{" "}
                {result.scenarioSchedule.criticalPaths.length} paths
              </dd>
            </dl>
            <div className="path-sequence">
              {result.scenarioSchedule.criticalPaths[0]?.map((id) => (
                <span
                  key={id}
                  className={
                    result.directTaskIds.includes(id) ? "highlight" : ""
                  }
                >
                  {id}
                </span>
              ))}
            </div>
            <p className="simulation-explanation">
              Decision context: review the directly affected tasks and their
              release constraints with production and quality teams. This
              hypothetical full-baseline comparison does not prescribe an
              operational action or alter 3D playback step {playbackStep}.
            </p>
            <Link href="/simulation" className="text-link">
              Inspect task propagation and all critical paths ↗
            </Link>
          </Panel>
        </section>
      ) : (
        <Panel title="No active scenario result" kicker="DECISION SUPPORT">
          <p className="simulation-explanation">
            Prepare and run a scenario to calculate its delivery impact.
            Master Schedule delivery remains D{baselineSchedule.finishDay}.
          </p>
          <Link href="/simulation" className="text-link">
            Open simulation workbench ↗
          </Link>
        </Panel>
      )}
      <div className="insight-intro">
        <span className="eyebrow">REVIEW PRIORITIES</span>
        <strong>
          03 <small>connected findings</small>
        </strong>
        <span className="muted">Day 25 operational fixture</span>
        <DataSourceBadge />
      </div>
      <div className="finding-list">
        {findings.map((f) => (
          <Panel
            key={f.id}
            title={f.title}
            kicker={f.id + " / " + f.tag}
            action={<f.icon size={24} />}
          >
            <div className="finding-body">
              <div>
                <p className="field-title">Problem & evidence</p>
                <p>{f.problem}</p>
                <div className="evidence-reference mono">{f.evidence}</div>
              </div>
              <div>
                <p className="field-title">Potential response</p>
                <p>{f.response}</p>
                <span className="status warn">
                  REFERENCE FINDING · RUN ITS SCENARIO
                </span>
              </div>
            </div>
            <div className="finding-actions">
              <Link
                className="text-link"
                href={f.href}
                onClick={() => selectBlock(f.entity)}
              >
                Inspect evidence
                <ArrowUpRight size={15} />
              </Link>
              <Link
                className="secondary-link"
                href="/simulation"
                onClick={() => {
                  prepareScenario(
                    f.type,
                    f.type === "WIND_CHALLENGER_DELAY" ? "WC02" : f.entity,
                  );
                }}
              >
                Prepare scenario
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </Panel>
        ))}
      </div>
      <Note>
        Response options are educational scenario inputs, not optimized
        operational recommendations. The Simulation workbench calculates
        delivery risk and critical paths from explicit inputs.
      </Note>
    </>
  );
}
