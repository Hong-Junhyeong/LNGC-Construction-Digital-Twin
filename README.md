# LNGC Production Twin — PROMPT 12 (Geometry Refinement)

Next.js + React + TypeScript + Tailwind CSS로 구현한 조선 생산관리 디지털 트윈 기반 버전입니다. PROMPT 05.1에서 기능과 데이터 계약은 유지하고 Light Industrial production-control theme과 로컬 실행 편의성을 정리했습니다.

## 실행

Node.js 22.13 이상과 `package.json`에 지정된 pnpm 11.25.0을 사용합니다.

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

개발 주소: http://localhost:3000

Windows에서는 프로젝트 루트의 `start-dev.bat`을 더블클릭해도 됩니다. 의존성이 없으면 먼저 설치하고, 개발 서버 준비가 끝나면 기본 브라우저에서 `http://localhost:3000`을 엽니다. 앱을 사용하는 동안 열린 CMD 창을 유지하고, 종료할 때 `Ctrl+C`를 누릅니다.

```bash
node tests/validate-geometry.mjs
pnpm typecheck
pnpm lint
pnpm validate:data
pnpm validate:operations
pnpm test:simulation
node tests/validate-timeline.mjs
pnpm build
pnpm start
```

`pnpm build`는 **실제 Next.js 16 App Router**로 정적 `out/`을 생성합니다. `pnpm start`는 포함된 Node 정적 서버로 `out/`을 제공합니다. 데이터 API/백엔드는 없습니다. 빌드 완료본이 포함되어 있어 `node scripts/serve-static.mjs`만으로도 확인할 수 있습니다. HTML을 file://로 직접 열지 마세요.

관리형 미리보기 환경에서만 `--host`가 전달되면 bundled Vite/Vinext 개발 어댑터를 사용합니다. 일반 `pnpm dev`는 Next.js입니다. 두 개발 서버를 동시에 같은 checkout에서 실행하지 마세요(생성 타입 디렉터리를 공유합니다).

## 페이지

| URL | 기능 |
|---|---|
| `/`, `/overview` | KPI, 우선 확인사항, 블록 인덱스, 기준 임계 순서 |
| `/twin` | 실제 R3F Viewer, B01–B09 계획 상태·이동·진척, 선택, Day0–60 timeline |
| `/production` | 공통 Day context, 블록 생산표, 자재 준비도·부족·Need-by, 자원·baseline Gantt |
| `/quality` | 공통 Day context, Welding→NDT→NCR→Rework→Release와 블록 품질표 |
| `/simulation` | 5개 preset, Run/Reset, 납기·경로·Float 비교, 전파 표, 별도 Scenario timeline |
| `/insight` | 활성 시나리오의 납기·영향 작업·Critical Path와 의사결정 문맥 |

## 주요 파일

| 파일/폴더 | 역할 |
|---|---|
| `app/layout.tsx`, `app/*/page.tsx` | 공통 레이아웃과 실제 routes |
| `app/globals.css` | Light Industrial 전역 토큰, 상태/출처 색상, responsive 스타일 |
| `start-dev.bat` | Windows 더블클릭 개발 서버 실행 및 브라우저 열기 |
| `components/layout/AppShell.tsx` | Sidebar, header, methodology sheet |
| `components/dashboard/*` | 재사용 KPI, badge, panel, Overview |
| `components/twin/VesselViewer.tsx` | client-only R3F Canvas 및 카메라 controls |
| `components/twin/BlockModel.tsx`, `BlockIndex.tsx` | 4D 블록 그룹·이동·경고·선택 동기화 |
| `lib/twin/block-state.ts` | 기존 P02 task에서 계획 상태·진척·목표 pose 계산 |
| `lib/twin/block-operations.ts` | Block ID로 계획·생산·자재·품질·일정 context를 결합하는 순수 resolver |
| `components/dashboard/DayContextBar.tsx` | Twin/Production/Quality가 공유하는 simulation day 제어 |
| `components/twin/SelectedObjectPanel.tsx` | objectId/entityId로 조인한 상세 표시 |
| `components/twin/Timeline.tsx` | Day cursor, play/pause, previous/next, reset |
| `components/production/*`, `quality/*` | 표/Gantt, 품질 체인 |
| `components/simulation/*`, `insight/*` | 사건 입력·검증, 계산 결과·오버레이, 근거 탐색 |
| `lib/simulation/graph.ts`, `cpm.ts`, `simulate.ts` | DAG 검증, 정/역방향 CPM, 시나리오 매핑·전파·비교 |
| `lib/simulation/scenarios.ts`, `project.ts` | 5개 preset와 기존 repository adapter |
| `application/TwinContext.tsx` | selectedBlock/currentDay/timelineMode/selectedScenario |
| `application/WebMcpTools.tsx` | 지원 브라우저에서 선택 동작 노출(선택 기능과 동일 state) |
| `types/domain.ts` | 최소 14개 domain 계약 및 출처/ID 타입 |
| `data/*.json` | 9 blocks, 4 tanks, 2 WC, 76 tasks, 107 FS edges, 운영 목업 |
| `data/repository.ts` | JSON 적재, 핵심 runtime schema validation, 인덱스·read model |
| `tests/validate-data.mjs` | ID/참조/DAG/기간/P02 날짜/출처 검사(일정 엔진 아님) |
| `tests/validate-operations.mjs` | 9개 block 계약, Day25/40 전환, B07 부족, provenance 검사 |
| `tests/validate-simulation.mjs` | baseline 재현, Float 흡수, 병렬 경로, outage, 오류·불변성 검사 |
| `docs/P09_IMPLEMENTATION_REPORT_KO.md` | P09 계산 규칙·실제 결과·검증·남은 문제 |
| `docs/IMPLEMENTATION_REPORT_KO.md` | 구현 요약, 검증, 충돌, 제한, 다음 단계 |

