"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useTwin } from "@/application/TwinContext";
import { masterTasks } from "@/data/master-schedule";
const Presence = createContext(1);
export const usePresence = () => useContext(Presence);
/** Installation visibility follows the existing package; no pre-install ghost solids. */
export default function SystemPresence({
  taskId,
  children,
}: {
  taskId: string;
  children: ReactNode;
}) {
  const { playbackStep } = useTwin();
  const aliases: Record<string, [number, number]> = {
    ACC: [41, 50],
    WC_ELECTRICAL: [54, 58],
    WC_CONTROL: [55, 59],
  };
  const task = masterTasks.find((t) => t.taskId === taskId);
  const start = task?.playbackStartStep ?? aliases[taskId]?.[0] ?? 45;
  const finish = task?.playbackEndStep ?? aliases[taskId]?.[1] ?? 60;
  const installed = playbackStep >= start;
  const opacity =
    0.65 +
    0.35 *
      Math.max(
        0,
        Math.min(1, (playbackStep - start) / Math.max(1, finish - start)),
      );
  return (
    <Presence.Provider value={opacity}>
      <group
        visible={installed}
        userData={{
          taskId,
          progressBasis: "3D_PLAYBACK_STEP",
          plannedGhost: false,
          installed,
        }}
      >
        {children}
      </group>
    </Presence.Provider>
  );
}
