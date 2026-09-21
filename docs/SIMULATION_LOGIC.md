# Simulation logic
P09 순수 엔진을 유지했다. 작업 76개 / FS edge 107개, CAL-24X7 elapsed day. 원본 입력을 변경하지 않고 baseline과 scenario snapshot을 계산한다.

1. graph validation: ID/reference, finite nonnegative durations/lags, dates, DAG, terminal DEL reachability.
2. forward pass: predecessor EF + lag, explicit release constraints, duration allowance 및 eligible task outage window.
3. backward pass: DEL finish에서 LS/LF; totalFloat=LS−ES.
4. critical path: zero float이며 tight FS edge로 연결된 경로. 병렬 경로 유지, 최대 256개 cap 및 flag.
5. scenario diff: start/finish shift, direct/downstream task, block-linked maximum delta, float 변화 및 final delivery 비교.

| 사건 | 기존 매핑 |
|---|---|
| Welding rework | E-Bxx에 명시적 repair/reinspection allowance |
| Material delay | requirement needByDay + delay → shared OUTFIT release |
| Crane breakdown | resource allocation으로 제한한 task의 [start,end) outage |
| Weather shutdown | 가정한 outdoor erection/WC installation task outage |
| Wind Challenger delay | WC01/WC02 shared WC_LIFT를 한 번 연장 |

Mock B07 arrival D43을 baseline에 추가하지 않는다. 두 WC의 shared package를 중복 계산하지 않는다. MH를 days로 환산하지 않는다. 현재 cursor 이전 실적을 고정하지 않는 full-baseline counterfactual이다.

## 검증된 결과
| 입력 | Scenario delivery | Impact | Target float consumed |
|---|---:|---:|---:|
| B04 +3.5d | 63.5 | +3.5 | 0 |
| B04 +3d | 63 | +3 | 0 |
| B07 material +5d | 63 | +3 | 2 |
| Erection crane +2d at D24 | 62 | +2 | 0 |
| Weather +2d at D24 | 62 | +2 | 0 |
| WC02 +3d | 61 | +1 | 2 |
| WC02 +2d | 60 | 0 | 2 |

B04 +3.5d: E-B04 EF24→27.5, 24 affected tasks, 9 block associations (shared package 포함), 4 critical paths unchanged. 각 block의 delta를 합산하지 않는다.
Comparison presets는 독립 실행이며 복합 사건 최적화가 아니다. 비용·실시간 weather·resource leveling·actual replay는 미구현.
