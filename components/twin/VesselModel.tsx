"use client";
import HullModel from "./HullModel";
import CargoTankModel from "./CargoTankModel";
import AccommodationModel from "./AccommodationModel";
import WindChallengerModel from "./WindChallengerModel";
import DeckEquipmentModel from "./DeckEquipmentModel";
import { TANKS } from "@/lib/three/constants";
import EngineRoomModel from "./EngineRoomModel";
import SystemPresence from "./SystemPresence";
export default function VesselModel({ cutaway }: { cutaway: boolean }) {
  return (
    <group
      name="VesselRoot"
      userData={{
        vesselId: "LNGC-EDU-01",
        units: "metres",
        coordinates: "+X bow / +Y up / +Z starboard",
        geometrySource: "ASSUMPTION",
      }}
    >
      <HullModel cutaway={cutaway} />
      <group name="CARGO_CONTAINMENT">
        {TANKS.map((t) => (
          <CargoTankModel key={t.id} tank={t} cutaway={cutaway} />
        ))}
      </group>
      <SystemPresence taskId="ACC">
        <AccommodationModel />
      </SystemPresence>
      {cutaway && <EngineRoomModel />}
      <SystemPresence taskId="OUTFIT">
        <DeckEquipmentModel />
      </SystemPresence>
      <group name="WindChallenger">
        <WindChallengerModel id="WC01" z={-11} />
        <WindChallengerModel id="WC02" z={11} />
      </group>
    </group>
  );
}
