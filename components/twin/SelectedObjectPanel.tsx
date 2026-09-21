"use client";
import { Box } from "lucide-react";
import { useTwin } from "@/application/TwinContext";
import ConstructionBlockPanel from "./ConstructionBlockPanel";
import { DataSourceBadge } from "@/components/dashboard/Primitives";
import { objectById } from "@/lib/three/constants";
function GeometrySelection() {
  const { selectedObject, selectBlock, playbackStep, cargoStates } = useTwin();
  const object = objectById(selectedObject);
  if (!object)
    return (
      <aside className="selection-panel">
        <Box />
        <h2>Select a vessel component</h2>
        <p className="muted">
          Click the model or use the object selector to inspect its production
          context.
        </p>
      </aside>
    );
  const cargoState = cargoStates.find(
    (state) => state.entityId === object.entityId,
  );
  return (
    <aside className="selection-panel">
      <div className="split">
        <p className="eyebrow">SELECTED OBJECT</p>
        <DataSourceBadge type="ASSUMPTION" />
      </div>
      <div className="selected-title">
        <h2>{object.entityId}</h2>
      </div>
      <p className="muted">{object.name}</p>
      <dl className="object-metadata">
        <dt>Object ID</dt>
        <dd>{object.objectId}</dd>
        <dt>Type</dt>
        <dd>{object.objectType.replaceAll("_", " ")}</dd>
        <dt>Geometry</dt>
        <dd>Modeling assumption</dd>
        <dt>Installation status</dt>
        <dd>
          {cargoState ? cargoState.stage.replaceAll("_", " ") : "Not evaluated"}
        </dd>
        <dt>Production progress</dt>
        <dd>
          {cargoState ? `${cargoState.progress}% visual` : "Not calculated"}
        </dd>
      </dl>
      {object.objectType === "WC_COMPONENT" ? (
        <div className="detail-section">
          <h3>Wind Challenger · WAPS</h3>
          <p className="muted">
            3-stage telescopic hard sail. Two systems and the public 49 m / ~15
            m design envelope are transcribed from P02. Mounting coordinates,
            stage overlap and cabinet positions are assumptions. The display
            uses an assumed 49 m deck-to-sail-top datum; the actual datum is
            unverified.
          </p>
          <dl>
            <dt>Display</dt>
            <dd>
              {playbackStep < 52
                ? "Not installed"
                : playbackStep < 56
                  ? "Stowed"
                  : playbackStep < 59
                    ? "Test deployment"
                    : "Fully deployed"}
            </dd>
            <dt>Host block</dt>
            <dd>B02</dd>
            <dt>Actuation</dt>
            <dd>Unknown</dd>
          </dl>
          <p className="muted">
            No hydraulic mesh: actual drive arrangement is unverified.
          </p>
        </div>
      ) : object.objectType === "TANK" ? (
        <div className="detail-section">
          <h3>Membrane containment</h3>
          <p className="muted">
            Hull-supported, chamfered volume beneath a weather cover. Four tanks
            and their boundaries are modeling assumptions, not a confirmed
            vessel tank plan. Use Cutaway to inspect the internal volume.
          </p>
          <dl>
            <dt>Playback state</dt>
            <dd>{cargoState?.stage.replaceAll("_", " ") ?? "NOT STARTED"}</dd>
            <dt>Visual progress</dt>
            <dd>{cargoState?.progress ?? 0}%</dd>
            <dt>Actual capacity</dt>
            <dd>Unknown</dd>
            <dt>Related blocks</dt>
            <dd>{object.relatedBlockIds?.join(" · ")}</dd>
          </dl>
        </div>
      ) : (
        <div className="detail-section">
          <h3>Aft arrangement</h3>
          <p className="muted">
            Simplified engineering envelope. Detailed deck levels, windows,
            machinery and funnel arrangement are assumptions.
          </p>
        </div>
      )}
      <div className="detail-section">
        <h3>Production context</h3>
        {(object.relatedBlockIds ?? [object.hostBlockId ?? "B08"]).map((id) => (
          <button
            key={id}
            className="secondary-link object-context-button"
            onClick={() => selectBlock(id)}
          >
            Inspect {id} block
          </button>
        ))}
      </div>
      <p className="caption muted">
        Systems are hidden before their assumed playback phase. Rendering is a
        normalized planned preview; historical mock operations remain
        independent.
      </p>
    </aside>
  );
}
export default function SelectedObjectPanel() {
  const { selectedObject } = useTwin();
  return selectedObject?.endsWith("/SHELL") ? (
    <ConstructionBlockPanel />
  ) : (
    <GeometrySelection />
  );
}
