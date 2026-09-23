"use client";
import Link from "next/link";
import { ChevronRight, ShieldAlert } from "lucide-react";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  PageHeading,
  Panel,
  KpiCard,
  StatusBadge,
  DataSourceBadge,
  Note,
} from "@/components/dashboard/Primitives";
import ScenarioContext from "@/components/simulation/ScenarioContext";
import DayContextBar from "@/components/dashboard/DayContextBar";
import { useTwin } from "@/application/TwinContext";

import { getQualityChain, qualityChainLabels } from "@/lib/twin/quality-chain";

export default function QualityDashboard() {
  const {
    selectedBlock,
    selectBlock,
    prepareScenario,
    operationalStates,
    operationalSummary,
    playbackStep,
  } = useTwin();
  const selected = operationalStates.find(
    (block) => block.blockId === selectedBlock,
  );
  if (!selected)
    return (
      <>
        <PageHeading
          eyebrow="QUALITY ASSURANCE / 04"
          title="Quality has a schedule impact."
          description="Choose a block to inspect its quality chain."
        />
        <DayContextBar />
        <p className="empty-state">
          Select a block with available quality data.
        </p>
        <div className="scenario-presets">
          {operationalStates.map((b) => (
            <button key={b.blockId} onClick={() => selectBlock(b.blockId)}>
              {b.blockId}
            </button>
          ))}
        </div>
      </>
    );
  const chain = getQualityChain(selected);
  const completedRework = operationalStates.reduce((sum, block) => sum + block.rework.completedManHours, 0);
  return (
    <>
      <PageHeading
        eyebrow="QUALITY ASSURANCE / 04"
        title="Quality has a schedule impact."
        description="Welding, NDT, NCR, rework and release are resolved from the same block record used by the Twin and Production page."
      />
      <DayContextBar />
      <ScenarioContext />
      <div className="kpi-grid quality-kpis">
        <KpiCard
          label="Quality gates"
          value={`${operationalSummary.releasedGates} / 9`}
          type="DERIVED"
          note={`3D playback step ${playbackStep}`}
        />
        <KpiCard
          label="NDT pass rate"
          value={operationalSummary.ndtPassRate ?? "—"}
          unit={operationalSummary.ndtPassRate === null ? "" : "%"}
          type="DERIVED"
          note="Mock inspections in current preview"
        />
        <KpiCard
          label="Open NCR"
          value={operationalSummary.openNcr}
          type="DERIVED"
          note="Current timeline overlay"
        />
        <KpiCard
          label="Planned rework"
          value={`${completedRework} / ${operationalSummary.plannedRework}`}
          unit="MH"
          type="DERIVED"
          note="Completed / planned effort · not schedule days"
        />
        <KpiCard
          label="Blocks on hold"
          value={operationalSummary.blocksOnHold}
          type="DERIVED"
          note="Blocked or in rework"
        />
      </div>
      <Panel
        title="Quality management chain"
        kicker={`${selected.blockId} · SHARED PLAYBACK S${playbackStep}`}
        action={<DataSourceBadge type="ASSUMPTION" />}
      >
        <div className="quality-chain operational-chain">
          {chain.map(({ title, status, detail }, index) => (
            <div key={title}>
              <span className="chain-node" data-state={status}>
                <small>{title}</small>
                <strong>{qualityChainLabels[status]}</strong>
                <span className="chain-detail">{detail}</span>
              </span>
              {index < chain.length - 1 && <ChevronRight size={18} aria-hidden="true" />}
            </div>
          ))}
        </div>
        <div className="quality-callout">
          <ShieldAlert size={22} />
          <div>
            <strong>
              {selected.blockId} · {selected.qualityGate}
            </strong>
            <p>
              {selected.ndt.status} · NCR {selected.ncr.openCount} open ·{" "}
              {selected.rework.completedManHours}/
              {selected.rework.plannedManHours} MH rework · enter an explicit
              repair allowance in Simulation to calculate delivery impact.
            </p>
          </div>
          <Link
            href="/simulation"
            className="primary-link"
            onClick={() => {
              prepareScenario("WELDING_REWORK", selected.blockId);
            }}
          >
            Prepare scenario ↗
          </Link>
        </div>
      </Panel>
      <Panel
        title="Block quality register · mock operational fixture"
        kicker={`INDEPENDENT RECORD · 3D PLAYBACK S${playbackStep}`}
        className="section-gap"
      >
        <Table>
          <TableHeader>
            <TableRow>
              {[
                "Block",
                "Welding",
                "NDT",
                "Pass rate",
                "NCR open / closed",
                "Rework",
                "Quality gate",
                "Status",
              ].map((label) => (
                <TableHead key={label}>{label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {operationalStates.map((block) => (
              <TableRow
                key={block.blockId}
                data-selected={block.blockId === selected.blockId}
              >
                <TableCell>
                  <button
                    className="block-link"
                    onClick={() => selectBlock(block.blockId)}
                  >
                    {block.blockId}
                  </button>
                  <small className="cell-sub">{block.name}</small>
                </TableCell>
                <TableCell>
                  {block.welding.progressPct}%
                  <small className="cell-sub">
                    {block.welding.completedWelds}/{block.welding.weldCount}
                  </small>
                </TableCell>
                <TableCell>
                  <StatusBadge status={block.ndt.status} />
                </TableCell>
                <TableCell>
                  {block.ndt.passRate === null ? "—" : `${block.ndt.passRate}%`}
                </TableCell>
                <TableCell>
                  {block.ncr.openCount} / {block.ncr.closedCount}
                </TableCell>
                <TableCell>
                  {block.rework.completedManHours} /{" "}
                  {block.rework.plannedManHours} MH
                </TableCell>
                <TableCell>
                  <StatusBadge status={block.qualityGate} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={block.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <Panel
        title={`${selected.blockId} · release detail`}
        kicker="SAME BLOCK ID ACROSS ALL VIEWS"
        className="section-gap"
        action={<DataSourceBadge type="MOCK" />}
      >
        <div className="selected-strip quality-strip">
          <div>
            <span>WELDING</span>
            <strong>{selected.welding.progressPct}%</strong>
            <small>{selected.welding.pendingWelds} pending</small>
          </div>
          <div>
            <span>NDT</span>
            <strong>{selected.ndt.status}</strong>
            <small>
              {selected.ndt.passCount}/{selected.ndt.inspectedCount} pass
            </small>
          </div>
          <div>
            <span>NCR</span>
            <strong>{selected.ncr.totalCount}</strong>
            <small>{selected.ncr.openCount} open</small>
          </div>
          <div>
            <span>REWORK</span>
            <strong>{selected.rework.completedManHours} / {selected.rework.plannedManHours} MH</strong>
            <small>Completed / planned</small>
          </div>
          <div>
            <span>RELEASE</span>
            <strong>{selected.qualityGate}</strong>
            <small>Stage {selected.stage.replaceAll("_", " ")}</small>
          </div>
        </div>
      </Panel>
      <Note>
        Simulation and mock production data only. No actual yard welding, NDT,
        inventory or NCR records are represented.{" "}
        <Link href="/twin" className="text-link">
          View {selected.blockId} in Twin ↗
        </Link>
      </Note>
    </>
  );
}
