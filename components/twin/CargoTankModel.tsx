"use client";
import { useMemo, useEffect } from "react";
import { Edges } from "@react-three/drei";
import { useTwin } from "@/application/TwinContext";
import { TANKS, xAt, metadata } from "@/lib/three/constants";
import { prismGeometry, tankCavityGeometry } from "@/lib/three/geometry";
import { MATERIALS as M } from "@/lib/three/materials";
import { Paint, Selectable, Cylinder, Box, Wire } from "./ModelParts";
import type { CargoContainmentStage } from "@/types/domain";

export function WeatherCover({
  start,
  end,
  width,
  id,
  color = M.cover,
  opacity = 1,
}: {
  start: number;
  end: number;
  width: number;
  id: string;
  color?: string;
  opacity?: number;
}) {
  const geometry = useMemo(
    () => prismGeometry(xAt(start) - xAt(end), width + 1, 25.8, 32, 3),
    [start, end, width],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <Selectable
      meta={metadata(
        id + "/SHELL",
        id,
        "BLOCK_COMPONENT",
        id + " weather cover",
      )}
    >
      <mesh
        name={id + "/WEATHER_COVER"}
        position={[xAt(end), 0, 0]}
        geometry={geometry}
      >
        <Paint color={color} opacity={opacity} />
      </mesh>
    </Selectable>
  );
}

const order: CargoContainmentStage[] = [
  "NOT_STARTED",
  "HOLD_CONSTRUCTION",
  "INSULATION",
  "MEMBRANE_INSTALLATION",
  "INSPECTION",
  "COMPLETED",
];

export default function CargoTankModel({
  tank,
  cutaway,
}: {
  tank: (typeof TANKS)[number];
  cutaway: boolean;
}) {
  const { selectedObject, cargoStates } = useTwin();
  const state = cargoStates.find((item) => item.entityId === tank.id)!;
  const rank = order.indexOf(state.stage),
    selected = selectedObject === tank.id + "/CARGO_VOLUME";
  const length = xAt(tank.start) - xAt(tank.end),
    cx = xAt((tank.start + tank.end) / 2);
  const volume = useMemo(
    () => tankCavityGeometry(length, tank.width),
    [length, tank.width],
  );
  useEffect(() => () => volume.dispose(), [volume]);
  if (rank === 0) return null;
  return (
    <Selectable
      meta={metadata(
        tank.id + "/CARGO_VOLUME",
        tank.id,
        "TANK",
        "Membrane cargo tank " + tank.id,
        { relatedBlockIds: tank.blocks },
      )}
    >
      <group
        name={"CargoTank" + tank.id.slice(1)}
        userData={{
          containmentState: state.stage,
          progress: state.progress,
          classification: state.classification,
        }}
      >
        {cutaway && (
          <group
            name={tank.id + "/CARGO_CONTAINMENT_LAYERS"}
            position={[xAt(tank.end), 0, 0]}
          >
            <mesh name={tank.id + "/HOLD_STRUCTURE"} geometry={volume}>
              <Paint color={M.bottom} opacity={0.24} />
            </mesh>
            {rank >= 2 && (
              <mesh
                name={tank.id + "/INSULATION"}
                geometry={volume}
                scale={[0.99, 0.985, 0.985]}
              >
                <Paint color={M.insulation} opacity={0.38} />
              </mesh>
            )}
            {rank >= 3 && (
              <mesh
                name={tank.id + "/MEMBRANE"}
                geometry={volume}
                scale={[0.98, 0.97, 0.97]}
              >
                <Paint
                  color={M.membrane}
                  selected={selected}
                  opacity={rank >= 5 ? 0.72 : 0.52}
                />
                {rank === 4 && <Edges color={M.inspection} lineWidth={2} />}
              </mesh>
            )}
            {rank >= 5 && (
              <mesh
                name={tank.id + "/COMPLETED_VOLUME"}
                geometry={volume}
                scale={[0.97, 0.94, 0.94]}
              >
                <Paint color={M.tank} opacity={0.2} />
              </mesh>
            )}
          </group>
        )}
        {cutaway && (
          <group
            name={tank.id + "/MEMBRANE_BOUNDARY"}
            userData={{
              geometrySource: "ASSUMPTION",
              containmentFamily: "GENERIC_MEMBRANE",
            }}
          >
            <Wire
              color={rank === 4 ? M.inspection : M.steel}
              points={Array.from({ length: Math.floor(length / 3) }, (_, i) => {
                const x = xAt(tank.end) + 1.5 + i * 3;
                return [
                  [x, 5, -tank.width / 2 + 0.03],
                  [x, 28, -tank.width / 2 + 0.03],
                  [x, 3.03, -tank.width / 2 + 2],
                  [x, 3.03, tank.width / 2 - 2],
                ];
              }).flat()}
            />
            <Cylinder
              at={[cx, 17.5, 0]}
              radius={0.45}
              height={29}
              color={M.steel}
            />
          </group>
        )}
        {rank >= 3 && (
          <>
            <Cylinder
              at={[cx, 33.2, 0]}
              radius={2.1}
              height={2.4}
              color={M.white}
              selected={selected}
            />
            <Cylinder
              at={[cx, 34.5, 0]}
              radius={2.5}
              height={0.25}
              color={M.blue}
              selected={selected}
            />
            <Cylinder
              at={[cx, 34.7375, 0]}
              radius={1.6}
              height={0.225}
              color={M.steel}
            />
            <Box
              at={[cx, 35, 0]}
              size={[4, 0.3, 6]}
              color={M.steel}
              selected={selected}
            />
          </>
        )}
      </group>
    </Selectable>
  );
}
