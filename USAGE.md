# 대시보드 사용 방법 (Portfolio Monitor)

이 문서는 React + Recharts + Tailwind로 만든 **Portfolio Monitor** 웹사이트의 사용법을 설명합니다.

## 1. 접속

- 로컬 실행: `http://localhost:5173`
- Vercel 배포본: 브라우저에서 배포된 URL로 접속
- 접속 후 좌측 상단에
  - `BASKET MONITOR`
  - 하단 KPI 카드
  - 탭(Performance / Weights / Risk / Correlation)

이 순서로 화면이 구성됩니다.

## 2. 화면 구성

### 2.1 상단 헤더
- `BASKET MONITOR` 제목
- KPI 카드 (총 10개)
  - Total Return
  - Funding Drag
  - Selected Days
  - Annual Volatility
  - Sharpe Ratio
  - Max Drawdown
  - BTC Return
  - VS Benchmark
  - Net Exposure
  - Gross Exposure
- 데이터 소스 상태
  - `CONNECTED`: Binance Futures API 실시간 수신 중
  - `LIVE FEED UNAVAILABLE`: 로컬 대체 데이터 사용 중

### 2.2 왼쪽 패널 (Asset Control Panel)
모든 설정은 즉시 반영되어 차트와 KPI가 업데이트됩니다.

- Long Assets / Short Assets
  - 멀티 셀렉트로 자산을 선택
  - 롱/숏에 같은 자산이 동시에 들어가면 자동 정리됨
- Gross Exposure
  - 전체 레버리지를 슬라이더로 조정
- Time Range
  - 7D / 30D / 90D / 180D / 1Y
- Rebalance, Start Date
  - 리밸런싱 주기 및 시작 날짜
- Return View
  - Net / Gross
- Margin
  - 수익률에 쓰일 마진 입력
- Benchmark
- Base Weight Selection
  - Inverse Correlation
  - Inverse Volatility
  - Risk Parity
  - Beta Adjusted
  - Market Cap
  - Equal Weight
  - Manual
- Risk Adjustment, Cost Assumptions
  - Risk 토글, 비용 입력(펀딩/트레이딩 등)
- Risk Settings
  - 리스크 파라미터 조정

## 3. 탭 사용법

### 3.1 Performance
- Net Return Curve
  - 누적 수익(净수익), Funding Drag, Trading Cost를 확인
- Drawdown Watermark
  - 구간별 Drawdown 확인
- Individual Asset Performance
- Benchmark Analytics 테이블
  - Tracking Error, Alpha, Beta, R-Square, Information Ratio, Downside Capture

### 3.2 Weights
- Current Weights 테이블
- Weight Distribution 막대
- Weight Comparison Matrix
- Method Heatmap (Method별 Liquidity/Turnover/Stability/Tail Risk)

### 3.3 Risk
- Rolling 7-Day Volatility
- Beta vs BTC
- Z-Score vs 90D Mean
- Risk Snapshot 테이블
  - VaR 95, Expected Shortfall, Max 1D Move, Leverage, Utilization

### 3.4 Correlation
- Correlation Matrix Heatmap
- Correlation Summary (각 자산 max/min/avg correlation)

## 4. 화면 상호작용

- 차트/테이블 항목 위에 마우스 오버 시 수치 툴팁 표시
- 숫자는 소수점 4자리 기준으로 표시
- 숫자는 우측 정렬
- 각 항목은 실시간/폴백 상황에 따라 값이 갱신됨

## 5. 주의사항

- Binance Futures API 호출이 불안정할 경우, 패널의 경고 문구처럼 로컬 fallback 데이터가 표시될 수 있습니다.
- 네트워크 제약이나 브라우저 CORS 이슈로 실시간 소스가 잠깐 끊길 수 있습니다.
- 실시간 데이터가 안 들어올 때는 화면 상단 상태 라벨과 푸터의 `LIVE FEED UNAVAILABLE` 메시지를 확인하세요.

## 6. 문제 해결(초간단)

- 화면이 깨질 때
  - 브라우저 새로고침
  - 빌드 캐시 제거 후 재실행: `npm run dev`
- 데이터가 안 바뀔 때
  - 왼쪽 패널 설정값(특히 시간범위, 자산 선택, benchmark) 확인
- 실행이 안 될 때
  - 루트 폴더에서 `npm install` 후 `npm run dev`

## 7. 메뉴명/버튼명 상세 해설

아래는 화면에 보이는 메뉴/버튼/입력명 각각이 의미하는 바를 운영 관점으로 정리한 내용입니다.

### 7.1 상단/공통 영역

- `BASKET MONITOR`
  - 대시보드 전체의 현재 바스켓 포지션 성과를 모니터링하는 기본 화면 제목입니다.
- `DATA SOURCE`
  - 현재 지표가 실시간 API 기반인지, 폴백 데이터인지 표시합니다.
- `Last Updated`
  - 마지막으로 지표를 재생성한 시각입니다.

### 7.2 왼쪽 패널: Asset Control Panel

- `Asset Control Panel`
  - 전체 분석 파라미터(자산군, 가중치 방식, 리스크 규칙)를 한 곳에서 제어하는 컨트롤러입니다.

