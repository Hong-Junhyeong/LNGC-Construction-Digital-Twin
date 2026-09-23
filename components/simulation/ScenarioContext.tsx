"use client";
import Link from "next/link";
import { useTwin } from "@/application/TwinContext";
export default function ScenarioContext() {
  const {
    simulationResult: result,
    playbackStep,
    selectBlock,
    selectObject,
  } = useTwin();
  if (!result) return null;
  return (
    <section className="scenario-context" aria-label="Active scenario overlay">
      <div>
        <strong>{result.scenario?.name}</strong>
        <p>
          3D playback S{playbackStep} · Master Schedule delivery D
          {result.scenarioFinishDay} (+{result.incrementalDelayDays}d)
        </p>
        {result.scenario?.type === "WELDING_REWORK" && result.triggerPlaybackStep !== undefined && (
          <p className="scenario-quality-context">
            Quality overlay: {result.scenario.targetEntityId} · active from S
            {result.triggerPlaybackStep} until scenario reset
          </p>
        )}
      </div>
      <div className="scenario-impact-links">
        {result.blockImpacts.map((b) => (
          <button
            key={b.blockId}
            data-direct={b.direct}
            onClick={() => selectBlock(b.blockId)}
          >
            {b.blockId} +{b.maxFinishDelta}d
          </button>
        ))}
        {result.affectedEntityIds
          .filter((id) => /^WC0[12]$/.test(id))
          .map((id) => (
            <button key={id} onClick={() => selectObject(id)}>
              {id} system affected
            </button>
          ))}
      </div>
      <p className="caption">
        Overlay = maximum task finish shift in this scenario; shared
        HULL_GATE/OUTFIT may affect all blocks. 3D poses and playback step remain
        unchanged.{" "}
        <Link href="/simulation" className="text-link">
          Inspect / reset scenario ↗
        </Link>
      </p>
    </section>
  );
}
