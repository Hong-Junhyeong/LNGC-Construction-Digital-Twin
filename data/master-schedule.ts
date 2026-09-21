import type {DataSourceType,Dependency,MasterScheduleTask,MaterialRequirement,ResourceAllocation} from '@/types/domain';

type Group=MasterScheduleTask['ganttGroup'];
type Spec={id:string;name:string;duration:number;pred?:string[];phase:string;group:Group;entities?:string[];visible?:boolean;steps?:[number,number];classification?:DataSourceType};

export const MASTER_PROJECT_START='2025-01-06';
const specs:Spec[]=[
 {id:'BASIC_DESIGN',name:'Concept / Basic Design · early release',duration:60,phase:'01',group:'DESIGN'},
 {id:'BASIC_CLOSEOUT',name:'Basic Design · progressive closeout',duration:30,pred:['BASIC_DESIGN'],phase:'01',group:'DESIGN'},
 {id:'DETAIL_DESIGN',name:'Detailed Design',duration:150,pred:['BASIC_DESIGN'],phase:'02',group:'DESIGN'},
 {id:'PROD_DESIGN_RELEASE',name:'Production Design · early packages',duration:60,pred:['BASIC_CLOSEOUT'],phase:'03',group:'DESIGN'},
 {id:'PROD_DESIGN',name:'Production Design · progressive issue',duration:150,pred:['PROD_DESIGN_RELEASE'],phase:'03',group:'DESIGN'},
 {id:'STEEL_PROC',name:'Steel Procurement / Receipt',duration:110,pred:['BASIC_DESIGN'],phase:'04',group:'SUPPLY',steps:[0,5]},
 {id:'LONGLEAD',name:'Major Equipment Procurement',duration:300,pred:['STEEL_PROC'],phase:'04',group:'SUPPLY'},
 {id:'PLATE_PREP',name:'Plate Preparation',duration:35,pred:['STEEL_PROC','PROD_DESIGN_RELEASE'],phase:'05',group:'PRODUCTION',steps:[0,8]},
 {id:'CUT_FORM',name:'Cutting / Forming',duration:55,pred:['PLATE_PREP'],phase:'06',group:'PRODUCTION',steps:[5,12]},
 {id:'SUB_ASSY',name:'Sub-Assembly',duration:70,pred:['CUT_FORM'],phase:'07',group:'PRODUCTION',steps:[10,20]},
 {id:'WELD_NDT_1',name:'Sub-Assembly Welding / NDT',duration:45,pred:['SUB_ASSY'],phase:'08',group:'PRODUCTION',steps:[14,22]},
 {id:'INT_ASSY',name:'Intermediate Assembly',duration:75,pred:['WELD_NDT_1'],phase:'09',group:'PRODUCTION',steps:[15,26]},
 {id:'WELD_NDT_2',name:'Intermediate Welding / NDT',duration:40,pred:['INT_ASSY'],phase:'10',group:'PRODUCTION',steps:[20,30]},
 {id:'BLOCK_ASSY',name:'Block Assembly',duration:65,pred:['WELD_NDT_2'],phase:'11',group:'PRODUCTION',steps:[15,30]},
 {id:'WELD_NDT_3',name:'Block Welding / NDT',duration:40,pred:['BLOCK_ASSY'],phase:'12',group:'PRODUCTION',steps:[22,34]},
 {id:'BLOCK_PAINT',name:'Block Painting',duration:35,pred:['WELD_NDT_3'],phase:'13',group:'PRODUCTION',steps:[24,36]},
 {id:'PRE_OUTFIT',name:'Pre-Outfitting',duration:120,pred:['INT_ASSY','PROD_DESIGN'],phase:'14',group:'SYSTEMS',steps:[24,38]},
 {id:'BLOCK_STAGING',name:'Block Staging',duration:25,pred:['BLOCK_PAINT','PRE_OUTFIT'],phase:'15',group:'ERECTION',steps:[25,38]},
 {id:'E-B05',name:'B05 Block Erection',duration:10,pred:['BLOCK_STAGING'],phase:'16',group:'ERECTION',entities:['B05'],visible:true,steps:[30,32]},
 {id:'E-B04',name:'B04 Block Erection',duration:10,pred:['E-B05'],phase:'16',group:'ERECTION',entities:['B04'],visible:true,steps:[32,34]},
 {id:'E-B06',name:'B06 Block Erection',duration:10,pred:['E-B04'],phase:'16',group:'ERECTION',entities:['B06'],visible:true,steps:[34,36]},
 {id:'E-B03',name:'B03 Block Erection',duration:10,pred:['E-B06'],phase:'16',group:'ERECTION',entities:['B03'],visible:true,steps:[36,38]},
 {id:'E-B07',name:'B07 Block Erection',duration:10,pred:['E-B03'],phase:'16',group:'ERECTION',entities:['B07'],visible:true,steps:[38,40]},
 {id:'E-B08',name:'B08 Block Erection',duration:10,pred:['E-B07'],phase:'16',group:'ERECTION',entities:['B08'],visible:true,steps:[40,41]},
 {id:'E-B09',name:'B09 Block Erection',duration:10,pred:['E-B08'],phase:'16',group:'ERECTION',entities:['B09'],visible:true,steps:[41,42]},
 {id:'E-B02',name:'B02 Block Erection',duration:10,pred:['E-B09'],phase:'16',group:'ERECTION',entities:['B02'],visible:true,steps:[42,44]},
 {id:'E-B01',name:'B01 Block Erection',duration:10,pred:['E-B02'],phase:'16',group:'ERECTION',entities:['B01'],visible:true,steps:[44,45]},
 {id:'HULL_GATE',name:'Hull Integration Gate',duration:0,pred:['E-B01'],phase:'16',group:'ERECTION',entities:['B01','B02','B03','B04','B05','B06','B07','B08','B09'],visible:true,steps:[45,45]},
 {id:'CARGO_HOLD',name:'Cargo Hold Construction',duration:100,pred:['E-B07'],phase:'17',group:'SYSTEMS',steps:[38,48]},
 {id:'CCS',name:'Membrane Cargo Containment Installation',duration:150,pred:['CARGO_HOLD'],phase:'18',group:'SYSTEMS',entities:['T01','T02','T03','T04'],visible:true,steps:[43,52]},
 {id:'OUTFIT',name:'Piping / Electrical / Outfitting',duration:180,pred:['HULL_GATE','PRE_OUTFIT'],phase:'19',group:'SYSTEMS',entities:['B01','B02','B03','B04','B05','B06','B07','B08','B09'],visible:true,steps:[45,55]},
 {id:'MACH',name:'Main Engine / Major Equipment Installation',duration:110,pred:['HULL_GATE','LONGLEAD'],phase:'20',group:'SYSTEMS',entities:['B08'],visible:true,steps:[48,56]},
 {id:'WC_FND_INSTALL',name:'Wind Challenger Foundation Installation',duration:60,pred:['BLOCK_ASSY'],phase:'21',group:'SYSTEMS',entities:['WC01','WC02'],visible:true,steps:[48,53]},
 {id:'WC_LIFT',name:'Wind Challenger Installation',duration:30,pred:['HULL_GATE','WC_FND_INSTALL'],phase:'21',group:'SYSTEMS',entities:['WC01','WC02'],visible:true,steps:[52,57]},
 {id:'PRECOM',name:'Pre-Commissioning',duration:90,pred:['HULL_GATE','PRE_OUTFIT','DETAIL_DESIGN'],phase:'22',group:'COMMISSIONING',steps:[54,57]},
 {id:'SYS_COM',name:'System Commissioning',duration:80,pred:['PRECOM','MACH'],phase:'23',group:'COMMISSIONING',steps:[56,58]},
 {id:'INT_COM',name:'Integrated Commissioning',duration:45,pred:['SYS_COM','OUTFIT','CCS','WC_LIFT'],phase:'24',group:'COMMISSIONING',steps:[57,59]},
 {id:'FINAL_INSPECTION',name:'Final Inspection / Testing',duration:30,pred:['INT_COM'],phase:'25',group:'COMMISSIONING',steps:[59,60]},
 {id:'SEA_TRIAL',name:'Sea Trial',duration:25,pred:['FINAL_INSPECTION'],phase:'26',group:'DELIVERY'},
 {id:'FINAL_ACCEPTANCE',name:'Final Acceptance',duration:15,pred:['SEA_TRIAL'],phase:'27',group:'DELIVERY'},
 {id:'DEL',name:'Delivery',duration:0,pred:['FINAL_ACCEPTANCE'],phase:'28',group:'DELIVERY'},
];

