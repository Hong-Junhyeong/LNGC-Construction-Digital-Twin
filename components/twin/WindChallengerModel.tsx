"use client";
import { useMemo, useEffect } from "react";
import { Edges, Html } from "@react-three/drei";
import { INDICATOR_COLORS } from "@/lib/twin/block-state";
import { useTwin } from "@/application/TwinContext";
import { metadata, xAt } from "@/lib/three/constants";
import { sailGeometry } from "@/lib/three/geometry";
import { MATERIALS as M } from "@/lib/three/materials";
import { Paint, Selectable, Box, Cylinder } from "./ModelParts";
import SystemPresence from "./SystemPresence";
function SailStage({
  width,
  thickness,
  bottom,
  name,
  selected,
}: {
  width: number;
  thickness: number;
  bottom: number;
  name: string;
  selected: boolean;
}) {
  const geometry = useMemo(
    () => sailGeometry(width, thickness),
    [width, thickness],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <group name={name} position={[0, bottom, 0]}>
      <mesh geometry={geometry}>
        <Paint color={M.sail} selected={selected} />
      </mesh>
    </group>
  );
}
export default function WindChallengerModel({
  id,
  z,
}: {
  id: string;
  z: number;
}) {
  const { selectedObject, simulationResult, playbackStep, blockStates } =
    useTwin();
  const affected = simulationResult?.affectedEntityIds.includes(id),
    selected = selectedObject === id;
  const host = blockStates.find((b) => b.blockId === "B02")!;
  // Display-only nesting/deployment. The package dates and CPM remain authoritative and unchanged.
  const deployed = Math.min(1, Math.max(0, (playbackStep - 56) / 3));
  if (playbackStep < host.erectionFinish) return null;
  return (
    <Selectable
      meta={metadata(id, id, "WC_COMPONENT", "Wind Challenger " + id, {
        hostBlockId: "B02",
      })}
    >
      <group
        name={id}
        position={[xAt(0.13), 26.5, z]}
        userData={{
          geometrySource: "ASSUMPTION",
          deployment: deployed,
          assumedDeckToSailTop: 49,
          heightDatumVerified: false,
        }}
      >
        {affected && (
          <>
            <mesh position={[0, 25, 0]} raycast={() => {}}>
              <boxGeometry args={[8, 51, 17]} />
              <meshBasicMaterial visible={false} />
              <Edges color={INDICATOR_COLORS.delayed} lineWidth={2} />
            </mesh>
            <Html position={[0, 53, 0]} center>
              <span className="block-3d-label">
                {id} · SCENARIO / SHARED PACKAGE
              </span>
            </Html>
          </>
        )}
        <SystemPresence taskId="WC_FND_INSTALL">
          <group name={id + "/FOUNDATION"}>
            <Box
              at={[0, 0.15, 0]}
              size={[5.3, 0.3, 5.3]}
              color={M.steel}
              selected={selected}
            />
            <mesh position={[0, 1.75, 0]}>
              <cylinderGeometry args={[2, 3.53, 3.5, 4]} />
              <Paint color={M.steel} selected={selected} />
            </mesh>
          </group>
        </SystemPresence>
        <SystemPresence taskId="WC_LIFT">
          <group name="ROTATION_FRAME" position={[0, 3.5, 0]}>
            <Cylinder
              at={[0, 0.35, 0]}
              radius={1.6}
              height={0.7}
              color={M.blue}
              selected={selected}
            />
            <SailStage
              name="STAGE_BASE"
              width={15}
              thickness={1.4}
              bottom={0}
              selected={selected}
            />
            <SailStage
              name="STAGE_MID"
              width={14.5}
              thickness={1}
              bottom={13.75 * deployed}
              selected={selected}
            />
            <SailStage
              name="STAGE_TOP"
              width={14}
              thickness={0.6}
              bottom={27.5 * deployed}
              selected={selected}
            />
          </group>
        </SystemPresence>
        <group
          name="DRIVE"
          userData={{ availability: "UNKNOWN", hydraulicSystemId: null }}
        />
        <SystemPresence taskId="WC_ELECTRICAL">
          <group name="ELECTRICAL">
            <Box at={[-3, 1, -1]} size={[1.2, 2, 1]} color={M.steel} />
          </group>
        </SystemPresence>
        <SystemPresence taskId="WC_CONTROL">
          <group name="CONTROL">
            <Box at={[-3, 1, 1]} size={[1.2, 2, 1]} color={M.white} />
          </group>
          <group name="SENSOR">
            <Cylinder
              at={[0.95, 22.3 + 27.5 * deployed, 0]}
              radius={0.1}
              height={1.6}
              color={M.steel}
            />
            <Box
              at={[0.95, 23.1 + 27.5 * deployed, 0]}
              size={[1, 0.12, 0.12]}
              color={M.steel}
            />
          </group>
        </SystemPresence>
      </group>
    </Selectable>
  );
}
