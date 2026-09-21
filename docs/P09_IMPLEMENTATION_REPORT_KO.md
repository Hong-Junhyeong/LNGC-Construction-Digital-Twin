# PROMPT 09 — What-If / Delay Propagation / Critical Path

## 1. Implementation Summary

P03의 76개 Task / 107개 FS dependency, P07 baseline timeline, P08 Block operational contract를 유지하면서 실제 계산 엔진을 추가했다. JSON fixture와 dependency 날짜는 수정하지 않았다.

| 파일 | 역할 |
|---|---|
| `lib/simulation/graph.ts` | ID/날짜/기간/참조/FS lag/종단 연결 검증, 위상 정렬, cycle 거부 |
| `lib/simulation/cpm.ts` | Forward/Backward pass, ES/EF/LS/LF, Total Float, 복수 Critical Path, outage calendar |
| `lib/simulation/simulate.ts` | pure scenario mapping → schedule recalculation → impact read model |
| `lib/simulation/scenarios.ts` | 기존 ScenarioType을 사용한 5개 preset와 생성 함수 |
| `lib/simulation/project.ts` | 기존 repository를 계산 엔진에 전달하는 adapter |
| `types/domain.ts` | 기존 SimulationScenario/SimulationResult/ScheduleTask의 확장 read model |
| `application/TwinContext.tsx` | baseline CPM, active result, shared block state 및 Reset 연결 |
| `components/simulation/SimulationWorkspace.tsx` | 유형/Target/Delay/중단 시작일, Run/Reset, 상태·오류, preset 비교 |
| `components/simulation/SimulationResults.tsx` | 납기 KPI, Critical Path 비교, Task/Float 표, 별도 timeline preview |
| `components/simulation/ScenarioContext.tsx` | Twin/Production/Quality 간 유지되는 scenario overlay 요약 |
| `components/twin/BlockModel.tsx`, `WindChallengerModel.tsx` | 영향받은 블록/시스템의 warning outline·label |
| `components/twin/ConstructionBlockPanel.tsx`, `BlockIndex.tsx` | baseline Erection CPM 표시와 scenario 범례 |
| `components/production/ProductionDashboard.tsx`, `quality/QualityDashboard.tsx` | 공통 결과 overlay, 명시적 scenario 입력으로 연결 |
| `components/dashboard/Overview.tsx` | 하드코딩 reference sequence를 계산된 baseline path로 대체 |
| `components/layout/AppShell.tsx`, `insight/InsightDashboard.tsx`, `app/twin/page.tsx` | P09 설명·단계 표시와 결과 연결 |
| `app/globals.css` | 기존 Light Industrial 토큰을 사용하는 simulation layout |
| `tests/validate-simulation.mjs`, `package.json`, `tsconfig.json` | UI 독립 논리 검사와 실행 명령, Node TS 테스트용 import 지원 |

## 2. Simulation Architecture

`Scenario Input → graph validation/topological order → target duration/release/outage constraints → CPM → immutable baseline/scenario snapshots → TaskImpact / FloatChange / BlockImpact → UI`

계산 엔진은 React, Three.js, fixture 파일을 import하지 않는다. Application adapter만 기존 repository를 전달한다. `simulateScenario(input, scenario)`는 동일 입력에서 동일 결과를 반환하고 원본 baseline 및 scenario를 변경하지 않는다. 원본 graph를 확장·재작성하지 않고 기존 소비 Task 및 FS 관계를 사용한다.

## 3. Scenario Types

| 유형 | 입력/적용 규칙 |
|---|---|
| WELDING_REWORK | Bxx → 기존 `E-Bxx`의 repair/reinspection allowance duration 증가. 기존 P03 B04 preset과 동일 대상 |
| MATERIAL_DELAY | Block MaterialRequirement의 `needByDay + delayDays`를 소비 Task의 earliest-release 제약으로 적용 |
| CRANE_BREAKDOWN | 지정 ResourceAllocation의 Task에만 `[startDay, startDay+delayDays)` 중단 calendar 적용 |
| WEATHER_SHUTDOWN | 교육용 옥외 `E-*`, `WC_FND_INSTALL`, `WC_LIFT`에만 같은 중단 calendar 적용 |
| WIND_CHALLENGER_DELAY | WC01/WC02가 공유하는 `WC_LIFT` duration을 한 번 증가 |

Scenario는 ASSUMPTION이고 운영 근거는 MOCK이다. 사용자 입력이 rework MH를 지연일로 자동 변환하지 않는다. 크레인은 실제 장비 규격 대신 기존 assumed erection slot을 사용한다. 날씨 임계값을 만들지 않았다.

