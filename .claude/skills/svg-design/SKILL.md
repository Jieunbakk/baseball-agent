---
name: svg-design
description: "야구공 아이콘 SVG와 채팅 패널 비주얼 디자인 워크플로우. 떠다니는 위젯의 SVG 자산, 색상/타이포/그림자 토큰, 인터랙션 상태(기본/hover/dragging) 시각 명세를 생성. 야구공 아이콘이나 채팅 패널 시각 디자인 요청, 디자인 토큰 갱신, 인터랙션 비주얼 변경 요청 시 반드시 이 스킬을 사용."
---

# SVG & Visual Design Skill

떠다니는 데스크톱 위젯의 시각 자산을 만드는 절차. ui-designer 에이전트가 사용한다.

## 1단계: 야구공 SVG 작성

야구공은 단순한 원 + 빨간 실밥(스티치) 곡선이다. viewBox로 어떤 크기로도 확대/축소 가능하게 만든다.
/ball/25475.jpg 의 이미지 스타일과 비슷한 귀여운느낌

**필수 요소:**
- `viewBox="0 0 100 100"` — 100x100 좌표계 기준
- 본체 `<circle cx="50" cy="50" r="46">` — fill은 `var(--baseball-ball-bg, #fafaf6)`
- 외곽선 `stroke="var(--baseball-ball-border, #d4d4d0)" stroke-width="1.5"`
- 스티치 곡선 2개 — 빨간색 (`var(--baseball-stitch, #c0392b)`), `stroke-dasharray="3 2"`
- `<path d="M ... Q ..."/>` 형태의 베지어 곡선으로 좌/우 대칭 실밥 표현
- drop-shadow filter (정의: `<filter id="ball-shadow">`)

**상태별 변형:**
- 기본: opacity 0.85
- hover: opacity 1.0 + scale(1.05) + 더 진한 shadow
- dragging: opacity 1.0 + scale(1.1) + cursor: grabbing

CSS transition은 `transform 120ms ease-out, opacity 120ms ease-out`로 통일.

## 2단계: 디자인 토큰 정의

`design-tokens.css`에 CSS 변수로 정의한다. 모든 색상·간격·그림자·radius·duration은 토큰을 통한다.

```css
:root {
  /* 야구공 */
  --baseball-ball-bg: #fafaf6;
  --baseball-ball-border: #d4d4d0;
  --baseball-stitch: #c0392b;
  --baseball-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  --baseball-shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.28);

  /* 채팅 패널 */
  --panel-bg: rgba(28, 28, 32, 0.92);
  --panel-fg: #f5f5f7;
  --panel-border: rgba(255, 255, 255, 0.08);
  --panel-radius: 14px;

  /* 메시지 버블 */
  --bubble-user-bg: #3a82f7;
  --bubble-user-fg: #ffffff;
  --bubble-assistant-bg: rgba(255, 255, 255, 0.06);
  --bubble-assistant-fg: #f5f5f7;

  /* 입력창 */
  --input-bg: rgba(255, 255, 255, 0.04);
  --input-border: rgba(255, 255, 255, 0.12);
  --input-fg: #ffffff;

  /* 컨트롤 */
  --control-track: rgba(255, 255, 255, 0.12);
  --control-thumb: #ffffff;

  /* 에러 */
  --error-fg: #ff6b6b;
  --error-bg: rgba(255, 107, 107, 0.12);

  /* 간격·타이포 */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --font-size-sm: 12px;
  --font-size-md: 14px;
  --font-size-lg: 16px;

  /* 전이 */
  --transition-fast: 120ms ease-out;
  --transition-medium: 220ms ease-out;
}
```

## 3단계: 채팅 패널 목업

`chat-panel-mockup.md`에 ASCII wireframe + 명세를 둔다. Frontend Dev가 즉시 컴포넌트로 매핑 가능하도록 영역과 토큰을 표시한다.

```
┌─────────────────────────────────────┐  panel-bg, radius=14
│ [⚾] AI Assistant   [-] [×]        │  헤더: 야구공 + 타이틀 + 최소화/닫기
├─────────────────────────────────────┤
│                                     │
│   [Hello!]                          │  bubble-assistant
│                                     │
│                        [안녕하세요]  │  bubble-user (우측)
│                                     │
│   [무엇을 도와드릴까요?]              │
│                                     │
├─────────────────────────────────────┤
│ Opacity ●────○────                  │  슬라이더 1
│ Size    ○──────●──                  │  슬라이더 2
├─────────────────────────────────────┤
│ [Type a message...           ] [↵]  │  입력창
└─────────────────────────────────────┘
```

**크기 정책:** 패널 기본 크기 360x520, 최소 280x400, 최대 480x720. 사용자의 사이즈 조절은 0.7x ~ 1.4x 스케일.

## 4단계: 인터랙션 상태 명세

`interaction-states.md`에 상태 전이를 표로 정리한다.

| 상태 | 트리거 | 시각 변화 |
|------|--------|----------|
| 닫힘 (icon-only) | 초기 / 패널 X 클릭 | 야구공만, opacity 0.85 |
| hover | 야구공 mouseover | opacity 1.0, scale 1.05, shadow 강화 |
| 열림 (panel) | 야구공 클릭 (드래그 아님) | 패널 슬라이드 in (220ms), 야구공은 패널 좌상단에 부착 |
| dragging | 야구공 mousedown + 5px 초과 이동 | scale 1.1, cursor: grabbing, 패널 닫힘 |
| 투명도 조절 | Opacity 슬라이더 | 전체 윈도우 opacity 조절 (0.4 ~ 1.0) |
| 사이즈 조절 | Size 슬라이더 | 패널 + 아이콘 동시 스케일 (0.7 ~ 1.4) |

## 5단계: 산출물 검증

자가 점검 후 frontend-dev에게 전달:
- [ ] SVG가 100x100 viewBox에서 정확히 렌더링되는가
- [ ] 모든 색상이 토큰 변수를 통하는가 (하드코딩 색상 없음)
- [ ] hover/drag 상태의 transform 원점이 중앙(`transform-origin: center`)인가
- [ ] 다크/라이트 배경 모두에서 stroke로 형태가 보이는가

## 출력

산출물은 모두 `_workspace/01_design/`에 둔다:
- `baseball-icon.svg`
- `design-tokens.css`
- `chat-panel-mockup.md`
- `interaction-states.md`
