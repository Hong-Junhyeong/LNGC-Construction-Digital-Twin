# PROMPT 13 구현 및 검증 보고서

## 1. 변경 사항

기존 P02–P12 구조를 유지하면서 프로젝트 달력 기반 Master Schedule, normalized 3D Playback, 고정 도크/반목, 블록 staging-to-erection 이동을 분리 구현했다.

## 2. Master Gantt

- 2025-01-06을 상대 기준일로 하는 41개 작업, 52개 FS 의존성, D1070 인도 기준선을 추가했다.
- 설계·조달·생산·탑재·시스템·시운전·인도 7개 그룹과 28개 공정 구조를 표시한다.
- 날짜, 상대일, 선행 작업, 주 단위 grid, 90일 scale, phase color, milestone을 제공하며 수평 스크롤을 지원한다.
- 모든 기간은 `ASSUMPTION`이며 실제 조선소 계약 일정이 아니다.

## 3. 설계/생산 중첩

Basic Design early release 이후 Detailed Design, Production Design, Steel Procurement가 중첩된다. Production Design early package와 steel receipt가 준비되면 Plate Preparation이 시작되고, Pre-Outfitting은 후반 생산과 병행된다.

## 4. Commissioning / Sea Trial / Delivery

`PRECOM → SYS_COM → INT_COM → FINAL_INSPECTION → SEA_TRIAL → FINAL_ACCEPTANCE → DEL` 의 명시적 의존 체인을 구성했다. Pre-Commissioning은 late outfitting과 제한적으로 중첩되며 Integrated Commissioning은 OUTFIT, CCS, WC_LIFT 및 system commissioning 완료 후 시작한다.

## 5. 도크 지지대

`DockModel`이 floor, 양측 staging lane, `DOCK/SUPPORT_01`–`30`을 소유한다. 반목은 VesselModel/선체 블록과 분리된 scene sibling이며 `fixedToDock: true`와 독립 transform을 갖는다.

## 6. Block staging → erection

각 B01–B09 블록에 assembly, staging, final 위치를 정의했다. Erection 구간은 lift 20%, horizontal translation 45%, lowering 17%, final seating 순으로 보간한다. crane 상세 animation은 범위에서 제외했다.

## 7. 60-step Playback

UI의 Day 0–60 표현을 `3D CONSTRUCTION PLAYBACK · STEP 0–60`으로 변경했다. Playback은 steel/fabrication, staging, erection, cargo containment, outfitting, machinery, WAPS, commissioning의 형상 상태만 제어한다.

## 8. Master Schedule ↔ Playback

`MasterScheduleTask`는 calendar date, predecessor/successor, classification, 3D visibility, playback start/end를 함께 보유한다. CPM은 calendar day만 사용하고, block/system renderer는 playback mapping만 읽는다.

## 9. What-If / Critical Path

기존 scenario engine을 Master Schedule 입력으로 전환했다. 기준 D1070에서 B04 Welding Rework +3.5d는 D1073.5, 21개 영향 작업으로 전파된다. Playback step은 납기 지연 계산에 사용되지 않는다. Overview의 Baseline Critical Sequence도 유지했다.

## 10. Build 결과

- `npm run typecheck`: PASS
- `npm run lint`: PASS (0 error, 0 warning)
- `npm run validate:data`: PASS
- `npm run validate:operations`: PASS
- `npm run test:simulation`: PASS
- `npm run build`: PASS, 7개 업무 route 포함 9개 정적 page 생성

## 11. Browser / WebGL 검증

Chrome preview에서 Overview, 3D Twin, Production, Quality, Simulation, Insight를 모두 열었고 application runtime error 및 page overflow가 없음을 확인했다. Production Gantt는 7개 group과 41개 row로 렌더링되었다. 브라우저에서 B04 +3d scenario를 실행해 D1073 결과를 확인했다.

검증 환경은 WebGL 2를 제공하지 않아 실제 3D 픽셀, 카메라, raycast, 블록 이동과 고정 반목의 시각적 완료 판정은 할 수 없었다. WebGL fallback은 정상 표시되며, 3D 계층과 transform은 코드로 검증했다.

## 12. 남은 제한

- Master Schedule과 B01–B09는 교육용 가정이며 실제 Hanwha Ocean 생산계획이 아니다.
- 24×7 elapsed-day model로 휴일/shift/resource leveling을 모델링하지 않는다.
- Block lift는 개념적 경로이며 rigging, crane kinematics, collision, 구조/안전 계산을 포함하지 않는다.
- WebGL 가능한 desktop에서 Reset/Fit/Side/Front/Top/Cutaway, block movement, support fixation을 최종 시각 확인해야 한다.

## 13. 주요 변경 파일

- `data/master-schedule.ts`
- `types/domain.ts`
- `lib/simulation/project.ts`, `scenarios.ts`, `simulate.ts`
- `lib/twin/block-state.ts`
- `components/production/MasterGantt.tsx`, `ProductionDashboard.tsx`
- `components/twin/DockModel.tsx`, `VesselScene.tsx`, `SystemPresence.tsx`, `Timeline.tsx`
- `application/TwinContext.tsx`
- `components/layout/AppShell.tsx`
- `components/dashboard/Overview.tsx`, `DayContextBar.tsx`
- `components/simulation/*`, `components/quality/QualityDashboard.tsx`, `components/insight/InsightDashboard.tsx`
- `app/globals.css`, `tests/validate-simulation.mjs`, `README.md`
