# PROMPT 06 — 구현 및 검증 상태

## 결론

Three.js / React Three Fiber 모델과 선택·카메라 UI를 구현했으며 TypeScript, ESLint, Next.js production build, 데이터 무결성, 정적 route smoke 검사는 통과했다. **필수 실제 3D 시각 검증은 미완료**다. 검증 브라우저에서 GPU/WebGL이 Disabled여서 WebGL context 생성이 거부됐다. 3D 실루엣·회전·레이캐스트·성능이 검증됐다고 주장하지 않는다. Prompt 07 착수 전 WebGL 지원 환경에서 아래 체크리스트를 통과해야 한다.

## 생성 파일

- components/twin/VesselScene.tsx: client Canvas, 밝은 조명, OrbitControls, resize 대응 fit.
- components/twin/VesselModel.tsx: VesselRoot 및 주요 계층.
- components/twin/HullModel.tsx: P02 station 기반 연속 외피를 기존 B01–B09 경계로 분리.
- components/twin/CargoTankModel.tsx: 4개 chamfered membrane volume, 대표 dome, 블록 소유 weather cover.
- components/twin/AccommodationModel.tsx: 3단 aft accommodation, bridge/window band, funnel, mast, lifeboat, cutaway engine envelope.
- components/twin/WindChallengerModel.tsx: WC01/WC02, pedestal, ROTATION_FRAME, 3단 곡면 hard sail, 대표 control/electrical/sensor.
- components/twin/DeckEquipmentModel.tsx: 두 대표 배관 경로, manifold, winch, railing, lookout.
- components/twin/ModelParts.tsx: 선택 및 공통 재질 primitives.
- lib/three/constants.ts, materials.ts, geometry.ts, camera.ts: 기준·metadata·통합 색상·geometry factory·카메라 fit.
- docs/P06_IMPLEMENTATION_REPORT_KO.md: 본 보고서.

## 수정 파일

- components/twin/VesselViewer.tsx: 기존 placeholder adapter를 동적 Canvas로 확장. WebGL 미지원 안내.
- components/twin/SelectedObjectPanel.tsx: 기존 블록 정보 유지, 탱크/WC/거주구 선택 정보 추가.
- application/TwinContext.tsx: 기존 필드와 동작 보존, selectedObject/selectObject를 추가하여 scene 선택과 기존 block 선택을 연결.
- app/twin/page.tsx, app/globals.css: Viewer 문구 및 controls/고정 높이 스타일.
- README.md: P06 실행·제한 안내.