## 데이터 계약과 범위

- P02 > P03 > P04 순서로 준수. 실선은 174,000 m³ Membrane LNG carrier, Wind Challenger 2기 기준.
- B01–B09는 Simulation Block이며 실제 Hanwha Ocean 공식 Block Plan이 아닙니다.
- `entityId=B04`, `objectId=B04/SHELL`, `taskId=E-B04`를 구분합니다.
- 원본 task 날짜와 FS dependency를 보존하며 P09에서 별도 snapshot으로 CPM/float/delay propagation을 계산합니다.
- Day25 기록값은 `recorded` MOCK으로 유지하고, Timeline `PLANNED_PREVIEW`와 분리합니다. B04 HOLD D24–26 / REWORK D26–29는 교육용 ASSUMPTION이며 Day40에는 품질 release 상태로 전환됩니다.
- Overview 전체 진척은 공유 currentDay의 동일 가중 8개 작업 계획 진척 평균입니다. Day25는 66%입니다. 기존 68% project-level MOCK 원본은 변경하지 않았으며 현재 KPI로 표시하지 않습니다.
- NDT pass rate, gate count, material readiness는 목업 레코드 합계에서 파생합니다.
- `VERIFIED / DERIVED / ASSUMPTION / MOCK`, 별도 `availability=UNKNOWN`을 유지합니다.
- UI의 VERIFIED는 P02 검증값을 옮긴 것입니다. 이번 구현에서 실선 자료를 새로 재검증하지 않았습니다.
- Two WC는 shared task package를 참조하며 작업을 두 번 계산하지 않습니다. Hydraulic은 unknown/null입니다.

## 다음 단계

PROMPT 06은 `VesselViewer`에 실제 R3F Canvas와 분리된 선박 geometry를 연결했습니다. Reset/Fit/Side/Front/Top, Cutaway, object selector 및 metadata panel을 제공합니다. 기존 블록 선택 context와 데이터는 유지됩니다. 상세 구현·충돌 처리·검증 제한은 `docs/P06_IMPLEMENTATION_REPORT_KO.md`를 참조하세요.

검증 환경의 WebGL이 비활성화되어 실제 3D 렌더링과 카메라·클릭은 아직 시각 검증하지 못했습니다. WebGL 지원 Chrome/Edge에서 `/twin`의 Day0→25→40→60 메시 이동·색상·선택을 확인하세요. WebGL 미지원 환경에서는 안내가 표시되고 Timeline과 정보 패널은 계속 사용할 수 있습니다.

PROMPT 08의 통합 Block 계약은 유지됩니다. P09는 기존 76 Task / 107 FS edge를 검증하고 계산하여 전체 P02 날짜와 Day60 baseline을 재현합니다. `/simulation`에서 preset → Run simulation 순서로 실행하세요.

| Preset | Scenario delivery | Delivery impact |
|---|---:|---:|
| B04 Welding Rework +3d | D63 | +3d |
| B07 Material Delay +5d | D63 | +3d |
| Main erection crane +2d, D24–26 | D62 | +2d |
| Weather shutdown +2d, D24–26 | D62 | +2d |
| WC02 installation +3d | D61 | +1d |

B04는 기존 P03의 `E-B04` repair/reinspection allowance를 연장합니다. B07는 필요일 D40 기준 +5일로 공통 소비 Task `OUTFIT`에 release constraint를 적용합니다. Mock 입고일 D43을 baseline에 중복 반영하지 않습니다. WC02는 WC01과 공유한 `WC_LIFT`를 한 번 연장합니다. 자원/기상 중단은 지정 Task의 `[start, end)` 중단 시간창이며 후속 Task마다 반복 가산하지 않습니다.

Scenario는 전체 baseline의 가정 비교이며 currentDay 이후 잔여공정 예측은 아닙니다. Baseline Day0–60 pose/생산 preview는 유지하고 계산 결과를 별도 overlay 및 timeline으로 표시합니다. Reset scenario는 결과/overlay만 지웁니다. Float와 Critical 표시는 명시된 `E-Bxx` Task 기준입니다. 동시 복수 사건, 실제 실적 잠금, 자원 leveling, 검증된 비용 모델은 미구현입니다.

## P10 통합 및 검증
Overview → Twin → Production → Quality → Simulation → Insight에서 동일 선택/날짜/계산 결과를 공유합니다. 시나리오 입력 초안은 페이지 이동 후 유지됩니다. Prepare scenario는 대상과 종류를 명시하고 이전 결과를 제거합니다. Reset은 결과와 overlay를 제거하며 기준 날짜를 바꾸지 않습니다.