const successors=new Map(specs.map(s=>[s.id,[] as string[]]));
for(const s of specs)for(const p of s.pred??[])successors.get(p)!.push(s.id);
const finishes=new Map<string,number>();
const dateAt=(offset:number)=>{const d=new Date(`${MASTER_PROJECT_START}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);return d.toISOString().slice(0,10)};
const meta={sourceType:'ASSUMPTION' as const,availability:'AVAILABLE' as const,sourceIds:['P13-MASTER-SCHEDULE-MODEL'],asOf:'2026-09-21'};

export const masterTasks:MasterScheduleTask[]=specs.map(s=>{
 const start=Math.max(0,...(s.pred??[]).map(id=>finishes.get(id)!));const finish=start+s.duration;finishes.set(s.id,finish);
 return {taskId:s.id,name:s.name,phase:s.phase,entityIds:s.entities??['LNGC-EDU-01'],objectIds:[],stage:s.id,baselineStartDay:start,baselineFinishDay:finish,durationDays:s.duration,calendarId:'CAL-24X7',dataMeta:meta,plannedStartDate:dateAt(start),plannedFinishDate:dateAt(finish),predecessorIds:s.pred??[],successorIds:successors.get(s.id)!,classification:s.classification??'ASSUMPTION',visibleIn3D:s.visible??Boolean(s.steps),playbackStartStep:s.steps?.[0]??null,playbackEndStep:s.steps?.[1]??null,ganttGroup:s.group};
});

export const masterDependencies:Dependency[]=masterTasks.flatMap(t=>t.predecessorIds.map(p=>({dependencyId:`MASTER-${p}-${t.taskId}`,predecessorTaskId:p,successorTaskId:t.taskId,type:'FS' as const,lagDays:0})));
const outfitStart=masterTasks.find(t=>t.taskId==='OUTFIT')!.baselineStartDay;
export const masterRequirements:MaterialRequirement[]=Array.from({length:9},(_,i)=>({requirementId:`MASTER-MATREQ-B0${i+1}`,entityId:`B0${i+1}`,taskId:'OUTFIT',materialLotId:`MAT-B0${i+1}`,needByDay:outfitStart,requiredQty:100,critical:true}));
export const masterAllocations:ResourceAllocation[]=[...masterTasks.filter(t=>t.taskId.startsWith('E-')).map((t,i)=>({allocationId:`MASTER-ALLOC-E-${i+1}`,taskId:t.taskId,resourceId:'RES-ERECTION-SLOT-01',demand:1})),{allocationId:'MASTER-ALLOC-WC',taskId:'WC_LIFT',resourceId:'RES-WC-SLOT-01',demand:1}];
export const masterProjectFinish=masterTasks.find(t=>t.taskId==='DEL')!.baselineFinishDay;
export const masterDateAt=dateAt;
