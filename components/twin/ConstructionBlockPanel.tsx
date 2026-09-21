"use client";
import Link from "next/link";
import { useTwin } from "@/application/TwinContext";
import {
  DataSourceBadge,
  Meter,
  StatusBadge,
} from "@/components/dashboard/Primitives";

const value = (item: number | null, suffix = "") =>
  item === null ? "Not calculated" : `${item}${suffix}`;

export default function ConstructionBlockPanel() {
  const { selectedBlock, operationalStates, playbackStep, prepareScenario } =
    useTwin();
  const block = operationalStates.find(
    (item) => item.blockId === selectedBlock,
  );
  if (!block)
    return (
      <aside className="selection-panel">
        <h2>Block data unavailable</h2>
        <p>Select another block to inspect its operational context.</p>
      </aside>
    );
  const displayStatus = block.status.replaceAll("_", " ");
  return (
    <aside
      className="selection-panel operational-panel"
      aria-label={`${block.blockId} integrated details`}
    >
      <div className="split">
        <p className="eyebrow">INTEGRATED BLOCK · STEP {playbackStep}</p>
        <DataSourceBadge type="MOCK" />
      </div>
      <div className="selected-title">
        <h2>{block.blockId}</h2>
        <span>{block.blockId}/SHELL</span>
      </div>
      <p className="muted">{block.name}</p>
      <StatusBadge status={displayStatus} />

      <div className="detail-section primary-detail">
        <div className="split">
          <h3>Production</h3>
          <strong>{block.progress}%</strong>
        </div>
        <Meter
          value={block.progress}
          label={`${block.blockId} planned progress`}
        />
        <dl>
          <dt>Stage</dt>
          <dd>{block.stage.replaceAll("_", " ")}</dd>
          <dt>Playback span</dt>
          <dd>
            S{block.schedule.plannedStart}–S{block.schedule.plannedFinish}
          </dd>
          <dt>Erection</dt>
          <dd>
            S{block.schedule.erectionStart}–S{block.schedule.erectionFinish}
          </dd>
          <dt>Erection float</dt>
          <dd>{value(block.schedule.floatDays, " days")}</dd>
        </dl>
      </div>

      <div className="operational-cards">
        <section>
          <span>MATERIAL</span>
          <strong>{block.material.readinessPct}%</strong>
          <small>
            {block.material.status} · shortage {block.material.shortageQty}{" "}
            {block.material.unit}
          </small>
        </section>
        <section>
          <span>WELDING</span>
          <strong>{block.welding.progressPct}%</strong>
          <small>
            {block.welding.completedWelds} / {block.welding.weldCount} weld
            units
          </small>
        </section>
        <section>
          <span>NDT</span>
          <strong>{block.ndt.status}</strong>
          <small>
            {block.ndt.passRate === null
              ? "No inspections"
              : `${block.ndt.passRate}% pass`}
          </small>
        </section>
        <section>
          <span>QUALITY</span>
          <strong>{block.qualityGate}</strong>
          <small>
            NCR {block.ncr.openCount} open / {block.ncr.closedCount} closed
          </small>
        </section>
      </div>

      <div className="detail-section">
        <h3>Rework & schedule context</h3>
        <dl>
          <dt>Rework</dt>
          <dd>
            {block.rework.completedManHours} / {block.rework.plannedManHours} MH
          </dd>
          <dt>Erection critical</dt>
          <dd>
            {block.schedule.criticalPath === null
              ? "Not calculated"
              : block.schedule.criticalPath
                ? "YES"
                : "NO"}
          </dd>
          <dt>Predecessor</dt>
          <dd>{block.schedule.predecessors.join(", ") || "—"}</dd>
          <dt>Successor</dt>
          <dd>{block.schedule.successors.join(", ") || "—"}</dd>
          <dt>Assigned resource</dt>
          <dd>
            {block.resources.map((item) => item.name).join(", ") ||
              "Not assigned"}
          </dd>
        </dl>
      </div>
      <p className="data-contract-note">
        <DataSourceBadge type="DERIVED" /> playback S{playbackStep} ·{" "}
        <DataSourceBadge type="MOCK" /> recorded D{block.recorded.dataDate}:{" "}
        {block.recorded.progressPct}% · baseline erection CPM
      </p>
      <div className="split">
        <Link className="text-link" href="/production">
          Production ↗
        </Link>
        <Link className="text-link" href="/quality">
          Quality ↗
        </Link>
      </div>
      <Link
        className="primary-link"
        href="/simulation"
        onClick={() => prepareScenario("WELDING_REWORK", block.blockId)}
      >
        Prepare what-if input
      </Link>
    </aside>
  );
}