Domain schema, data/*.json, route, production/quality 계산, Timeline cursor 동작, simulation validation, CPM/backend는 변경하지 않았다. package.json/lockfile도 변경하지 않았다.

## 모델링 계약 및 충돌 처리

P02 우선: +X 선수, +Y 상방, +Z 우현. 원점은 선미 baseline이며 X=294.9가 선수다. 이번 프롬프트의 Z-up 권장안으로 바꾸지 않았다.

LOA 294.9 m / breadth 46.4 m / 174,000 m³ / WC 2기는 기존 P02의 VERIFIED 값을 사용한다. 이번 단계에서 실선 제원을 재검증한 것은 아니다. hull height 26.5 m, 4개 탱크 구역, 49 m 표시 전개 높이의 datum, pedestal·stage·배치 상세는 ASSUMPTION이다. 단면·탱크 mesh 부피를 174,000 m³에 억지로 맞추지 않는다.

P02가 명시적으로 배제한 bulbous bow는 추가하지 않았다. 유압 구동방식은 unknown이므로 hydraulic mesh와 가상의 설치 상태를 생성하지 않았다. WC는 원통 rotor가 아닌 폭 15/14.5/14 m, 각 높이18 m, 시작높이0/15.5/31 m의 얕은 곡면 3단 hard sail이다. 두 기초는 X=.87L, Z=±11, Y=26.5다.

## Three.js 구조 및 데이터 연결

VesselRoot 아래 Hull(9 shell groups), CargoArea(4 tanks 및 block-associated covers), AftArea(Accommodation, Engine envelope), DeckEquipment, WindChallenger(WC01/WC02)를 둔다. 각 선택 root userData는 objectId/entityId/vesselId/objectType/selectable/geometrySource를 포함한다. 기존 Bxx/SHELL ID를 재사용한다. Tank는 Txx/CARGO_VOLUME, WC는 WC01/WC02, 거주구는 B08/ACCOMMODATION이다.

기존 ThreeObjectMetadata는 변경하지 않았고 view-layer ViewerMetadata가 VESSEL_COMPONENT를 추가 지원한다. 새 ID는 renderer registry이며 기존 physical-objects JSON의 등록값이라고 주장하지 않는다. WC hostBlockId와 탱크 relatedBlockIds는 기존 데이터 연결 기반이다. production 상태는 기존 block 데이터에서만 표시하고 WC/tank에는 미계산으로 표시한다.

## 상호작용 및 성능 설계

- Orbit, zoom, pan, damping.
- Reset, Fit, Side, Front, Top; 전체 선박+돛 envelope와 viewport aspect에 맞춘 camera fit.
- mesh click highlight, 동일 metadata를 사용하는 keyboard-accessible object selector.
- Cutaway는 갑판/cover를 숨기고 shell을 반투명화하여 내부 탱크를 표시한다. 반투명 shell raycast는 차단하지 않는다.
- Axes 보조 표시. timeline과 완성형 geometry는 독립이며 4D 동작으로 오인하지 않게 표시한다.
- demand rendering, DPR 최대1.5, 저분할 geometry, useMemo, real-time shadow 제외. 프레임레이트 실측은 미완료.
- WebGL 2 불가 시 사전 탐지하여 페이지 전체 오류를 방지하고 정보 패널을 유지한다.

## 검증 결과

| 검사 | 결과 |
|---|---|
| TypeScript tsc --noEmit | PASS |
| ESLint | PASS |
| Next.js build --webpack | PASS; 기존 6 route 및 / 정적 생성 |
| data integrity | PASS; 9 blocks, 76 tasks, 107 FS dependencies |
| static HTTP smoke | PASS; 7 routes, CSS, 404 |
| 브라우저 Twin/Overview 표시 | PASS; WebGL 미지원 안내와 기존 Light UI |
| WC01, WC02, T02 selector → panel | PASS |
| T02 → Inspect B04 → 기존 block info | PASS |
| 실제 3D rendering / silhouette | BLOCKED; GPU/WebGL Disabled |
| Orbit/zoom/pan/raycast/viewport fit 실측 | 미검증 |
| Console | 최초 WebGL 생성 오류 확인. 사전 탐지 처리 추가 후 미지원 안내 표시. 브라우저 확장 metadata 오류는 별도. |

브라우저의 Next/Vinext 미리보기는 개발용이며 production bundle에서의 WebGL 실행도 로컬 확인이 필요하다. 실제 3D 캡처 대신 현재 브라우저의 WebGL 미지원 상태를 캡처했다. 이를 모델 렌더링 결과로 해석하지 않는다.

## 실행 및 남은 수락 검사

Windows: 압축 해제 → start-dev.bat 더블클릭 → localhost:3000/twin. Node.js 22.13+ 및 pnpm 필요. 서버 창 유지. 또는 pnpm install --frozen-lockfile, pnpm dev.

WebGL-enabled Chrome/Edge에서 전체 선체·탱크4개·WC2기·aft structure 확인, orbit/zoom/pan, Reset/Fit/각 view, 5종 객체 클릭, Cutaway, window resize, console error 확인이 필요하다. 화면 밖 clipping이나 장비 겹침 발견 시 geometry/camera를 조정한 후 P06 승인한다.

## Prompt 07 준비

9개 shell geometry는 동일 station 함수를 공유하므로 틈 없이 u 경계로 연결된다. 다음 단계에서 블록별 로컬 pivot(Xc,0,0), staging transform, construction visibility를 연결한다. cover는 block ID에 연결되지만 현재 CargoArea 아래에 배치되어 있으므로 assembly transform 때 해당 block root로 재부모화한다. tank는 block 소유가 아니며 CCS가 4 tanks를 참조한다. WC foundation은 WC 소유, host=B02이다. 이미 존재하는 state를 보존하며 순수 Timeline resolver만 추가한다. **P07 진행 승인은 P06 실제 WebGL 시각 검증 이후**다.
