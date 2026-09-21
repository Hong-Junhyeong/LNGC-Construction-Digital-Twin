# PROMPT 12 — Real Vessel Geometry Refinement Implementation

검증일: 2026-09-21 · 기준: P10 프로젝트 + P11 Refinement Specification + 사용자 P12 범위 제한.

**최종 상태: PARTIAL / WebGL acceptance 미완료.** 실제 소스 수정, 실행, 형상 수치 검사, 빌드 및 브라우저 UI 회귀 확인을 수행했다. 그러나 제공된 브라우저가 `WebGL 2 is unavailable`을 반환하므로 실제 3D 렌더링, 카메라별 외형, raycast, GPU 자원 검증을 완료했다고 주장하지 않는다. 아래 ‘구현’과 ‘시각 검증’을 구분한다.

## 1. Implementation Summary

기존 3D component 구조 안에서 공통 선형 sampler를 개선하고 선수 flare/rake, ellipsoid 구상선수, 상승하는 선미 선저와 generic 추진기·타·skeg를 구현했다. Accommodation 창, Funnel uptake, 배관 받침, mooring base, tank dome platform의 지지 연결을 수정했다. Cargo tank는 Cutaway에서 속이 빈 경계면을 보여주며, 기관실 장비는 내부 전용 MACH 패키지로 분리했다. Wind Challenger는 기존 WC01/WC02/3단 구조를 유지하면서 hollow section과 날짜 기반 수납·전개 표현을 구현했다.

기존 +X 선수 / +Y 높이 / +Z 우현, 선미 baseline 원점, metres 좌표계를 유지했다. B01–B09의 u경계와 finalPosition, T01–T04, WC01/WC02 identity를 바꾸지 않았다. UI 변경은 형상 가정 안내, WC 표시 상태, BUILD 12 표기에 한정했다.

모든 상세 형상은 **ASSUMPTION**이다. LOA 294.9 m, beam 46.4 m 등 공개 제원의 출처 구분은 P11을 따른다. 상세 CAD, actual tank plan, shaft count, 실제 엔진 대수·치수, WC datum/actuation을 새 사실로 승격하지 않았다. 공개 자료 재조사는 P12 범위에 추가하지 않았다.

P11은 구상선수 기본 보류를 제안했지만 P12 사용자는 구상선수 구현을 명시적으로 요구했다. 따라서 generic ASSUMPTION 형상으로 구현하고 화면과 코드에 근거 한계를 표시했다. P11의 crane/시공 애니메이션 backlog는 P12의 명시적 제외 범위에 따라 수행하지 않았다.

## 2. Modified Files

