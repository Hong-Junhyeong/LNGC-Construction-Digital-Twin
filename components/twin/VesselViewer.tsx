"use client";
import dynamic from "next/dynamic";
import {
  Component,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from "react";
import { RotateCcw, Maximize2, Box, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTwin } from "@/application/TwinContext";
import { OBJECTS } from "@/lib/three/constants";
import type { CameraView } from "@/lib/three/camera";
const Scene = dynamic(() => import("./VesselScene"), {
  ssr: false,
  loading: () => <div className="viewer-loading">Loading vessel geometry…</div>,
});
let webglAvailable: boolean | undefined;
function supportsWebGL() {
  if (webglAvailable === undefined) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      webglAvailable = !!gl;
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglAvailable = false;
    }
  }
  return webglAvailable;
}
const subscribe = () => () => {};
function SafeScene(props: ComponentProps<typeof Scene>) {
  const available = useSyncExternalStore(subscribe, supportsWebGL, () => null);
  if (available === null)
    return <div className="viewer-loading">Checking 3D support…</div>;
  if (!available)
    return (
      <div className="viewer-loading" role="status">
        <Box size={32} />
        <strong>WebGL 2 is unavailable in this browser.</strong>
        <p>
          Enable hardware acceleration or open this project in a WebGL-enabled
          desktop browser.
        </p>
        <p>
          The 3D model cannot be displayed here. Object metadata and all
          production pages remain accessible.
        </p>
      </div>
    );
  return <Scene {...props} />;
}
class ViewerBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="viewer-loading" role="alert">
        <strong>3D rendering is unavailable.</strong>
        <p>
          Enable browser hardware acceleration and reload. Production pages
          remain available.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
/** Client-only adapter preserves the P05 viewer slot and shared production selection. */
export default function VesselViewer({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [cutaway, setCutaway] = useState(false),
    [view, setView] = useState<CameraView>("reset"),
    [revision, setRevision] = useState(0),
    [debug, setDebug] = useState(false);
  const {
    selectedObject,
    selectObject,
    playbackStep,
    cargoStates,
    outfittingState,
  } = useTwin();
  function changeView(v: CameraView) {
    setView(v);
    setRevision((r) => r + 1);
  }
  return (
    <section
      className={"engineering-viewer " + (compact ? "compact" : "")}
      aria-label="Interactive LNG carrier viewer"
    >
      <div className="viewer-topline">
        <span>
          174K MEMBRANE LNGC <span className="viewer-divider">/</span> 2 × WIND
          CHALLENGER
        </span>
        <span
          className="source source-assumption"
          title="Educational geometry, including generic bulb and propulsion. Actual underwater geometry and shaft count are unverified."
        >
          ASSUMPTION · GEOMETRY
        </span>
      </div>
      <div
        className="vessel-canvas"
        role="img"
        aria-label="Interactive 3D LNG carrier. Drag to orbit, scroll to zoom, right drag to pan. Use the object selector for keyboard selection."
      >
        <ViewerBoundary>
          <SafeScene
            cutaway={cutaway}
            view={view}
            revision={revision}
            debug={debug}
          />
        </ViewerBoundary>
        <span className="viewer-axis-note">+X BOW · +Y UP · +Z STBD</span>
      </div>
      <div className="viewer-controls">
        <div className="viewer-buttons">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeView("reset")}
            aria-label="Reset view"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => changeView("fit")}>
            <Maximize2 size={14} />
            Fit
          </Button>
          {!compact &&
            (["side", "front", "top"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "outline"}
                size="sm"
                onClick={() => changeView(v)}
              >
                {v[0].toUpperCase() + v.slice(1)}
              </Button>
            ))}
          <Button
            variant={cutaway ? "default" : "outline"}
            size="sm"
            aria-pressed={cutaway}
            onClick={() => setCutaway((c) => !c)}
          >
            <Layers size={14} />
            {cutaway ? "Cargo layers on" : "Cutaway"}
          </Button>
        </div>
        <label className="viewer-object-select">
          <Box size={14} />
          <select
            aria-label="Select vessel object"
            value={selectedObject ?? ""}
            onChange={(e) => selectObject(e.target.value || null)}
          >
            <option value="">Select object…</option>
            {OBJECTS.map((o) => (
              <option key={o.objectId} value={o.objectId}>
                {o.entityId} · {o.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="viewer-help">
        <span title="WC display assumption: 49 m deck-to-sail-top when deployed; actual height datum is unverified. Installation and deployment use normalized playback steps.">
          Drag orbit · Scroll zoom · Right-drag pan
        </span>
        {!compact && (
          <button onClick={() => setDebug((d) => !d)} aria-pressed={debug}>
            Axes {debug ? "on" : "off"}
          </button>
        )}
        <span>
          S{playbackStep} · Cargo {cargoStates[0]?.stage.replaceAll("_", " ")} ·
          Outfit {outfittingState.stage.replaceAll("_", " ")}
        </span>
      </div>
      <p className="viewer-geometry-note">
        Simplified geometry · Bulb / propulsion / tank layout: ASSUMPTION · WC:
        install S52–57, deploy S56+ · assumed sail top 49 m above deck
      </p>
    </section>
  );
}
