'use client';
import Link from 'next/link';
import {ArrowUpRight,Info} from 'lucide-react';
import {Progress} from '@/components/ui/progress';
import type {ReactNode} from 'react';
import type {DataSourceType} from '@/types/domain';
export function DataSourceBadge({type='MOCK'}:{type?:DataSourceType}){return <span className={'source source-'+type.toLowerCase()} title={type==='MOCK'?'Illustrative data, not actual yard records':type==='ASSUMPTION'?'Educational project assumption':type==='DERIVED'?'Calculated from the displayed fixture':'Transcribed from the P02 validated reference'}>{type}</span>}
export function StatusBadge({status}:{status:string}){return <span className={'status '+(/NOT_STARTED|PENDING/.test(status)?'neutral':/HOLD|BLOCKED|NCR|REWORK/.test(status)?'bad':/STAGING|PARTIAL|NOT_READY|DELAYED/.test(status)?'warn':/RELEASED|PASS|ERECTED|COMPLETED|COMPLETE|AVAILABLE|READY/.test(status)?'good':'blue')}>{status.replaceAll('_',' ')}</span>}
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}){return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div>{action}</div>}
export function Panel({title,kicker,action,children,className=''}:{title:string;kicker?:string;action?:ReactNode;children:ReactNode;className?:string}){return <section className={'panel '+className}><div className="panel-head"><div>{kicker&&<p className="eyebrow">{kicker}</p>}<h2>{title}</h2></div>{action}</div>{children}</section>}
export function KpiCard({label,value,unit,note,type='MOCK',children}:{label:string;value:string|number;unit?:string;note:string;type?:DataSourceType;children?:ReactNode}){return <section className="kpi"><div className="kpi-label">{label}<DataSourceBadge type={type}/></div><div className="kpi-value">{value}<small>{unit}</small></div>{children}<p>{note}</p></section>}
export function Meter({value,label}:{value:number;label:string}){return <Progress value={value} aria-label={label} className="meter"/>}
export function TextLink({href,children}:{href:string;children:ReactNode}){return <Link className="text-link" href={href}>{children}<ArrowUpRight size={15}/></Link>}
export function Note({children}:{children:ReactNode}){return <div className="note"><Info size={16}/><span>{children}</span></div>}