| 파일 | 수정 내용 |
|---|---|
| `lib/three/geometry.ts` | monotone station interpolation, height-varying hull ring, rake/flare/aft run, 촘촘한 surface, degenerate triangle 제거, deck opening, section cap, open tank cavity, hollow sail extrusion, deck surface lookup |
| `lib/three/camera.ts` | 기존 작업장 bounds 보존, 탑재 완료 시 vessel-only bounds 추가; 같은 Fit 알고리즘 사용 |
| `lib/three/materials.ts` | generic propeller의 중앙 소재 색 추가 |
| `components/twin/HullModel.tsx` | 공통 surface 사용, 분리 블록의 임시 cap, deck/cover 재질 구분, 선택 highlight와 appendage/forecastle의 기존 block 선택 연결 |
| `components/twin/HullAppendages.tsx` **신규** | B01 ellipsoid bulb, B09 generic shaft/propeller/rudder/skeg, UNKNOWN metadata |
| `components/twin/BlockModel.tsx` | NOT_STARTED mesh 숨김; 미선택 정상 블록의 외곽 box 줄임. 기존 pose/진척 계산 유지 |
| `components/twin/BlockSupports.tsx` **신규** | 선저 sample에 닿는 최소 교육용 cradle. 이동 중에는 표시하지 않음 |
| `components/twin/AccommodationModel.tsx` | 층별 창 부착, bridge 창 정렬, Funnel uptake, lifeboat 받침, 기관실 mesh 분리 |
| `components/twin/EngineRoomModel.tsx` **신규** | B08 host 확인, 내부 floor/boundary와 MACH 장비군, 정상뷰 비노출 |
| `components/twin/CargoTankModel.tsx` | Cutaway cavity, 개략 membrane boundary 선, 내부 pump proxy, dome platform 지지 연결 |
| `components/twin/DeckEquipmentModel.tsx` | deck/cover surface 기반 pipe rack, manifold branch support, mooring 높이 수정 |
| `components/twin/WindChallengerModel.tsx` | hollow nested 3단, 수납/전개, foundation plate, sensor 부착, height datum metadata, geometry dispose |
| `components/twin/SystemPresence.tsx` | 설치 전 ghost solid 숨김; 기존 package task/진척 연결 유지 |
| `components/twin/VesselModel.tsx` | 독립 EngineRoom 연결, 기존 Cargo/ACC/OUTFIT/WC 구성을 보존 |
| `components/twin/VesselScene.tsx` | cradle 연결, 탑재 완료 시 vessel bounds 적용; 기존 조명/Canvas lifecycle 유지 |
| `components/twin/VesselViewer.tsx` | geometry ASSUMPTION 안내 및 WC datum/수납 안내, 기존 controls 유지 |
| `components/twin/SelectedObjectPanel.tsx` | WC ‘항상 Fully deployed’ 고정 문구를 날짜별 상태로 수정, datum 한계 표시 |
| `components/layout/AppShell.tsx` | BUILD 12 / P12 표기만 변경 |
| `app/globals.css` | viewer provenance 안내의 작은 텍스트 스타일만 추가 |
| `tests/validate-geometry.mjs` **신규** | 실제 geometry 함수를 실행하는 CPU 형상·경계·normal·camera·ID 회귀 검사 |
| `README.md` | P12 상태, 실행/검증 방법, WebGL 제한, 로컬 수납/전개 확인법 |
| `docs/P11_Vessel_Shipbuilding_Refinement_Specification_KO.md` | 이전 P11 문서를 참조용으로 포함; 내용 수정 없음 |
| `docs/P12_IMPLEMENTATION_REPORT_KO.md`, `docs/captures/P12_Browser_Verification.jpg` | 본 보고서와 실제 브라우저 제한 화면 |
| `out/` | 최종 Next 정적 빌드 결과 |

Next 개발 서버가 `AGENTS.md`와 `CLAUDE.md`를 자동 생성했다. Next 자체 안내 파일이며 도메인이나 실행 논리를 변경하지 않는다. package.json, lockfile 및 의존성은 바꾸지 않았다.

## 3. Geometry Changes

| 부분 | 실제 코드 구현 | 근거/검증 한계 |
|---|---|---|
| Hull | 기존 seven-station planform을 기반으로 높이별 폭과 keel 변화, 18점 ring, 종방향 최대 0.005u 간격을 가진 surface | 교육용 offsets; 실제 lines plan 아님. 최대 폭·길이 및 seam 수치 검사 |
| Bow | 아래쪽 X를 뒤로 물리는 최대 4.4m rake, deck가 low-body보다 넓은 flare, 단면 taper | 선수의 수직 knife 표현 완화. 실제 화면 미검증 |
| Bulbous Bow | B01 하위 ellipsoid 중심 [288.7,5,0], scale [6.2,3,3], 최대 X294.9 | 사용자 요구에 따른 generic A; 실선 구상선수 확인으로 표현하지 않음 |
| Stern | aft run, transom 아래쪽 수렴, keel 상승; generic shaft/propeller/rudder/skeg | P11 초기안 transom keel6m를 proxy clearance를 위한9m로 조정(A). 실제 축계 대수/형상 UNKNOWN |
| Accommodation | 기존3단 본체 접촉 유지, 창을 각 층 외벽에 부착, bridge 창 길이 중심 수정, lifeboat 받침 추가 | 구조 변경 없이 지지 관계 수정; 세부 실선 치수 아님 |
| Engine Room | B08 탑재 이후 내부 floor/경계선, MACH 장비군과 bedplate. Cutaway에서만 렌더 | 단일 ‘장비군’ proxy이며 실제 엔진 한 대라는 뜻 아님. 바닥은26×18m로 줄여 선미 수렴부에서 외판 밖 돌출 방지 |
| Funnel | deck Y26.5부터 funnel bottomY43까지 uptake casing 추가 | 기존 funnel gap2.5m와 부분 footprint 지지 문제를 연속 casing으로 해소하도록 구현 |
| Cargo Area | deck tank footprint를 관통하는 face 제거, cover/roof 유지, pipe rack≤11m 간격, manifold branch support, 올바른 mooring deck 높이 | 배관 상세/전체 전장 모델 없음. support contact는 코드 좌표 검토이며 visual acceptance가 아님 |
| Cargo Tank | T01–04 유지; normal에서 내부 cavity 비표시, cutaway에서 roof/우현 측면이 열린 경계와 얇은 선 표현 | 막식 현장 시공 애니메이션 없음, 특정 GTT 제품을 주장하지 않음. 전체 tank 인양 없음 |
| Dome | 기존 cap 위 platform에 높이0.225m skirt 추가 | platform bottom34.85와 cap top34.625 사이 gap 연결 |
| Wind Challenger | 동일 B02 anchor, 2기, hollow curved shell3단, foundation plate, sensor mount, dispose 추가 | hard-sail WAPS 유지. Rotor/Samsung 장치로 대체하지 않음 |
| WC 상태 | D38–48 수납, D48–50 시험 전개, D50+ 전개. base/root3.5m+panel18m+offset27.5m=49m | **assumed deck-to-sail-top49m**, 실제 datum 미확인. 수납21.5m 역시 가정. 기존 WC_TEST 기간 안의 표시 함수 |
| Block supports | NOT_STARTED 형상 숨김, 정지 블록에 cradle, 분리면 cap 추가 | B01–09 finalPosition/순서/일정 유지. 크레인·인양·실제 dock 복원은 미구현 |

