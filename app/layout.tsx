import type {Metadata} from 'next';
import AppShell from '@/components/layout/AppShell';
import './globals.css';
export const metadata:Metadata={title:'LNGC Production Twin',description:'Shipbuilding production, quality and disruption scenario workspace — educational prototype.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><AppShell>{children}</AppShell></body></html>}
