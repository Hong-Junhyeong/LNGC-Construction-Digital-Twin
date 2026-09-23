"use client";

import { ArrowRight, CalendarDays, ChevronRight, Package, ShieldAlert, Wind } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTwin } from "@/application/TwinContext";
import { masterTasks } from "@/data/master-schedule";
import VesselViewer from "@/components/twin/VesselViewer";
import ScenarioContext from "@/components/simulation/ScenarioContext";
import DayContextBar from "./DayContextBar";
import { DataSourceBadge, Meter, Panel, TextLink } from "./Primitives";

const processFlow = ["3D Vessel", "Production Data", "Quality / Schedule", "Delay Propagation", "Critical Path", "What-If", "Delivery Impact"];
const heroActions = [
  { label: "Open digital twin", href: "/twin", primary: true },
  { label: "Production", href: "/production", primary: false },
  { label: "Quality", href: "/quality", primary: false },
  { label: "Run what-if", href: "/simulation", primary: false },
] as const;

export default function Overview() {
  const { selectBlock, baselineSchedule, prepareScenario, playbackStep, overallProgress, blockProgress, cargoStates, outfittingState, operationalSummary: summary, operationalStates: blocks } = useTwin();
  const wcLift = masterTasks.find((task) => task.taskId === "WC_LIFT")!;
  const cargoProgress = Math.round(cargoStates.reduce((sum, state) => sum + state.progress, 0) / cargoStates.length);
  const currentState = playbackStep === 60 ? "COMPLETED" : blocks.some((block) => block.status === "QUALITY_HOLD") ? "QUALITY HOLD" : blocks.some((block) => block.status === "REWORK") ? "REWORK" : playbackStep === 0 ? "NOT STARTED" : "IN PROGRESS";

  return (
    <div className="overview-redesign">
      <section className="overview-hero" aria-labelledby="overview-title">
        <figure className="hero-vessel" aria-label="Reference vessel visual">
          <Image src="/images/reference-vessel.png" fill sizes="(max-width: 820px) 100vw, calc(100vw - 208px)" priority unoptimized alt="Supplied conceptual image of a green-hulled LNG carrier with two forward Wind Challenger sails" />
          <figcaption><span>REFERENCE VESSEL</span><strong>174K MEMBRANE LNGC</strong><small>Conceptual visual · geometry unverified</small></figcaption>
        </figure>
        <div className="hero-copy">
          <p className="eyebrow">PRODUCTION CONTROL / 01</p>
          <h1 id="overview-title">LNGC Production Digital Twin</h1>
          <p className="hero-statement">From construction data to production decisions.</p>
          <p className="hero-metadata">174K membrane LNG carrier · 9 simulation blocks · 2 Wind Challenger systems</p>
          <div className="hero-state" aria-label="Current vessel state">
            <span>S{playbackStep}</span><i aria-hidden="true" /><span>{currentState}</span><i aria-hidden="true" /><span>{summary.releasedGates} / 9 GATES</span>
          </div>
          <div className="hero-actions">
            {heroActions.map((action) => (
              <Link className={action.primary ? "primary-link" : "secondary-link"} href={action.href} key={action.href}>
                {action.label}{action.primary && <ArrowRight size={15} aria-hidden="true" />}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ScenarioContext />

      <section className="overview-control-strip" aria-label="Construction playback and current production overview">
        <div className="overview-playback"><DayContextBar /></div>
        <div className="overview-kpi-strip">
          <div>
            <span className="kpi-strip-value">{overallProgress}<small>%</small></span><strong>Overall progress</strong><small>S{playbackStep} · block {blockProgress}%</small>
            <Meter value={overallProgress} label="Overall planned progress" /><DataSourceBadge type="DERIVED" />
          </div>
          <div><span className="kpi-strip-value"><small>D</small>{baselineSchedule.finishDay}</span><strong>Baseline delivery</strong><small>Educational schedule</small><DataSourceBadge type="ASSUMPTION" /></div>
          <div><span className="kpi-strip-value">{summary.materialReadiness}<small>%</small></span><strong>Material readiness</strong><small>Mock availability at S{playbackStep}</small><DataSourceBadge type="DERIVED" /></div>
          <div><span className="kpi-strip-value">{summary.releasedGates}<small> / 9</small></span><strong>Quality gates</strong><small>{summary.openNcr} open NCR · {summary.plannedRework} MH plan</small><DataSourceBadge type="DERIVED" /></div>
        </div>
      </section>

      <section className="overview-section twin-priority-section" aria-labelledby="twin-title">
        <div className="overview-twin-column">
          <div className="section-title-row"><div><p className="eyebrow">SPATIAL CONTEXT</p><h2 id="twin-title">Vessel &amp; block workspace</h2></div><TextLink href="/twin">Explore in 3D twin</TextLink></div>
          <VesselViewer />
          <div className="system-readout" aria-label="Current system progress">
            <span><strong>{blockProgress}%</strong> Blocks</span><span><strong>{cargoProgress}%</strong> Cargo containment</span><span><strong>{outfittingState.progress}%</strong> Outfitting</span>
          </div>
        </div>

        <aside className="priority-panel" aria-labelledby="attention-title">
          <div className="section-title-row"><div><p className="eyebrow">ATTENTION REQUIRED</p><h2 id="attention-title">Items to review</h2></div><span className="count-chip">04</span></div>
          <Link href="/quality" className="priority-item issue" onClick={() => selectBlock("B04")}><ShieldAlert size={17} aria-hidden="true" /><span><strong>B04 · Quality release</strong><small>{blocks.find((b) => b.blockId === "B04")?.qualityGate ?? "Unavailable"} · NCR review</small><em>Inspect quality chain</em></span><ChevronRight size={15} aria-hidden="true" /></Link>
          <Link href="/production" className="priority-item warning" onClick={() => selectBlock("B07")}><Package size={17} aria-hidden="true" /><span><strong>B07 · Outfitting material</strong><small>{blocks.find((b) => b.blockId === "B07")?.material.readinessPct ?? "—"}% ready · need-by D40</small><em>Review material status</em></span><ChevronRight size={15} aria-hidden="true" /></Link>
          <Link href="/simulation" className="priority-item marine" onClick={() => prepareScenario("WIND_CHALLENGER_DELAY", "WC02")}><Wind size={17} aria-hidden="true" /><span><strong>Wind Challenger installation</strong><small>Lift window D{wcLift.baselineStartDay}–D{wcLift.baselineFinishDay}</small><em>Explore delay scenario</em></span><ChevronRight size={15} aria-hidden="true" /></Link>
          <Link href="/twin" className="priority-item warning" onClick={() => selectBlock("B04")}><CalendarDays size={17} aria-hidden="true" /><span><strong>B04 · Critical erection</strong><small>E-B04 · zero baseline float</small><em>Review spatial context</em></span><ChevronRight size={15} aria-hidden="true" /></Link>
          <div className="priority-footnote"><DataSourceBadge type="MOCK" /><span>Recorded and assumed evidence is identified throughout.</span></div>
        </aside>
      </section>

      <section className="overview-section production-control" aria-labelledby="production-control-title">
        <div className="section-title-row production-control-head"><div><p className="eyebrow">NEXT MANAGEMENT LAYER</p><h2 id="production-control-title">Production Control</h2></div><TextLink href="/production">Open production</TextLink></div>
        <div className="overview-bottom">
          <Panel title="Block production" kicker={`PLAYBACK STEP ${playbackStep} · B01–B09`} action={<DataSourceBadge type="DERIVED" />}>
            <div className="mini-blocks">{blocks.map((block) => <Link href="/twin" onClick={() => selectBlock(block.blockId)} key={block.blockId}><div className="split"><strong>{block.blockId}</strong><span>{block.progress}%</span></div><Meter value={block.progress} label={`${block.blockId} progress`} /><small>{block.stage.replaceAll("_", " ")}</small></Link>)}</div>
          </Panel>
          <Panel title="Baseline critical sequence" kicker="CALCULATED CPM · MASTER DELIVERY" action={<DataSourceBadge type="DERIVED" />}>
            <div className="path-sequence">{baselineSchedule.criticalPaths[0].map((task, index) => <span key={task} className={task === "E-B04" ? "highlight" : ""}>{task}{index < baselineSchedule.criticalPaths[0].length - 1 && <ChevronRight size={13} aria-hidden="true" />}</span>)}</div>
            <div className="delivery-line"><CalendarDays size={22} aria-hidden="true" /><div><strong>Master delivery gate · D{baselineSchedule.finishDay}</strong><p>{baselineSchedule.criticalPaths.length} calculated critical path through final acceptance.</p></div></div>
            <TextLink href="/insight">Review production insights</TextLink>
          </Panel>
        </div>
      </section>

      <section className="management-flow" aria-labelledby="management-flow-title">
        <div><p className="eyebrow">DECISION SUPPORT MODEL</p><h2 id="management-flow-title">How management uses the twin</h2><small>Prototype with simulated data · no live ERP, MES or IoT connection.</small></div>
        <ol>{processFlow.map((step) => <li key={step}>{step}</li>)}</ol>
        <nav aria-label="Supporting workspaces"><Link href="/quality">Quality</Link><Link href="/simulation">What-If</Link><Link href="/insight">Insight</Link></nav>
      </section>
    </div>
  );
}
