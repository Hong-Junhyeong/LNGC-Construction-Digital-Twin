import {PageHeading,Note} from '@/components/dashboard/Primitives';
import VesselViewer from '@/components/twin/VesselViewer';
import SelectedObjectPanel from '@/components/twin/SelectedObjectPanel';
import Timeline from '@/components/twin/Timeline';
import ScenarioContext from '@/components/simulation/ScenarioContext';
import BlockIndex from '@/components/twin/BlockIndex';
export default function Page(){return <><PageHeading eyebrow="SPATIAL WORKSPACE / 02" title="3D / 4D Twin" description="Explore the vessel. Select a hull zone, cargo tank or Wind Challenger to inspect its context."/><ScenarioContext/><div className="twin-layout"><div className="panel"><VesselViewer/><Timeline/><BlockIndex/></div><SelectedObjectPanel/></div><Note>P02 educational geometry, not shipyard CAD. Tank boundaries, sail anchors and detailed dimensions are assumptions. Timeline drives planned block poses and scope progress. B04 quality events are display-only assumptions, not delay propagation.</Note></>}
