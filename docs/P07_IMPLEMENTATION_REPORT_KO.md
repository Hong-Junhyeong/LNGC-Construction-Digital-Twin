# PROMPT 07 — Block Segmentation + 4D Construction Timeline

## 1. Implementation Summary

기존 P06 geometry와 P02/P03 fixture를 보존하고 계획 시간에서 블록 상태·진척·위치를 결정하는 순수 resolver를 연결했다. 3D 그룹, Block Index, Construction Flow, Selected Panel, Header가 TwinContext의 한 snapshot을 공유한다.

생성: `lib/twin/block-state.ts`, `components/twin/BlockModel.tsx`, `BlockIndex.tsx`, `ConstructionBlockPanel.tsx`, `SystemPresence.tsx`, `tests/validate-timeline.mjs`, 본 보고서.

수정: `application/TwinContext.tsx`, `components/twin/HullModel.tsx`, `CargoTankModel.tsx`, `VesselModel.tsx`, `ModelParts.tsx`, `WindChallengerModel.tsx`, `VesselViewer.tsx`, `SelectedObjectPanel.tsx`, `Timeline.tsx`, `lib/three/camera.ts`, `components/layout/AppShell.tsx`, `app/twin/page.tsx`, `app/globals.css`, `README.md`.

기존 domain 타입, data JSON, 76개 task, 107개 dependency, package/lockfile, route와 production/quality/simulation 계산은 보존했다. 새 backend나 CPM/지연전파를 추가하지 않았다.

## 2. Block Architecture

Hull 아래 B01–B09 Group이 각각 존재한다. 각 그룹은 `(Xc,0,0)` 기준 local pivot을 갖고, P06의 world-coordinate geometry를 내부 `-Xc` 변환으로 재사용한다. 연속 선체 station 규칙과 비균등 u 경계는 그대로다.

외피, 갑판, 블록별 weather cover 및 B01 forecastle은 해당 그룹으로 묶어 함께 이동한다. P06에서는 CargoArea에 있던 cover를 Hull block 소유로 이동해 분리 이동 시 갑판이 남는 문제를 해결했다. tank volume/dome은 별도 T01–T04로 한 번씩만 존재한다. WC01/WC02도 별도 시스템이며 host=B02다.

기존 objectId=`Bxx/SHELL`, entityId=`Bxx`, objectType=`BLOCK_COMPONENT`를 유지하고 group userData에 blockId/stage/progress/qualityStatus/progressBasis를 추가한다. simulation block은 공식 Hanwha Ocean block plan이 아니다.

## 3. Timeline Architecture

`currentDay → getConstructionSnapshot → getBlockState`로 매번 snapshot을 계산한다. `blockStates`를 독립 mutable state로 복제하지 않는다. productionStage는 기존 `ProductionStage`를 재사용한다. `QUALITY_HOLD/REWORK`는 공정 단계가 아닌 별도 품질 overlay다.

일정은 기존 FAB/SUB/BA/ASM/QG/E task 및 HULL_GATE/OUTFIT을 읽는다. 구간은 `[start,finish)`이며 finish 시점에는 다음 공정으로 넘어간다. ERECTED는 탑재 완료일 뿐 전체 block 완료가 아니며 OUTFIT 종료 Day50에 COMPLETED가 된다. 선박 인도 Day60과 구분한다.

계획 진척은 block당 8개 task(FAB/SUB/BA/ASM/QG/E/HULL_GATE/OUTFIT)의 정규화된 표시 진척을 동일 가중치로 평균한다. 이는 ASSUMPTION에 근거한 DERIVED 값이며 earned value, 실제 물량·노무 진척이 아니다. 전체 진척은 9개 block 평균이다. Overview의 기존 Day25 MOCK KPI 68%는 변경하지 않았다.

## 4. 4D Movement

P02 좌표(+X 선수/+Y 상방/+Z 우현)와 위치 규칙을 따른다.

| Anchor | 좌표 |
|---|---|
| final | `(Xc,0,0)` |
| assembly | `(147.45+1.2*(Xc−147.45),0,140)` |
| staging | `(147.45+1.2*(Xc−147.45),0,70)` |

미착수는 final ghost, FAB~INSPECTION은 assembly, 대기는 staging이다. ERECTION 첫25% 동안 smoothstep으로 final까지 이동하고 나머지는 final에서 접합한다. 정방향/역방향 모두 같은 Day에 같은 목표 pose를 반환한다. React Three Fiber frame에서는 짧은 exponential interpolation으로 목표를 따라가며 정착 후 demand rendering을 멈춘다. Reduced motion 사용 시 즉시 목표 위치를 적용한다.

카메라 fit 범위를 assembly lane까지 확대했다. Day 변경이 사용자 카메라를 매번 초기화하지 않는다. block 공정색은 공통 palette에서 읽고, 선택은 amber 윤곽, 품질은 red/orange 윤곽·pin·문구로 별도 표시한다.

탱크(CCS), accommodation(ACC), deck equipment(OUTFIT), WC foundation/install/lift/electrical/control은 각 기준 task 이전에는 final-anchor ghost, 설치 구간부터 opacity를 높인다. 운송 중인 hull block에 시스템이 자동 탑승하지 않는다. 시스템의 정확한 설치 순서는 교육용 표시이며 P08/09 확장 대상이다.