## 4. CPM Engine

- 일반 FS: `ES = max(projectStart, release constraint, predecessor EF + lag)`; `EF = ES + duration`.
- Backward: `LF = min(successor LS − lag)` 또는 종단 delivery; `LS = LF − duration`.
- outage 대상은 forward에서 중단 시간을 건너뛰며 실제 요구 작업기간을 소진한다. backward에서도 중단 시간창을 역으로 건너뛰어 latest feasible work start를 계산한다.
- `Total Float = LS − ES`, tolerance `1e-8` 이내면 Critical.
- Critical Task 중 실제로 연결되어 있고 타이밍이 맞는 FS edge를 따라 경로를 생성한다. 양분되는 SAT/GAS와 baseline의 동시 경로를 모두 유지한다.
- 외부 release constraint가 지배하는 경로는 해당 Task에서 시작할 수 있다. B07 case의 OUTFIT 경로가 이 경우다.
- 경로 열거는 256개까지 표시하고 초과를 명시한다. Task 계산은 모두 수행된다.
- Calendar는 CAL-24X7, FS와 비음수 lag를 지원한다.

P02 모든 Task ES/EF가 원본 시작/종료일과 일치했고 DEL은 D60으로 재현됐다. baseline critical path는 4개다.

## 5. Delay Propagation

Target의 duration 또는 release 제약이 달라지면 위상 순서로 모든 successor의 가장 늦은 선행 완료시점을 계산한다. 병렬 경로는 `max` merge하므로 짧은 경로의 지연이 자동으로 납기에 같은 크기로 전달되지 않는다.

중단 사건은 매 Task에 일괄 +N일을 더하지 않는다. 예: D24–26 erection slot 중단은 E-B06의 시작을 D26으로 밀고 이후 직렬 작업은 그 결과를 따른다. 뒤로 밀려 중단창 밖에서 수행되는 작업에는 추가 2일을 다시 부과하지 않는다.

Float 변화는 Task마다 baseline/scenario를 비교한다. 결과 KPI는 직접 target의 Float 소비 중 최댓값으로 정의하며, 동일 path상의 Float를 합산하지 않는다. Scenario 납기가 늦어지면 비영향 경로의 Float가 늘 수 있다.

## 6. Baseline vs Scenario

`ScheduleSnapshot` 두 개를 각각 저장한다. 계산된 ES/EF/LS/LF와 Float, criticalPaths를 각각 보유한다. 원본 fixture 날짜는 수정하지 않는다.

`currentDay`는 기존 baseline Day0–60 construction/operations preview다. Scenario 결과는 별도 화면의 cursor로 D63 등 연장 구간을 확인할 수 있다. Main currentDay와 geometry pose를 영구 변경하지 않는다. Scenario reset은 active result/overlay를 제거하고 baseline 상태로 돌아간다.

이는 **full-baseline counterfactual**이다. 현 currentDay 이전 완료공정을 잠그는 잔여일정 forecast가 아니다. 예를 들어 D25에서 E-B04 allowance를 입력해도 전체 baseline을 재계산한다. 이 차이를 입력 UI에 명시했다.

## 7. 3D Integration

계산된 `blockImpacts`를 공통 Context에서 읽는다. Target Block은 issue/red outline, 후속/공유 Task 영향을 받은 Block은 delayed/amber outline 및 `SCENARIO +Nd` label로 표시한다. 기존 선택 outline과 품질 pin을 유지한다.

WC는 Block 목록에 억지로 포함하지 않으며 WC01/WC02 시스템 group에 별도 amber outline/label을 연결한다. Shared WC task가 지연되므로 두 시스템이 함께 표시될 수 있다.

Block 영향은 연결된 Task의 최대 finish shift이며 erection만의 지연을 의미하지 않는다. 공통 HULL_GATE/OUTFIT으로 인해 9개 Block 모두 영향을 받을 수 있다. UI에 이 정의를 표시한다.

**Code integration은 완료했지만 실제 mesh 색상·outline·raycast는 WebGL2 제한으로 시각 검증하지 못했다.**

## 8. Validation

