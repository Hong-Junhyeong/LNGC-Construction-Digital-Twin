# Architecture — P10
## 유지한 구조
Next.js App Router / React / TypeScript / static JSON repository / pure calculation modules / React Three Fiber adapter. 새 상태관리 라이브러리, API, DB, route는 추가하지 않았다. 도메인 schema와 mock JSON은 변경하지 않았다.

| 계층 | 구현 |
|---|---|
| Presentation | app routes, dashboard/twin/production/quality/simulation/insight components |
| Application | application/TwinContext.tsx |
| Domain | types/domain.ts |
| Engine | lib/twin/block-state.ts, block-operations.ts, lib/simulation/* |
| Repository | data/repository.ts + normalized JSON |

## 공유 상태
currentDay, selectedBlock, selectedObject, timelineMode, selectedScenario, scenarioType, scenarioDraft, simulationResult는 기존 TwinProvider에서 관리한다. baselineSchedule은 immutable 계산 결과다. scenarioDelivery/delay/affectedTasks/criticalPath는 simulationResult에서 읽으며 중복된 별도 mutable state를 두지 않는다.
mode는 PLANNED_PREVIEW; 활성 simulationResult는 별도 SCENARIO overlay다. baseline pose와 scenario 계산을 혼합하지 않는다. 시나리오 입력 문자열도 context에 보존해 invalid/빈 draft와 페이지 이동을 안전하게 처리한다.
prepareScenario(type,target)는 이전 결과와 scenario ID를 지우고 명시된 대상을 준비한다. reset은 result/selection of scenario를 제거하며 currentDay를 유지한다.
선택 ID를 검증하고 unknown ID는 null로 정규화한다. vessel object 선택 해제 시 block도 해제한다. tank/WC 선택 시 관련 block을 암묵적으로 선택하지 않으며 명시적인 Inspect block action을 사용한다.
상태는 페이지 이동 동안 유지되며 브라우저 새로고침·URL 공유 복원은 미구현이다.

## 3D lifecycle
Canvas는 viewer 당 하나, client-only dynamic import와 WebGL2 preflight 및 React error boundary를 유지한다. geometry/카메라 배치는 보존했다.
- memo로 생성한 hull/deck/tank/cover geometry: dependency 교체 또는 unmount 시 explicit dispose.
- JSX geometry/material: R3F reconciler 소유 및 dispose.
- RendererLifecycle: unmount 시 setAnimationLoop(null), gl.dispose.
- R3F root: inactive, event disconnect, renderLists disposal, forceContextLoss, scene dispose 및 root 삭제 (설치된 라이브러리 소스 확인).
- Drei OrbitControls: effect cleanup에서 controls.dispose.
- useFrame subscription, Canvas resize observer: framework lifecycle 소유.
- Block reduced-motion listener, timeline interval, simulation timeout: effect cleanup 유지.
실제 GPU 누수/3D nav remount 시각 검증은 WebGL 환경 제약으로 미완료다.
