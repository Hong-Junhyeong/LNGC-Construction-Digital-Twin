"use client";
import { useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useTwin } from "@/application/TwinContext";
export default function Timeline() {
  const sliderRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    sliderRef.current
      ?.querySelector('[role="slider"]')
      ?.setAttribute("aria-label", "3D construction playback step");
  }, []);
  const { playbackStep, setPlaybackStep, timelineMode, setPlayback } =
    useTwin();
  useEffect(() => {
    if (timelineMode !== "play") return;
    const id = setInterval(() => {
      if (document.hidden) return;
      if (playbackStep >= 60) {
        setPlayback("manual");
        return;
      }
      setPlaybackStep(playbackStep + 1);
      if (playbackStep + 1 >= 60) setPlayback("manual");
    }, 500);
    return () => clearInterval(id);
  }, [timelineMode, playbackStep, setPlaybackStep, setPlayback]);
  return (
    <section className="timeline-dock" aria-label="3D construction playback">
      <p className="eyebrow">3D CONSTRUCTION PLAYBACK · NORMALIZED</p>
      <div className="split">
        <div className="timeline-controls">
          <Button
            variant="outline"
            size="icon"
            aria-label={
              timelineMode === "play"
                ? "Pause construction playback"
                : "Play construction playback"
            }
            onClick={() => {
              if (playbackStep >= 60) setPlaybackStep(0);
              setPlayback(timelineMode === "play" ? "manual" : "play");
            }}
          >
            {timelineMode === "play" ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous step"
            onClick={() => {
              setPlayback("manual");
              setPlaybackStep(playbackStep - 1);
            }}
          >
            <SkipBack />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Next step"
            onClick={() => {
              setPlayback("manual");
              setPlaybackStep(playbackStep + 1);
            }}
          >
            <SkipForward />
          </Button>
          <span className="mono">
            STEP <strong>{String(playbackStep).padStart(2, "0")}</strong> / 60
          </span>
        </div>
        <Button
          aria-label="Reset construction playback"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPlayback("manual");
            setPlaybackStep(0);
          }}
        >
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>
      <Slider
        ref={sliderRef}
        aria-label="3D construction playback step"
        min={0}
        max={60}
        step={1}
        value={[playbackStep]}
        onValueChange={(v) => {
          setPlayback("manual");
          setPlaybackStep(v[0]);
        }}
      />
      <div className="timeline-labels">
        {[0, 10, 20, 30, 40, 50, 60].map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
      <div className="timeline-jumps">
        {[0, 30, 45, 60].map((step) => (
          <Button
            key={step}
            size="sm"
            variant={playbackStep === step ? "default" : "outline"}
            onClick={() => {
              setPlayback("manual");
              setPlaybackStep(step);
            }}
          >
            Step {step}
          </Button>
        ))}
      </div>
      <p className="caption">
        Normalized playback only · 2 steps/second. It controls block
        fabrication, staging, lift and erection poses. The project Master
        Schedule uses separate calendar dates and elapsed days.
      </p>
    </section>
  );
}