- `Long Assets`
  - 롱 포지션으로 집어넣을 자산 목록을 다중 선택합니다.
  - 기본적으로 수익에 음(-)/양(+ )호를 넣지 않고 양수 가중치로 처리됩니다.
  - 같은 자산이 Short로도 선택된 경우 자동으로 Short에서 제거합니다.

- `Short Assets`
  - 숏 포지션으로 넣을 자산 목록을 다중 선택합니다.
  - 계산 시 해당 자산은 가중치가 음수로 반영되어 전체 바스켓 수익에 역상관 기여가 됩니다.
  - Long와 중복 선택 시 자동 해제됩니다.

- `Gross Exposure`
  - 바스켓의 총 명목 노출도를 조절합니다(%) .
  - 값이 커질수록 포지션 크기가 커지고 레버리지 성향이 증가합니다.

- `Time Range`
  - 분석할 샘플 구간을 선택합니다.
  - 7D/30D/90D/180D/1Y는 각각 과거 일수입니다.

- `Rebalance`
  - 리밸런싱 간격 선택입니다.
  - 현재 로직은 기준값을 제어값 반영용으로 유지되며, 향후 실행 주기 정책 확장 지점입니다.

- `Start Date`
  - 분석 시작 기준일입니다.
  - 선택일과 Time Range 중 짧은 구간이 우선되어 실제 계산 시작점이 정해집니다.

- `Return View`
  - `Net`: 롱/숏의 부호를 살린 순수 수익률 곡선
  - `Gross`: 노출 절대값 기준 누적/드래그 계산 등으로 가중치 스케일링한 값

- `Margin`
  - 레버리지 운용에서 마진 비용/제약을 반영하기 위한 파라미터 입력입니다.
  - 현재는 입력값이 비용/위험 표시 파생 로직에서 보조적으로 사용됩니다.

- `Benchmark`
  - 비교 벤치마크 자산을 선택합니다.
  - VS Benchmark, Tracking/Error, Beta, R-Square 등 기준 지표의 기준선이 됩니다.

- `Base Weight Selection`
  - 바스켓 기본 할당 방식입니다.
  - `Inverse Correlation`: 상관관계가 낮은 자산에 상대적으로 더 높은 비중
  - `Inverse Volatility`: 변동성이 낮은 자산에 더 높은 비중
  - `Risk Parity`: 변동성·리스크 기여를 비슷하게 맞추는 방식
  - `Beta Adjusted`: BTC 기준 베타를 보정해 비중 조정
  - `Market Cap`: 마켓캡 프록시로 비중 산정
  - `Equal Weight`: 동일 가중
  - `Manual`: 수동(사용자 지정) 규칙 기반

- `Risk Adjustment`
  - 리스크 필터/규칙 토글 그룹입니다.
  - 각 토글은 바스켓 가중/리스크 판단 단계에서 실험적 제어항목으로 동작합니다.

- `Cost Assumptions`
  - 거래비용 구성 항목 입력값입니다.
  - `Funding`: 자금조달 비용 반영
  - `Borrow`: 차입 비용
  - `Trading`: 체결비용
  - `Slippage`: 체결 편차/슬리피지 추정치

- `Risk Settings`
  - 사용자 정의 리스크 허용/정책 스케일 값입니다.
  - 내부 임계치(유틸리제이션/레버리지 규칙) 계산에 반영됩니다.

### 7.3 탭 메뉴 의미

- `Performance`
  - 수익률, 비용, Drawdown, 벤치마크 초과 성과를 한 번에 확인합니다.
- `Weights`
  - 현재 가중치, 방법별 비교, 분포를 통해 포트폴리오 구성 의도를 점검합니다.
- `Risk`
  - 변동성, 베타, 가격구간 편차, VaR/ES 기반 위험 상태를 점검합니다.
- `Correlation`
  - 자산 간 상관 구조를 확인해 과잉 집중, 동조화, 헤지 여지를 판단합니다.

### 7.4 차트/표 내부 버튼/조작

- `Net Return Curve`
  - 누적 Net Return 추세선입니다.
- `Funding Drag`, `Trading Cost` 오버레이
  - 수익에서 비용이 얼마나 깎였는지 누적 비용 라인으로 확인합니다.
- `Drawdown Watermark`
  - 고점 대비 하락폭 누적 상태를 표시합니다.
- `Individual Asset Performance`
  - 개별 자산별 기간 누적 수익률을 막대 비교합니다.
- `Current Weights`
  - 현재 적용중인 가중치 표(자산별 Current/Target/Gap).
- `Weight Distribution`
  - 자산별 비중을 막대로 표시합니다.
- `Weight Comparison Matrix`
  - Base, Inverse Correlation, Risk Parity, Manual 방식별 비교표입니다.
- `Method Heatmap`
  - 방법론별 유동성/회전율/안정성/꼬리리스크 점수입니다.
- `Rolling 7-Day Volatility`
  - 최근 7일 기준 이동 표준편차 연환산 변동성입니다.
- `Beta vs BTC`
  - 자산별 베타를 표시해 시장 베타 노출을 확인합니다.
- `Z-Score vs 90D Mean`
  - 누적수익이 90일 이동평균 대비 얼마나 벗어났는지 표준화 지수로 보여줍니다.
- `Correlation Matrix Heatmap`
  - 자산간 상관계수(회색 톤)로 상호 의존도를 즉시 파악합니다.
