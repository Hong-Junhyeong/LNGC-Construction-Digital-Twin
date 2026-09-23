"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  ChartNoAxesGantt,
  ShieldCheck,
  FlaskConical,
  Lightbulb,
  Anchor,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TwinProvider, useTwin } from "@/application/TwinContext";
import WebMcpTools from "@/application/WebMcpTools";
import { DataSourceBadge } from "@/components/dashboard/Primitives";
const nav = [
  ["/overview", "Overview", LayoutDashboard],
  ["/twin", "3D Twin", Box],
  ["/production", "Production", ChartNoAxesGantt],
  ["/quality", "Quality", ShieldCheck],
  ["/simulation", "Simulation", FlaskConical],
  ["/insight", "Insight", Lightbulb],
] as const;
function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname().replace(/\/$/, "") || "/";
  const { playbackStep, operationalIssues } = useTwin();
  return (
    <SidebarProvider>
      <Sidebar className="navigation">
        <SidebarHeader>
          <Link href="/overview" className="brand">
            <span className="brand-mark">
              <Anchor size={25} />
            </span>
            <span>
              LNGC<span className="brand-sub">PRODUCTION TWIN</span>
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <p className="nav-caption">WORKSPACE</p>
          <SidebarMenu>
            {nav.map(([href, label, Icon], i) => (
              <SidebarMenuItem key={href}>
                <SidebarMenuButton
                  asChild
                  isActive={path === href || (path === "/" && i === 0)}
                  className="nav-item"
                >
                  <Link href={href}>
                    <Icon size={18} />
                    <span>{label}</span>
                    <small>0{i + 1}</small>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <div className="nav-project">
            <span className="eyebrow">REFERENCE VESSEL</span>
            <strong>174K Membrane LNGC</strong>
            <span>2 × Wind Challenger</span>
            <div className="mini-line" />
            <span className="mono">LNGC-EDU-01</span>
          </div>
        </SidebarContent>
        <SidebarFooter>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="method-trigger">
                <BookOpen size={17} />
                Methodology & data
              </Button>
            </SheetTrigger>
            <SheetContent className="evidence-sheet">
              <SheetHeader>
                <SheetTitle>Methodology & data</SheetTitle>
                <SheetDescription>
                  Educational production decision support
                </SheetDescription>
              </SheetHeader>
              <div className="evidence-body">
                <p>
                  본 프로젝트는 시뮬레이션 생산 데이터를 활용한 조선 생산관리
                  디지털 트윈 프로토타입입니다.
                </p>
                <p>
                  3D 선박 정보, 생산 현황, 품질 데이터 및 생산 차질 시나리오를
                  연결하여 생산 의사결정을 지원하는 개념을 구현합니다.
                </p>
                <hr />
                <h3>Reference hierarchy</h3>
                <p>
                  Modeling: P02 → Data: P03 → UI: P04 → Process refinement: P13
                  → Systems extension: P14 → playback synchronization: P15.
                </p>
                <p>
                  Block IDs B01–B09 are project Simulation Blocks, not an
                  official shipyard block plan. Playback step 0–60 is a
                  normalized geometry sequence, not an LNGC build duration.
                </p>
                <h3>Data classification</h3>
                {(["VERIFIED", "DERIVED", "ASSUMPTION", "MOCK"] as const).map(
                  (t) => (
                    <p key={t}>
                      <DataSourceBadge type={t} />{" "}
                      {t === "VERIFIED"
                        ? "Published vessel particulars"
                        : t === "DERIVED"
                          ? "Calculation from the fixture"
                          : t === "ASSUMPTION"
                            ? "Educational schedule and geometry"
                            : "Illustrative operational record"}
                    </p>
                  ),
                )}
                <h3>Current implementation</h3>
                <p>
                  The calendar-based Master Schedule remains separate from the
                  normalized 0–60 construction playback. Cargo containment,
                  outfitting and the B04 quality chain resolve from the shared
                  playback step without changing project dates.
                </p>
                <p>
                  This project uses publicly available vessel information and
                  simulated production data. The Master Schedule and Project
                  Simulation Blocks are educational modeling assumptions and do
                  not represent confidential shipyard production plans.
                </p>
                <p>
                  Dock supports are fixed yard assets. Block motion represents
                  staging, lift, translation and erection; it is not a
                  lifting-engineering simulation. No ERP, MES, live yard,
                  weather or IoT connection.
                </p>
              </div>
            </SheetContent>
          </Sheet>
          <div className="prototype-label">
            PROTOTYPE <span>BUILD 18</span>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div className="breadcrumbs">
            <SidebarTrigger />
            <span>Workspace</span>
            <ChevronRight size={14} />
            <strong>{nav.find((n) => n[0] === path)?.[1] || "Overview"}</strong>
          </div>
          <div className="header-context">
            <span className="context-chip">
              {"3D PLAYBACK · STEP " + playbackStep}
            </span>
            <span className="mono">
              S{String(playbackStep).padStart(2, "0")} / 60
            </span>
          </div>
        </header>
        <div id="main-content" className="page-content">
          {operationalIssues.length > 0 && (
            <div role="alert" className="validation-error">
              {operationalIssues.join(" ")} Summaries include available records
              only.
            </div>
          )}
          {children}
        </div>
        <footer className="app-footer">
          <span>SIMULATED PRODUCTION DATA · NOT CONNECTED TO YARD SYSTEMS</span>
          <span>LNGC-EDU-01 / P18</span>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TwinProvider>
      <WebMcpTools />
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Shell>{children}</Shell>
    </TwinProvider>
  );
}
