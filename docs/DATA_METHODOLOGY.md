# Data methodology
## 증거 분류
| Badge | 의미 | 예 |
|---|---|---|
| VERIFIED | P02 검증 문서에서 전사한 공개 정보 | 174,000 m³, Wind Challenger 2기 |
| DERIVED | 명시된 입력으로 계산 | 계획 진척, CPM, 납기 차이 |
| ASSUMPTION | 프로젝트 모델링 선택 | 9 blocks, D0–60, geometry, 사건 duration |
| MOCK | 가상 운영 기록 | D25 welding/NDT/NCR, 48 MH |

이번 통합 단계에서 공개 실선 정보를 새로 재검증하지 않았다. 실제 미확인값은 null/UNKNOWN이며 geometry용 가정과 분리한다. Wind Challenger 구동 방식은 미확인; hydraulic 구현을 주장하지 않는다.

## 날짜와 진척
공유 currentDay는 P07 교육용 baseline preview D0–60이다. 실제 LNGC 건조기간이 아니다. 블록 진척은 동일 가중 8개 task progress, Overview는 블록 평균이다. D25 overall 66%, B04 75%; 별도 recorded mock B04 85%는 혼동하지 않도록 표시한다. 원본 project-level 68% mock은 수정하지 않고 현재 Overview KPI에서 사용하지 않는다.
P02 실제 task 날짜가 설명용 Day10/20/30 예시보다 우선한다. Block completion D50과 vessel delivery D60은 다른 gate다.

## 품질과 자재
B04 D24–26 hold, D26–29 rework, D29 release는 교육용 overlay이다. D20–24 pre-hold NDT는 PASS로 정리해 released gate와 모순을 없앴다. 원본 D25 품질 record는 유지한다. 48 MH는 effort이며 duration 자동 변환에 쓰지 않는다.
Mock 자재 가용량은 availability date에서 해제되지만 그 자체가 baseline schedule을 자동 이동시키지 않는다. 시나리오 실행 시 별도 제약을 적용한다.

## 불완전 데이터
필수 per-block join 기록이 누락되면 해당 operational row를 제외하고 전역 경고를 표시한다. 요약은 사용 가능한 레코드 기준이며 누락 값을 0 또는 성공으로 꾸미지 않는다. 모든 row가 누락되어도 finite aggregate와 빈 화면을 유지한다. 구조적으로 손상된 schedule/DAG는 계산 검증 오류다.
