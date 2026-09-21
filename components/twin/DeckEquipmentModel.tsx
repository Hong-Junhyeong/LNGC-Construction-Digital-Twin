"use client";
import { useTwin } from "@/application/TwinContext";
import { MATERIALS as M } from "@/lib/three/materials";
import { TANKS, xAt } from "@/lib/three/constants";
import { deckSurface } from "@/lib/three/geometry";
import { Box, Cylinder, Wire } from "./ModelParts";
import type { OutfittingStage } from "@/types/domain";

const order: OutfittingStage[] = [
  "NOT_STARTED",
  "PIPING",
  "EQUIPMENT",
  "ELECTRICAL",
  "DECK_OUTFITTING",
  "SAFETY_SYSTEM",
  "COMPLETED",
];

export default function DeckEquipmentModel() {
  const { outfittingState } = useTwin(),
    rank = order.indexOf(outfittingState.stage);
  return (
    <group
      name="Outfitting"
      userData={{
        geometrySource: "ASSUMPTION",
        selectable: false,
        outfittingState: outfittingState.stage,
        progress: outfittingState.progress,
      }}
    >
      {rank >= 1 && (
        <group name="OUTFIT/PIPING">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box
                at={[xAt(0.48), 33.4, side * 5]}
                size={[176, 0.65, 0.65]}
                color={M.pipe}
              />
              {Array.from(
                { length: 17 },
                (_, i) => xAt(0.48) - 88 + i * 11,
              ).map((x) => {
                const base = deckSurface(1 - x / 294.9, side * 5),
                  top = 33.075;
                return (
                  <group name="PIPE_SUPPORT" key={x}>
                    <Box
                      at={[x, (base + top) / 2, side * 5]}
                      size={[0.45, top - base, 1.5]}
                      color={M.steel}
                    />
                  </group>
                );
              })}
              <Box
                at={[xAt(0.5), 33.4, side * 12]}
                size={[0.65, 0.65, 14]}
                color={M.pipe}
              />
              {[5, 12, 19].map((z) => {
                const base = deckSurface(0.5, z),
                  top = 33.075;
                return (
                  <Box
                    key={z}
                    at={[xAt(0.5), (base + top) / 2, side * z]}
                    size={[1, top - base, 0.45]}
                    color={M.steel}
                  />
                );
              })}
            </group>
          ))}
          {TANKS.map((t) => (
            <Box
              key={t.id}
              at={[xAt((t.start + t.end) / 2), 33.4, 0]}
              size={[0.5, 0.5, 10]}
              color={M.pipe}
            />
          ))}
        </group>
      )}
      {rank >= 2 && (
        <group name="OUTFIT/EQUIPMENT">
          {[-1, 1].map((side) => (
            <group key={side}>
              <Box
                at={[xAt(0.5), 28, side * 20]}
                size={[10, 3, 4]}
                color={M.steel}
              />
              {[0.055, 0.965].map((u) => {
                const base = deckSurface(u, side * 5);
                return (
                  <group key={u}>
                    <Box
                      at={[xAt(u), base + 0.3, side * 5]}
                      size={[5, 0.6, 3.5]}
                      color={M.steel}
                    />
                    <Cylinder
                      at={[xAt(u), base + 1.45, side * 5]}
                      radius={1.2}
                      height={1.7}
                      color={M.blue}
                    />
                  </group>
                );
              })}
            </group>
          ))}
        </group>
      )}
      {rank >= 3 && (
        <group name="OUTFIT/ELECTRICAL">
          {[-1, 1].map((side) => (
            <Box
              key={side}
              at={[xAt(0.5), 31.2, side * 16]}
              size={[142, 0.28, 0.7]}
              color={M.electrical}
            />
          ))}
        </group>
      )}
      {rank >= 4 && (
        <group name="OUTFIT/DECK">
          {[-1, 1].map((side) => (
            <Wire
              key={side}
              points={[
                [xAt(0.19), 28, side * 22],
                [xAt(0.8), 28, side * 22],
                [xAt(0.19), 29, side * 22],
                [xAt(0.8), 29, side * 22],
                ...[0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].flatMap((u) => [
                  [xAt(u), 26.5, side * 22],
                  [xAt(u), 29, side * 22],
                ]),
              ]}
            />
          ))}
        </group>
      )}
      {rank >= 5 && (
        <group name="OUTFIT/SAFETY_SYSTEM">
          {TANKS.flatMap((t) =>
            [-1, 1].map((side) => (
              <Box
                key={t.id + side}
                at={[
                  xAt((t.start + t.end) / 2),
                  32.2,
                  side * (t.width / 2 + 1.2),
                ]}
                size={[1.1, 1.1, 0.7]}
                color={M.safety}
              />
            )),
          )}
          <Box at={[xAt(0.16), 28.5, 0]} size={[4, 4, 5]} color={M.white} />
          <Box
            at={[xAt(0.16) + 2.075, 29, 0]}
            size={[0.15, 1.2, 4]}
            color={M.glass}
          />
        </group>
      )}
    </group>
  );
}