정상뷰의 ‘단순 block box’ 인상을 줄이기 위해 정상 미선택 블록의 외곽 bounding box를 숨겼다. 선택·품질 문제·시나리오 표시용 외곽선은 유지한다. 생산 stage 색상도 유지한다.

## 4. Object Hierarchy Changes

기존 `VesselRoot → Hull → B01…B09`를 유지하고 필요한 render-only children을 추가했다.

| 부모 | Children/역할 | 데이터 선택 소유자 |
|---|---|---|
| Hull / B01 | HULL_SURFACE, deck, forecastle, BULBOUS_BOW | `B01/SHELL` → B01 |
| Hull / B09 | HULL_SURFACE, PROPULSION_ZONE / shaft / propeller / rudder / skeg | `B09/SHELL` → B09 |
| Hull / 각 블록 | shell/deck/분리 cap/해당 weather cover | 기존 `Bxx/SHELL` |
| CargoArea / CCS | CargoTank01–04 / CARGO_VOLUME / MEMBRANE_BOUNDARY / dome | 기존 `Txx/CARGO_VOLUME` |
| ACC / AftArea | Accommodation / windows / uptake / funnel | 기존 `B08/ACCOMMODATION` |
| VesselRoot / EngineRoom | B08 구조 floor/boundary + MACH / MAIN_ENGINE_PROXY | 기존 `B08/ENGINE_ROOM` |
| WindChallenger / WC01,WC02 | FOUNDATION, ROTATION_FRAME / STAGE_BASE/MID/TOP, CONTROL, SENSOR | 기존 WC01/WC02 |
| scene / BLOCK_SUPPORTS | nonselectable 교육용 cradle | 신규 domain ID 없음 |

`objectId`, `entityId`, `vesselId`, `hostBlockId`, `relatedBlockIds`, `userData`와 Selectable ancestor의 선택 연결을 유지했다. 세부 부속물을 새로운 ERP/Production entity로 만들지 않았다.

## 5. Data Mapping Preservation

P10 ZIP과 비교한 **38개 보호 파일(app route·application·data·types·lib/twin·lib/simulation, globals.css 제외)은 byte-identical**이었다.

- Data Schema, Mock JSON, task/dependency/resource, scenario, canonical object catalog 변경 없음.
- 9 blocks / 76 tasks / 107 FS dependencies 유지.
- Baseline D60 / parallel critical paths4 유지.
- B04 D25: planned75%, recorded85%, welding92%, NDT38/40 HOLD, NCR1, rework48MH 유지.
- B04 +3.5d → D63.5, affected tasks24, block associations9, critical path unchanged.
- B07 +5d → D63, WC02 +3d → D61, WC02 +2d → D60 회귀 통과.
- Timeline pure resolver·quarter-day boundaries·reverse scrub·immutable schedule 검사 통과.
- Scenario geometry는 기존과 같이 baseline pose 위 별도 overlay다. scenario schedule로 pose를 재계산하도록 바꾸지 않았다.

