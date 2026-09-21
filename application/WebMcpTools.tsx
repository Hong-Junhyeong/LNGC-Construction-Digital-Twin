'use client';
import {useEffect} from 'react';
import {flushSync} from 'react-dom';
import {z} from 'zod';
import {useTwin} from './TwinContext';
import {blockById} from '@/data/repository';
interface ModelContext {registerTool(tool:{name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean};execute:(input:unknown)=>unknown},options:{signal:AbortSignal}):void|Promise<void>}
export default function WebMcpTools(){const {selectBlock}=useTwin();useEffect(()=>{const context=(document as Document & {modelContext?:ModelContext}).modelContext;if(!context?.registerTool)return;const lifecycle=new AbortController();const schema=z.object({entityId:z.string()}).strict();try{void Promise.resolve(context.registerTool({name:'select_simulation_block',description:'Select an existing Simulation Block in the visible production workspace. Does not run a simulation.',inputSchema:{type:'object',properties:{entityId:{type:'string',enum:Array.from(blockById.keys())}},required:['entityId'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const {entityId}=schema.parse(input);if(!blockById.has(entityId))throw new Error('Unknown simulation block');flushSync(()=>selectBlock(entityId));return {selectedBlock:entityId,simulationCalculated:false}}},{signal:lifecycle.signal})).catch(()=>{});}catch{/* Optional browser capability; visible UI remains available. */}return ()=>lifecycle.abort()},[selectBlock]);return null}
