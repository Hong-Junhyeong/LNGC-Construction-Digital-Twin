import {Skeleton} from '@/components/ui/skeleton';
export default function Loading(){return <div role="status" aria-label="Loading production workspace"><Skeleton className="h-10 w-72 mb-8"/><div className="kpi-grid">{[1,2,3,4].map(n=><Skeleton key={n} className="h-40"/>)}</div><Skeleton className="h-96 w-full"/></div>}