Development server must remain running while using localhost.

의존성은 pnpm lockfile 기준으로 설치합니다. 설치 후 npm run dev / npm run build / npm start도 같은 package scripts를 실행하지만 npm install로 별도 lockfile을 만들지 않는 것을 권장합니다. Corepack이 없는 Node 배포판에서는 npm install -g pnpm@11.25.0 후 pnpm install --frozen-lockfile을 사용하세요.

최종 문서:
- docs/PROJECT_OVERVIEW.md
- docs/DATA_METHODOLOGY.md
- docs/ARCHITECTURE.md
- docs/SIMULATION_LOGIC.md
- docs/P10_FINAL_VALIDATION.md

B04 +3.5d 시연: Overview B04 → Twin → Production → Quality의 Prepare scenario → delay 3.5 → Run simulation → Insight. 결과는 D63.5, 영향 작업 24개입니다.
최종 판정은 Partial입니다. 데이터/브라우저 UI/빌드는 검증했으나 WebGL 비활성 환경으로 3D 시각 검증은 Not visually verified입니다. Windows bat 실제 실행과 모바일 기기 실측은 별도 확인이 필요합니다.


## P12 geometry refinement (2026-09-21)

실제 코드에 공통 선형 sampler, bow rake/flare, generic bulb, aft run/propulsion proxy, 지지된 funnel/pipe/dome, 내부 cargo cavity, MACH 소유 engine proxy, WC hollow telescopic stages를 적용했습니다. +X bow/+Y up/+Z starboard 및 기존 ID/JSON/Timeline/CPM을 유지합니다.

**상태: PARTIAL — 코드·빌드·수치 검증과 UI 회귀 확인 완료, 실제 WebGL 시각 검증은 미완료.** 제공된 원격 브라우저는 WebGL 2 unavailable이므로 3D 외형·카메라별 화면·raycast의 완료 판정을 하지 않았습니다. `docs/P12_IMPLEMENTATION_REPORT_KO.md`에 변경 파일, 검증 결과와 남은 작업을 기록했습니다.

로컬 확인: `pnpm dev` 또는 Windows `start-dev.bat` → 3D Twin → Playback Step 60 → 선택 해제 → Reset/Side/Front/Top/Cutaway. Step 52–56은 WC 설치/수납, Step 56–59는 시험 전개, Step 59 이후는 전개 상태입니다. 실제 장치의 운용 시퀀스가 아닌 표시 가정입니다.

모든 상세 geometry는 ASSUMPTION입니다. 특히 bulb/shaft/propeller/rudder 개수·형상은 generic 교육용이며, WC 높이는 assumed deck-to-sail-top 49m입니다. 실선 CAD·lines plan·tank plan·기계 배치도 재현으로 쓰지 않습니다. P11의 조건부 bulb 보류안은 P12 사용자의 명시적 구현 요청에 따라 가정 표시와 함께 구현했습니다.

## P13 schedule and erection refinement (2026-09-21)

P13은 실제 프로젝트 상대일을 사용하는 41-task / 52-dependency Master Schedule과 0–60 normalized 3D Playback을 분리합니다. CPM·What-If는 D0–D1070 Master Schedule에서 계산하며, 3D 슬라이더는 형상 상태만 제어합니다. Production의 Master Schedule 탭에서 설계·조달·생산·탑재·시스템·시운전·인도 Gantt와 계획 날짜를 확인할 수 있습니다.

도크 바닥과 30개 반목은 `DOCK` 소유의 고정 오브젝트이며 선체 블록의 자식이 아닙니다. 각 블록은 assembly → staging → lift/translation/lowering → final erection 위치를 따릅니다. 원격 검증 브라우저에는 WebGL 2가 없어 실제 3D 픽셀 검증은 제한되었지만, fallback·UI·라우트·CPM·빌드 검증은 완료했습니다. 상세 결과는 `docs/P13_IMPLEMENTATION_REPORT_KO.md`를 참조하십시오.

## P14 Cargo Containment + Outfitting extension (2026-09-21)

P14는 기존 B01–B09, T01–T04, `CARGO_HOLD`, `CCS`, `OUTFIT`, WC01/WC02 및 D1070 CPM 그래프를 보존한 additive extension입니다. 동일한 playback state가 Cargo Hold → Insulation → Membrane → Inspection → Completed와 Piping → Equipment → Electrical → Deck → Safety → Completed를 구동합니다.

초기 playback은 Step 60이며 블록·Cargo·Outfitting의 weighted visual progress가 100%로 표시됩니다. Step 30은 32.5%, Step 45는 58.6%, Step 0은 0%이며 Step 60으로 돌아오면 100%가 복원됩니다. Cutaway에서만 내부 containment layers가 나타나며 실제 탱크/멤브레인 상세 형상이나 조선소 공정을 의미하지 않습니다. 상세 결과는 `docs/P14_IMPLEMENTATION_REPORT_KO.md`를 참조하십시오.
