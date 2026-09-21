import type {ThreeObjectMetadata} from '@/types/domain';
import {blocks,vessel} from '@/data/repository';

/** P02 contract: metres, +X bow, +Y up, +Z starboard. Origin at stern baseline. */
export const VESSEL = {length:294.9,beam:46.4,hullHeight:26.5,waterline:11.5};
export const TANKS = [
 {id:'T01',start:.190,end:.310,width:34,blocks:['B03']},
 {id:'T02',start:.335,end:.485,width:38,blocks:['B04','B05']},
 {id:'T03',start:.505,end:.635,width:38,blocks:['B05','B06']},
 {id:'T04',start:.655,end:.785,width:38,blocks:['B07']},
];
export const xAt = (u:number) => VESSEL.length*(1-u);
export type ViewerMetadata = Omit<ThreeObjectMetadata,'objectType'> & {
 objectType:ThreeObjectMetadata['objectType']|'VESSEL_COMPONENT';
 name:string; geometrySource:'ASSUMPTION'; hostBlockId?:string; relatedBlockIds?:string[];
};
export function metadata(objectId:string,entityId:string,objectType:ViewerMetadata['objectType'],name:string,extra:Partial<ViewerMetadata>={}):ViewerMetadata {
 return {objectId,entityId,objectType,name,vesselId:vessel.entityId,selectable:true,geometrySource:'ASSUMPTION',...extra};
}
export const OBJECTS:ViewerMetadata[] = [
 ...blocks.map(b=>metadata(b.objectIds[0],b.entityId,'BLOCK_COMPONENT',b.name)),
 ...TANKS.map(t=>metadata(t.id+'/CARGO_VOLUME',t.id,'TANK','Membrane cargo tank '+t.id,{relatedBlockIds:t.blocks})),
 ...['WC01','WC02'].map(id=>metadata(id,id,'WC_COMPONENT','Wind Challenger '+id,{hostBlockId:'B02'})),
 metadata('B08/ACCOMMODATION','B08','VESSEL_COMPONENT','Aft accommodation',{hostBlockId:'B08'}),
 metadata('B08/ENGINE_ROOM','B08','VESSEL_COMPONENT','Engine room envelope',{hostBlockId:'B08'}),
];
export const objectById=(id:string|null)=>OBJECTS.find(o=>o.objectId===id);
