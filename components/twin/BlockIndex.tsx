"use client";
import { useTwin } from "@/application/TwinContext";
import {
  STAGE_COLORS,
  INDICATOR_COLORS,
  STAGE_ORDER,
} from "@/lib/twin/block-state";
export default function BlockIndex() {
  const {
    blockStates,
    operationalStates,
    selectedObject,
    selectBlock,
    playbackStep,
    blockProgress,
  } = useTwin();
  const active = blockStates.find(
    (b) => selectedObject === b.blockId + "/SHELL",
  );
  return (
    <section className="construction-summary" aria-label="Construction state">
      <div className="split">
        <div>
          <p className="eyebrow">SIMULATION BLOCKS · STEP {playbackStep}</p>
          <h3>Planned block scope · {blockProgress}%</h3>
        </div>
        <span className="source source-derived">DERIVED · ASSUMED PLAN</span>
      </div>
      <div className="construction-index">
        {blockStates.map((b) => {
          const op = operationalStates.find(
            (item) => item.blockId === b.blockId,
          );
          return (
            <button
              key={b.blockId}
              aria-label={"Select " + b.blockId + " simulation block"}
              aria-pressed={selectedObject === b.blockId + "/SHELL"}
              onClick={() => selectBlock(b.blockId)}
              style={{
                borderTopColor:
                  b.quality === "QUALITY_HOLD"
                    ? INDICATOR_COLORS.hold
                    : b.quality === "REWORK"
                      ? INDICATOR_COLORS.rework
                      : STAGE_COLORS[b.stage],
              }}
            >
              <strong>{b.blockId}</strong>
              <span>
                {b.quality === "NONE"
                  ? b.stage.replaceAll("_", " ")
                  : b.quality.replaceAll("_", " ")}
              </span>
              <small>
                {b.progress}%
                {op?.ncr.openCount ? ` · NCR ${op.ncr.openCount}` : ""}
              </small>
            </button>
          );
        })}
      </div>
      <div className="twin-legend">
        <span>
          <i style={{ background: STAGE_COLORS.NOT_STARTED }} />
          Not started
        </span>
        <span>
          <i style={{ background: STAGE_COLORS.ERECTION }} />
          In progress
        </span>
        <span>
          <i style={{ background: STAGE_COLORS.COMPLETED }} />
          Completed
        </span>
        <span>
          <i style={{ background: INDICATOR_COLORS.hold }} />
          Quality hold
        </span>
        <span>
          <i style={{ background: INDICATOR_COLORS.rework }} />
          Rework
        </span>
        <span>
          <i style={{ background: INDICATOR_COLORS.delayed }} />
          Scenario delay · amber overlay
        </span>
      </div>
      {active && (
        <div
          className="construction-flow"
          aria-label="Selected block construction flow"
        >
          <strong>{active.blockId}</strong>
          {STAGE_ORDER.map((s) => (
            <span
              key={s}
              aria-current={active.stage === s ? "step" : undefined}
            >
              {s.replaceAll("_", " ")}
            </span>
          ))}
        </div>
      )}
      <p className="caption muted">
        Equal task-weighted preview, not measured progress. ERECTED ≠ block
        completed. B04 hold S24–26 / rework S26–29 is a display assumption;
        scenario effects appear as a separate overlay.
      </p>
    </section>
  );
}