## 5. UI Synchronization

- slider, Previous/Next, 2일/초 Play, Pause, Reset(Day0), 주요 Day 바로가기가 같은 currentDay를 갱신한다.
- Day60에서 자동 정지하며 Day60에서 다시 Play하면 Day0부터 시작한다. 백그라운드 tab은 자동 진행을 보류한다.
- Block Index와 mesh 선택은 기존 selectBlock/selectObject를 공유하여 highlight/panel을 연결한다.
- 패널 상단은 현재 Day의 planned state/progress/target position이다. 하단은 기존 Day25 mock(진척85%, 품질 HOLD, NCR, rework MH 등)을 명확히 분리한다.
- `/twin` Header는 SIMULATION · DAY n, 다른 운영 페이지는 STATIC MOCK · DAY25를 유지한다.
- B04 품질 이벤트는 **새 ASSUMPTION**: Day24–26 HOLD, Day26–29 REWORK, Day29 이후 표시 해제. 실제 품질 이력이나 baseline 변경이 아니고, 48MH를 날짜로 환산하지 않는다. 지연 flag는 계산하지 않아 전부 false다.

## 6. Validation

### Code Validation

TypeScript, ESLint, Next.js production build, 기존 data validation 및 static route smoke PASS. 새 resolver test는 P02의 B03 경계 날짜, B04 E22–24·품질 이벤트·22.25일 이동, 9개 block의 0.25일 단위 진척 범위/단조성, 역방향 결정성, 입력 불변성을 검사하여 PASS했다.

| Day | 전체 계획 진척 | B04 공정 | 품질 overlay | B04 목표 Z |
|---|---:|---|---|---:|
| 0 | 0% | NOT_STARTED | NONE | 0 |
| 15 | 40.6% | GRAND_ASSEMBLY | NONE | 140 |
| 25 | 66% | ERECTED | QUALITY_HOLD | 0 |
| 40 | 87.5% | OUTFITTING | NONE | 0 |
| 60 | 100% | COMPLETED | NONE | 0 |

Day25에 전체 COMPLETED 블록을 억지로 만들지 않았다. 원래 P02 완료 정의와 날짜를 우선한다.

### Browser / 3D Visual Validation

브라우저에서 `/twin`을 직접 열고 slider Home→ArrowRight25회→추가15회→End로 Day0/25/40/60을 확인했다. UI에서 D25 B04 QUALITY HOLD75%, D40 OUTFITTING87.5%, D60 모든 block COMPLETED100%를 확인했다. 정적 mock85%는 유지됐다.

**WebGL 2 unavailable** 안내가 확인됐다. 따라서 실제 선박 형상, mesh 이동/색상, raycast, orbit/zoom과 timeline의 시각적 충돌, GPU 성능은 **NOT VERIFIED**다. UI 상태 검사나 unit test를 3D 시각 검증으로 표현하지 않는다. 최종 브라우저 재생/선택 검사 결과는 아래 보충 기록에 정리한다.

### 브라우저 보충 기록

- Overview / Production / Quality / Simulation / Insight / Twin navigation 및 페이지 제목 표시 PASS.
- Day0에서 재생 후 Day60 도달 및 자동 정지 PASS. 재생 중 Day29에서 Pause 후 날짜 유지 PASS.
- B07 index 선택 → panel 동기화, dropdown B04/SHELL 선택 → index 선택 표시 동기화 PASS.
- Next / Previous / Reset0 PASS. 검사 후 Day25로 복귀했다.
- 확인한 console 로그에서 app 오류는 관찰되지 않았으며, 브라우저 확장 metadata 오류만 있었다.
- 화면 캡처는 브라우저 screenshot timeout으로 확보하지 못했다. DOM 기반 검사와 실제 3D 시각 검증은 구분한다.

## 7. Existing Issue

- 기존 WebGL Disabled: 환경 제한 지속. P06 preflight fallback 유지하여 dashboard runtime crash를 방지한다.
- P06 완료형 화면 문구와 cursor-only 설명: P07 planned construction 문구로 갱신했다.
- 기존 weather cover의 block 이동 소유권: 동일 Hull block group으로 재배치했다.
- 기존 Timeline Reset이 Day25였던 동작: 요청대로 Day0으로 수정했다.
- TypeScript route generation은 기존 Next build에서 재생성하며 기존 framework 구조를 교체하지 않았다.

## 8. Known Limitations

교육용 60일 일정·야드 lane·진척 가중치·품질 이벤트이며 실선 생산 계획이 아니다. 계획 quality gate release는 가정이며 실제 Day25 BLOCKED 기록을 덮어쓰지 않는다. ghost 시스템은 정확한 시공량이 아니다. 지연/CPM/float 계산과 forecast는 미구현이다. 태블릿 실기기 및 실제 WebGL 4D 렌더링 검증은 남아 있다.

## 9. Next Step

P08은 Bxx/SHELL→Block→Production/Quality/MaterialRequirement/Task ID를 재사용하면 된다. 현재 panel에서 welding, pass/inspected, NCR, rework MH, material readiness, baseline E window를 조회한다. timeline preview와 관측 데이터의 기준을 계속 구분해야 한다. 자동으로 P08을 시작하지 않으며, 사용자 환경에서 `/twin`의 Day0→25→40→60 실제 3D 변화를 확인하는 절차가 남아 있다.
