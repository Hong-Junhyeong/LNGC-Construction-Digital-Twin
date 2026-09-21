"use client";
import { useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  StatusBadge,
  DataSourceBadge,
  Meter,
  Note,
  KpiCard,
} from "@/components/dashboard/Primitives";
import ScenarioContext from "@/components/simulation/ScenarioContext";
import DayContextBar from "@/components/dashboard/DayContextBar";
import MasterGantt from "./MasterGantt";
import { resources, allocations } from "@/data/repository";
import { masterProjectFinish, masterTasks } from "@/data/master-schedule";
import { useTwin } from "@/application/TwinContext";

export default function ProductionDashboard() {
  const {
    selectedBlock,
    selectBlock,
    operationalStates,
    operationalSummary,
    playbackStep,
    blockProgress,
  } = useTwin();
  const [search, setSearch] = useState("");
  const shown = operationalStates.filter((block) =>
    (block.blockId + " " + block.name + " " + block.zone)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const selected = operationalStates.find(
    (block) => block.blockId === selectedBlock,
  );
  return (
    <>
      <PageHeading
        eyebrow="PRODUCTION CONTROL / 03"
        title="From design release to delivery."
        description="A calendar-based LNGC Master Schedule is separated from the normalized 3D construction playback."
      />
      <DayContextBar />
      <ScenarioContext />
      <div className="kpi-grid production-kpis">
        <KpiCard
          label="Master delivery"
          value={masterProjectFinish}
          unit="DAY"
          type="ASSUMPTION"
          note="2025-01-06 project start · elapsed days"
        />
        <KpiCard
          label="3D block progress"
          value={blockProgress}
          unit="%"
          type="DERIVED"
          note={`B01–B09 · playback step ${playbackStep}`}
        />
        <KpiCard
          label="Material readiness"
          value={operationalSummary.materialReadiness}
          unit="%"
          type="MOCK"
          note="Available / required mock kits"
        />
        <KpiCard
          label="Master tasks"
          value={masterTasks.length}
          type="DERIVED"
          note="Design through final acceptance"
        />
      </div>
      <Tabs defaultValue="master">
        <div className="split section-toolbar">
          <TabsList>
            <TabsTrigger value="master">Master schedule</TabsTrigger>
            <TabsTrigger value="schedule">Block playback</TabsTrigger>
            <TabsTrigger value="materials">Material readiness</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>
          <span className="contract-key">
            MASTER CALENDAR ≠ 3D PLAYBACK STEP
          </span>
        </div>
        <TabsContent value="master">
          <Panel
            title="LNGC Master Schedule"
            kicker="PROJECT CALENDAR · FS NETWORK · CPM BASELINE"
            action={<DataSourceBadge type="ASSUMPTION" />}
          >
            <div className="schedule-separation">
              <div>
                <strong>Master Schedule</strong>
                <span>
                  D0–D{masterProjectFinish} · calendar dates · scenario CPM
                </span>
              </div>
              <div>
                <strong>3D Playback</strong>
                <span>Step 0–60 · geometry state only</span>
              </div>
            </div>
            <MasterGantt />
          </Panel>
          <Note>
            Durations and logic are educational assumptions informed by
            shipbuilding process research. They are not a shipyard contract
            schedule. Design, procurement and production intentionally overlap;
            commissioning remains a distinct downstream chain.
          </Note>
        </TabsContent>
        <TabsContent value="schedule">
          <Panel
            title={`Block production register · playback step ${playbackStep}`}
            kicker="NORMALIZED 3D PREVIEW + MOCK OPERATIONS"
            action={
              <input
                aria-label="Search blocks"
                className="search-input"
                placeholder="Search block or zone…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Block / zone",
                    "Progress",
                    "Stage",
                    "Material",
                    "Playback",
                    "Status",
                    "Details",
                  ].map((label) => (
                    <TableHead key={label}>{label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((block) => (
                  <TableRow
                    key={block.blockId}
                    data-selected={selectedBlock === block.blockId}
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
                      <div className="progress-cell">
                        <Meter
                          value={block.progress}
                          label={`${block.blockId} progress`}
                        />
                        <span>{block.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={block.stage} />
                    </TableCell>
                    <TableCell>
                      {block.material.readinessPct}%
                      <small className="cell-sub">
                        {block.material.status}
                      </small>
                    </TableCell>
                    <TableCell>
                      S{block.schedule.erectionStart}–
                      {block.schedule.erectionFinish}
                      <small className="cell-sub">
                        Master float: {block.schedule.floatDays}d
                      </small>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={block.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href="/twin"
                        className="text-link"
                        onClick={() => selectBlock(block.blockId)}
                      >
                        Twin ↗
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {shown.length === 0 && (
              <p className="empty-state">No matching blocks.</p>
            )}
          </Panel>
          {selected && (
            <Panel
              title={`${selected.blockId} · integrated context`}
              kicker="SAME RECORD USED BY TWIN AND QUALITY"
              className="section-gap"
              action={<DataSourceBadge type="MOCK" />}
            >
              <div className="selected-strip">
                <div>
                  <span>PRODUCTION</span>
                  <strong>{selected.stage.replaceAll("_", " ")}</strong>
                  <small>
                    {selected.progress}% plan · D{selected.recorded.dataDate}{" "}
                    recorded {selected.recorded.progressPct}%
                  </small>
                </div>
                <div>
                  <span>MATERIAL</span>
                  <strong>{selected.material.readinessPct}%</strong>
                  <small>
                    {selected.material.shortageQty} {selected.material.unit}{" "}
                    shortage
                  </small>
                </div>
                <div>
                  <span>WELDING</span>
                  <strong>{selected.welding.progressPct}%</strong>
                  <small>{selected.welding.status}</small>
                </div>
                <div>
                  <span>QUALITY</span>
                  <strong>{selected.qualityGate}</strong>
                  <small>NCR {selected.ncr.openCount} open</small>
                </div>
                <div>
                  <span>SCHEDULE</span>
                  <strong>
                    D{selected.schedule.plannedStart}–
                    {selected.schedule.plannedFinish}
                  </strong>
                  <small>
                    Erection critical:{" "}
                    {selected.schedule.criticalPath ? "YES" : "NO"}
                  </small>
                </div>
                <div>
                  <span>NDT / REWORK</span>
                  <strong>{selected.ndt.status}</strong>
                  <small>
                    {selected.rework.completedManHours}/
                    {selected.rework.plannedManHours} MH
                  </small>
                </div>
                <div>
                  <span>ACTUAL DATES</span>
                  <strong>Not recorded</strong>
                  <small>Plan preview; scenario shown separately</small>
                </div>
              </div>
              <Link className="text-link" href="/quality">
                Inspect {selected.blockId} quality chain ↗
              </Link>
            </Panel>
          )}
          {!selected && (
            <p className="empty-state">
              Select a block to view integrated details.
            </p>
          )}
        </TabsContent>
        <TabsContent value="materials">
          <Panel title="Material readiness" kicker="REQUIREMENT → LOT → BLOCK">
            <Table>
              <TableHeader>
                <TableRow>
                  {[
                    "Block",
                    "Readiness",
                    "Available / required",
                    "Shortage",
                    "Need by",
                    "Availability",
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
                    data-selected={selectedBlock === block.blockId}
                  >
                    <TableCell>
                      <button
                        className="block-link"
                        onClick={() => selectBlock(block.blockId)}
                      >
                        {block.blockId}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="progress-cell">
                        <Meter
                          value={block.material.readinessPct}
                          label={`${block.blockId} material readiness`}
                        />
                        <span>{block.material.readinessPct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {block.material.availableQty} /{" "}
                      {block.material.requiredQty} {block.material.unit}
                    </TableCell>
                    <TableCell>
                      {block.material.shortageQty} {block.material.unit}
                    </TableCell>
                    <TableCell>D{block.material.needByDay}</TableCell>
                    <TableCell>
                      {block.material.availableDay === null
                        ? "Unknown"
                        : `D${block.material.availableDay}`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={block.material.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
          <Note>
            Material values are educational mock inventory. B07 remains partial
            until its assumed availability day; no schedule propagation is
            performed.
          </Note>
        </TabsContent>
        <TabsContent value="resources">
          <div className="resource-grid">
            {resources.map((resource) => (
              <Panel
                title={resource.name}
                key={resource.resourceId}
                kicker={resource.type}
              >
                <div className="resource-capacity">
                  {resource.capacity}
                  <span>{resource.capacityUnit}</span>
                </div>
                <StatusBadge status={resource.status} />
                <p className="muted">
                  {
                    allocations.filter(
                      (item) => item.resourceId === resource.resourceId,
                    ).length
                  }{" "}
                  legacy fixture allocations · Master model maps erection and
                  WAPS slots separately
                </p>
                <DataSourceBadge type="ASSUMPTION" />
              </Panel>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