## 6. Build / Runtime Verification

| 검증 | 결과 |
|---|---|
| `npm run dev -- --hostname 0.0.0.0` | Next 개발 서버 Ready 확인; 서버 프로세스 정상 종료 |
| 관리형 개발 미리보기 | 실제 앱 실행, 6개 workspace 브라우저 탐색 |
| `npm run build` | PASS · Next webpack compile / TypeScript / 9개 정적 output 생성 |
| `npm run typecheck` | PASS · 오류0 |
| `npm run lint` | PASS · 오류0 |
| `node tests/validate-data.mjs` | PASS |
| `node tests/validate-operations.mjs` | PASS |
| `node tests/validate-simulation.mjs` | PASS |
| `node tests/validate-timeline.mjs` | PASS |
| `node tests/validate-geometry.mjs` | PASS · CPU geometry 검사 |
| `npm run test:static` | PASS · exported application routes/stylesheet/404 |

초기 typecheck는 Next와 미리보기 어댑터가 공유하는 `.next/types`의 생성 타입 충돌로 실패했다. 개발 서버/미리보기를 종료하고 정식 Next build로 타입을 재생성한 후 최종 typecheck를 통과했다. 타입 오류를 숨기거나 tsconfig 검사 범위를 줄이지 않았다.

npm은 환경의 `http-proxy` 설정에 대한 deprecated config 경고를 출력했다. 앱 compile/런타임 오류는 아니다. 의존성을 새로 설치하거나 version을 바꾸지 않았다.

CPU geometry 검사는 실제 함수를 실행하여 finite vertices, nondegenerate triangles, outward port/deck normals, 인접 블록 동일 boundary vertices, hull envelope, bow flare/rake, rising stern, cavity/sail geometry, deck anchors, 3종 aspect ratio의 camera frustum, 기존 selectable IDs를 확인한다. CPU 검사 결과는 시각 검증이나 선박 설계 검증을 대체하지 않는다.

## 7. Browser / WebGL Verification

실제 브라우저에서 확인:

- Overview / 3D Twin / Production / Quality / Simulation / Insight 탐색.
- B04 선택 → Production75%/record85%/weld92% → Quality HOLD/NCR1/48MH 연결.
- Timeline D25→D60→D25 및 D0→D60. 전체 계획0%/100% 확인.
- T02 선택: `T02/CARGO_VOLUME`, 관련 B04/B05 표시.
- WC02 선택: ID/hostB02/unknown actuation 표시.
- Cutaway pressed 상태, Side/Front/Top/Fit/Reset 버튼 동작 처리. **Canvas 내부 변화는 미검증**.
- B04 +3.5 실행 → Day63.5 /24tasks /4paths, Insight 반영.
- Reset scenario → READY. 선택 해제 정상.
- 수집한 warning/error 중 앱 origin의 오류 없음. 브라우저 확장 `chrome-extension://…` metadata 전송 오류는 앱과 분리.

**WebGL 2 unavailable 때문에 Canvas/R3F 실제 실행 장면을 볼 수 없었다.** 3D screenshot을 조작하거나 SVG/생성 이미지로 대신하지 않았다. `captures/P12_Browser_Verification.jpg`는 실제 fallback 및 D60 UI 화면이며 완성 선박 render가 아니다.

형상 함수와 TSX compile은 통과했지만, WebGL 지원 환경의 runtime shader, draw, raycast, OrbitControls, transparency sorting, GPU memory는 여전히 검증 대상이다.

## 8. View-by-View Verification

| View | 코드/CPU 확인 | 실제 WebGL 화면 |
|---|---|---|
| Perspective / Reset | 기존 시점 유지, 탑재 완료 시 vessel-only envelope, 3종 aspect frustum 검사 PASS | **NOT VISUALLY VERIFIED** |
| Side | 선형/구상선수/선미 geometry 존재, camera frustum PASS | **NOT VISUALLY VERIFIED** |
| Front | beam46.4, WC anchors Z±11, camera frustum PASS | **NOT VISUALLY VERIFIED** |
| Top | cargo/deck openings/ACC/WC 배치 코드 확인, camera frustum PASS | **NOT VISUALLY VERIFIED** |
| Cutaway | tank cavity·MACH 내부·deck/cover 조건부 표시, 기존 ID 보존 | **NOT VISUALLY VERIFIED** |
| Fit | 작업장/완성선 bounds, 종횡비 .6/1/2에서 projection 검사 PASS | **NOT VISUALLY VERIFIED** |

