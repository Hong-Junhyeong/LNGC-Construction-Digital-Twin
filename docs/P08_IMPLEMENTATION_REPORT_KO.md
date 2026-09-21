# PROMPT 08 구현 및 검증 보고서

## 1. Implementation Summary

- `lib/twin/block-operations.ts`: P03 fixture와 P07 계획 snapshot을 Block ID로 결합하는 순수 resolver를 추가했다.
- `application/TwinContext.tsx`: `operationalStates`와 집계 KPI를 기존 `currentDay`, `selectedBlock` 상태에 연결했다.
- `components/twin/ConstructionBlockPanel.tsx`, `BlockIndex.tsx`: 생산·자재·용접·NDT·NCR·Rework·일정 context와 NCR 요약을 표시한다.
- `components/production/ProductionDashboard.tsx`: Day-aware KPI, block table, material shortage/Need-by, resource와 일정 context를 연결했다.
- `components/quality/QualityDashboard.tsx`: 품질 chain, KPI, block quality table, release detail을 공통 상태에 연결했다.
- `components/dashboard/DayContextBar.tsx`: Production과 Quality에서 Day0/25/40/60 공통 계획 preview를 바꾼다.
- `tests/validate-operations.mjs`: 9개 block 계약과 Day25/40 전환을 검사한다.
- `app/globals.css`, `AppShell.tsx`, `README.md`: P08 UI와 provenance 설명을 보완했다.

## 2. Data Architecture

정적 `Block` 정의와 동적 `BlockOperationalState`를 분리했다. 기존 JSON schema를 복제하거나 수정하지 않았다.

`Block.entityId` → P07 `BlockState` → P03 `Production` / `MaterialRequirement` / `Material` / `Quality` / `Dependency` / `ResourceAllocation` 순으로 join한다. 결과는 Production, Quality, Twin UI에 동일 객체 배열로 제공된다.

계획 stage/progress는 `DERIVED`, 블록·일정 정의는 `ASSUMPTION`, 운영 record는 `MOCK`이다. Day25 기록 진척은 `recorded`에 보존되어 계획 preview와 구분된다.

## 3. UI Integration

- Twin: 선택 Block panel에 Production, Material, Welding, NDT, NCR, Rework, predecessor/successor, resource를 표시한다.
- Block Index: 같은 Block ID의 stage/progress와 Open NCR을 요약한다.
- Production: 공통 resolver의 계획 progress/stage, material readiness, 일정과 status를 사용한다.
- Quality: 동일 resolver의 welding/NDT/NCR/rework/gate를 사용한다.
- Production/Quality에서 Block을 선택하면 `selectedBlock`이 유지되어 Twin으로 이동했을 때 같은 Block을 표시한다.

## 4. Timeline Integration

`currentDay` 변경 시 P07 construction snapshot을 먼저 계산하고, P08 operational resolver가 이를 입력으로 상태를 다시 계산한다.

- Day25 B04: `ERECTED`, 75% planned, `QUALITY_HOLD`, NDT HOLD, NCR 1 open, quality gate BLOCKED, rework 48 MH planned.
- Day26–29 B04: REWORK / REINSPECTION 상태와 완료 rework MH를 교육용 선형 값으로 표시한다.
- Day40 B04: `OUTFITTING`, 87.5% planned, NDT PASS, NCR 1 closed, rework 48 MH completed, gate RELEASED.
- B07 material: 가정된 Day43 입고 전 80%, 20 KIT shortage이고 이후 100%가 된다.

품질 event는 표시용 assumption이며 일정 지연을 전파하지 않는다.

## 5. Validation

| 항목 | 결과 |
|---|---|
| TypeScript | PASS |
| ESLint | PASS |
| Data validation | PASS — 9 blocks, 76 tasks, 107 FS dependencies |
| Operations validation | PASS — 9 contracts, Day25/40, B07 shortage, provenance |
| Timeline validation | PASS — 경계, 이동, 역방향 결정성, 단조 진척 |
| Static route smoke | PASS — 7 routes, stylesheet, 404 |
| Next.js production build | PASS — 7 static application routes |
| Browser runtime | PASS — Production/Quality/Twin 상태와 선택 동기화 |
| Console | App error 없음; Cloud Browser extension metadata error만 관찰 |
| 3D visual validation | NOT VERIFIED — 검증 브라우저에서 WebGL2 unavailable |

Browser에서 Production B07 선택, Production Day40 B04, Quality Day40/Day25 B04, Twin dropdown B04, Block Index B01–B09 순차 선택을 검사했다. Production Day25 B04와 Quality/Twin 모두 Hold, NCR 1, Rework 48 MH 계획을 표시했다.

## 6. Existing Issues

- WebGL2 비활성 환경에서는 실제 mesh highlight/click과 3D 색상 변화 검증이 불가능하다. 기존 fallback은 정상이다.
- 관리형 preview와 Next typecheck/build를 동시에 실행하면 `.next` 생성 타입이 충돌할 수 있다. preview를 종료하고 생성물을 정리한 뒤 최종 전체 검증은 PASS했다. README의 동시 실행 금지 안내를 유지한다.

## 7. Known Limitations

- 모든 생산·자재·용접·NDT·NCR·Rework 값은 교육용 Mock/Assumption이다. 실제 조선소 데이터가 아니다.
- Weld count는 검사 scope의 단순 표현이며 실제 WPS/PQR 또는 용접 seam 정보를 뜻하지 않는다.
- Actual start/finish, schedule float, critical path는 계산되지 않아 `null` / `Not calculated`로 유지한다.
- Delay propagation, CPM, resource optimization, ERP/MES 연동, backend API는 구현하지 않았다.
- B04 품질 release와 B07 material availability는 P08 UI 상태 전환이며 납기 영향은 계산하지 않는다.

## 8. Next Step

PROMPT 09는 `BlockOperationalState`를 scenario baseline snapshot으로 사용할 수 있다. Scenario target의 Block ID와 task ID를 찾아 Welding Rework 같은 입력을 적용하고, 별도의 schedule engine이 task 기간과 dependency graph를 계산한 뒤 `SimulationResult`를 생성해야 한다. Baseline snapshot과 scenario snapshot을 분리하고, P08의 Mock/Assumption provenance를 유지해야 한다.