| 구분 | 결과/근거 |
|---|---|
| TypeScript | PASS — `tsc --noEmit`, production build TypeScript |
| Lint | PASS — 기존 ESLint 명령 |
| Build | PASS — Next.js webpack production static export |
| Data | PASS — 9 Block, 76 Task, 107 FS dependency, 기존 P02 일정/참조 |
| P07/P08 회귀 | PASS — timeline 경계/이동, 9 operational 계약, Day25/40 |
| Unit / Logic | PASS — 무사건, float 내/초과, critical/병렬 delay, outage 경계, missing/cycle/negative/NaN 오류, baseline 불변성·결정성 |
| Simulation Engine | PASS — 5개 실제 dataset preset 및 WC +2d→delivery +0d |
| Static route | PASS — 7 exported application routes, CSS, 404 |
| Browser | PASS — 유형/Target/Delay, 5개 preset, Run, 결과/경로/Task/Float, Reset, 비교표, 페이지 간 overlay 유지/제거 |
| Runtime | 확인한 Console에서 app error 없음; browser extension metadata 메시지는 별도 |
| 3D Visual | NOT VERIFIED — 브라우저 WebGL2 unavailable |

Browser 상세: B04 60→63, B07 60→63, WC02 60→61, WC02 +2d는 60→60을 확인했다. WC target을 WC01으로 바꾸고 음수 지연 오류를 확인했다. Scenario preview cursor D63에서도 Twin cursor는 D25였다. Twin에서 Day40으로 이동한 후 Production/Quality overlay는 D63 결과를 유지했다. Reset 후 Twin overlay는 사라졌다. Block 선택과 기존 Timeline reset/play/pause가 동작했다. Overview/Production/Quality/Simulation/Insight/Twin page 표시는 확인했다.

실제 UI 캡처: `docs/captures/P09_B04_simulation.jpg` (3D 렌더링 증거가 아님).

## 9. Test Scenario Results

| 시나리오 | Baseline | Scenario | 납기 영향 | Target Float 소비 | 변경 Task | 영향 Block | Critical Path |
|---|---:|---:|---:|---:|---:|---:|---|
| B04 Welding Rework +3d | 60 | 63 | +3d | 0d | 24 | 9 | 유지 |
| B07 Material Delay +5d | 60 | 63 | +3d | 2d | 6 | 9 | 변경 |
| Main erection slot +2d, D24–26 | 60 | 62 | +2d | 0d | 23 | 9 | 유지 |
| Weather shutdown +2d, D24–26 | 60 | 62 | +2d | 0d | 23 | 9 | 유지 |
| WC02 Installation +3d | 60 | 61 | +1d | 2d | 10 | 0 | 변경 |
| 추가: WC02 Installation +2d | 60 | 60 | +0d | 2d | 5 | 0 | 동시 Critical Path 추가 |

B04는 E-B04가 이미 임계 경로이므로 +3일이 그대로 전달된다. B07는 OUTFIT 시작 D40→D45, 종료 D50→D55가 되어 CCS 완료 D52를 3일 초과한다. WC02는 WC_TEST 완료 D50→D53이 되어 commissioning의 기존 준비일 D52를 1일 초과한다. 예시 기대값에 맞추기 위한 dependency/기간 변경은 하지 않았다.

## 10. Known Limitations

- 교육용 Mock Schedule, Simulation Block, Assumed Dependency, 60일 timeline이다. 실제 LNGC 건조기간이 아니다.
- B04의 별도 weld/NDT/rework Task를 새로 만들지 않고 P03 preset의 E-B04 allowance를 사용한다.
- Material delay는 need-by 기준 추가 지연이다. P08의 D43 stock arrival 가정을 P02 baseline에 몰래 합치지 않는다.
- OUTFIT, WC 작업은 공유 package 단위여서 개별 Block/WC 독립 분할보다 영향 범위가 넓을 수 있다.
- 단일 scenario 실행을 제공한다. Preset comparison은 독립 실행이며 복수 사건 합성은 미구현이다.
- 자원 leveling/비FS/작업일 휴일 calendar/실제 기상 기준/실적 잠금/ERP·MES/API/검증 비용모델은 없다.
- Geometry는 baseline pose이며 scenario 4D animation 전환은 미구현이다. Scenario timeline·outline overlay는 별도다.
- Scenario는 메모리에 유지된다. 새로고침/새 세션에는 초기화된다.
- 관리형 미리보기와 Next build가 생성 타입 폴더를 공유하므로 동시에 실행하지 않는다.

## 11. Next Step — PROMPT 10

핵심 순수 엔진과 UI·데이터 연결은 구현됐다. P10은 WebGL 지원 환경에서 실제 3D overlay/선택/카메라를 검증하고, Windows 실행, 모바일·키보드 회귀, package 범위 해설 및 포트폴리오 데모 시나리오를 정리할 수 있다. 추가 엔진 확장은 별도 requirement로 실제 진척 잠금, 다중 사건, 세분화된 resource/calendar 모델을 정의한 후 진행해야 한다. PROMPT 10은 자동으로 시작하지 않았다.