사용자가 요구한 ‘실제 화면 확인 후 완료’ 조건은 충족하지 못했으므로 P12 전체 완료로 판정하지 않는다.

## 9. Remaining Issues — P12에서 수정하지 않은 문제

1. **WebGL acceptance:** 실제 외형, 모든 시점, mesh 클릭, selected highlight, Orbit/Zoom/Pan, overlay와 GPU cleanup 미검증. 이것이 P12 종료의 가장 중요한 미해결 조건이다.
2. 정확한 실선 underwater profile, propeller/shaft 수량, tank plan/제품군, 기관 배치, WC datum/stroke/actuation은 UNKNOWN. 현재 generic 모형을 실제 설계로 사용할 수 없다.
3. 기존 Timeline의 단순 횡이동과 phase 전환을 유지했다. 크레인·인양 경로·rigging·안착/용접 순서의 물리적 개선은 하지 않았다. 이동 중 cradle는 숨긴다.
4. 분리 shell cap은 추가했지만 cargo cover의 블록 경계 내부 face는 기존 closed prism 방식이다. normal에서는 내부에 가려지고 cutaway에서는 cover를 숨긴다. 모든 내부 중복 face를 boolean으로 제거한 것은 아니다.
5. Cutaway cargo cavity는 교육용 내부 표현이며 제품별 insulation/secondary membrane 시공 단계나 검사 애니메이션이 없다. P12 scope limit을 따랐다.
6. 실제 WC 설치·crane animation, 전체 배관/전장, 실제 yard block plan은 미구현.
7. Windows `.bat` 더블클릭, 실제 모바일 화면, 20회 3D remount/GPU memory 측정은 이 환경에서 검증하지 않았다.
8. 신규 지지 형상은 좌표 연결을 고려했으나 모든 mesh의 간섭·접촉 tolerance를 실제 화면이나 collision solver로 검증한 것은 아니다. 수밀성·구조강도·인양 안전성을 보증하지 않는다.

## 10. P13 Recommended Tasks — P13에서 수정·확인해야 할 문제

우선 P12의 남은 WebGL 검수를 닫은 후 P13 범위로 확장한다.

1. WebGL 지원 Chrome/Edge에서 D60 선택 해제 후 Perspective/Side/Front/Top/Cutaway 스크린샷 확보. 선수 bulb 연결, 선미 appendage clearance, bridge/funnel/pipe/dome 지지, tank visibility, 두 WC footprint를 실제로 확인하고 발견된 geometry 결함 수정.
2. B01–B09/T01–T04/WC01–02 mesh 직접 클릭, highlight/Production/Quality 연동, scenario overlay/reset, Orbit/Zoom/Pan/fit, mount/unmount GPU 검증.
3. D0/15/25/32/36/38/40/48/49/50/60 및 역방향 scrub 검사. WC는48 이전 수납,49 중간 전개,50 이후 전개임을 확인. ‘두 시스템을 한 번에 동시에 설치’하는 단순화는 후속 설치 시퀀스 단계에서 개선.
4. 다음 단계의 승인을 받은 범위에서만 block transfer→lift→seat와 crane/support 연동, cargo cover 분리면 정리, membrane 현장 시공·검사 설명을 구현. 기존 일정 엔진은 유지.
5. 공식 GA/lines plan/WAPS arrangement를 확보하면 generic assumption 치수를 비교·교정하고 출처 수준을 갱신. 미확인값을 임의로 VERIFIED로 바꾸지 않음.

### 실행 방법

압축 해제 후 Node.js22.13 이상 + 프로젝트의 pnpm11.25.0 환경에서:

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
pnpm install --frozen-lockfile
pnpm dev
```

`http://localhost:3000` → 3D Twin → Day60 → object selection 해제 → 카메라별 확인. Windows에서는 기존 `start-dev.bat` 더블클릭 가능. CMD/server 프로세스가 실행 중이어야 한다.

빌드 결과만 확인하려면 포함된 `out/`과 함께 `node scripts/serve-static.mjs`를 실행한다. 정식 빌드는 `pnpm build`, 형상 수치 검사는 `node tests/validate-geometry.mjs`이다.
