'use client';
import {Button} from '@/components/ui/button';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <section className="panel p-8" role="alert"><h1>Workspace could not load</h1><p className="muted my-5">A data or rendering error prevented this page from opening. Your baseline data has not been modified.</p><Button onClick={reset}>Try again</Button></section>}
