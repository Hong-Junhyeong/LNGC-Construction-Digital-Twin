"use client";
import { useTwin } from "@/application/TwinContext";
import { DataSourceBadge } from "./Primitives";

export default function DayContextBar() {
  const { playbackStep, setPlaybackStep, cargoStates, outfittingState } =
    useTwin();
  const cargoStage =
    cargoStates[0]?.stage.replaceAll("_", " ") ?? "NOT STARTED";
  return (
    <div
      className="day-context"
      aria-label="Shared 3D construction playback step"
    >
      <div>
        <p className="eyebrow">3D CONSTRUCTION PLAYBACK</p>
        <strong>Step {playbackStep}</strong>
        <span>Normalized 0–60 visualization; not project calendar days.</span>
        <span className="playback-system-state">
          Cargo {cargoStage} · Outfitting{" "}
          {outfittingState.stage.replaceAll("_", " ")}
        </span>
      </div>
      <div className="day-context-actions">
        <label className="playback-step-input">
          Step
          <input aria-label="Playback step" type="number" min={0} max={60} step={1}
            value={playbackStep} onChange={(event) => setPlaybackStep(Number(event.target.value))} />
        </label>
        {[0, 30, 45, 60].map((step) => (
          <button
            key={step}
            className={playbackStep === step ? "active" : ""}
            aria-pressed={playbackStep === step}
            onClick={() => setPlaybackStep(step)}
          >
            S{step}
          </button>
        ))}
        <DataSourceBadge type="ASSUMPTION" />
      </div>
    </div>
  );
}
