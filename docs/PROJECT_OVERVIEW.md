# Project overview — P10
Shipbuilding Production Digital Twin Prototype. 공개 선박 정보, 모델링 가정, Mock Production Data로 생산관리 의사결정 지원을 시연하는 frontend-only 시스템이다. 실제 ERP/MES/PLM/IoT 연동이나 공식 조선소 Block Plan이 아니다.

## 기준과 범위
P02 Modeling Reference → P03 Data Contract → P04 UI Architecture 우선순위를 유지했다. 174,000 m³ membrane LNGC, 2 Wind Challenger, 9 educational blocks, 76 tasks, 107 FS dependencies. P06 geometry, P07 timeline 및 P09 CPM/propagation 알고리즘은 재설계하지 않았다.

## 시연 흐름
1. Overview D25: 계획 진척 66%, 자재 97.8%, release 8/9와 B04 품질 이슈.
2. Twin에서 B04: 75% 계획, NDT HOLD, NCR 1, rework 48 MH.
3. D40: OUTFITTING 87.5%, PASS, release. D60: COMPLETED 100%.
4. Production/Quality에서 같은 B04 확인.
5. Quality → Prepare scenario → Additional delay 3.5 → Run simulation.
6. Baseline D60 vs scenario D63.5, 영향 작업 24개와 4개 Critical Path 확인.
7. Insight에서 결과·근거·검토 문맥 확인. Reset scenario 후 baseline으로 복귀.

## 인도물
소스, pnpm lockfile, Windows launcher, static out/, 검증 스크립트, P02–04 참조 문서 및 P10 문서. 설치·실행은 README 참조.
최종 상태 Partial: WebGL이 비활성화된 검증 환경에서 실제 메시/카메라/3D 강조는 Not visually verified.
