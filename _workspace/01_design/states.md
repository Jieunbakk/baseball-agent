# Interaction States — 시각 상태 명세

ui-designer 산출물. 각 상태의 트리거·시각 변화·토큰 매핑을 정의한다.
frontend-dev는 이 표를 보고 CSS 클래스/transition을 일관되게 적용한다.

---

## 1. 상태 다이어그램

```
                        ┌──────────────┐
            mouseover   │              │   mouseout
       ┌───────────────►│    HOVER     ├───────────────┐
       │                │  (scale 1.05)│               │
       │                └──────┬───────┘               │
       │                       │                       ▼
  ┌────┴───────┐    click      │            ┌──────────────────┐
  │            │  (no drag)    │            │                  │
  │   IDLE     │◄──────────────┼──── close ─┤   PANEL-OPEN     │
  │ (opacity   │               │            │                  │
  │   0.85)    │               │            └─────┬────────────┘
  └────┬───────┘               │                  │
       │ mousedown +           │             stream chunks
       │ 5px move              │                  ▼
       ▼                       │            ┌──────────────────┐
  ┌────────────┐               │            │     LOADING      │
  │  DRAGGING  │               │            │   (pulse cursor) │
  │ (scale 1.1)│               │            └──────────────────┘
  └────┬───────┘               │
       │ mouseup               │
       └───────────────────────┘
```

---

## 2. 상태별 토큰 매핑

### 2.1 IDLE — 기본 (icon-only)

| 속성 | 값 | 토큰 |
|------|----|----|
| opacity | 0.85 | `--ball-opacity-idle` |
| transform | scale(1.0) | — |
| box-shadow | 부드러운 드롭 | `--shadow-float` |
| cursor | `grab` | — |
| transition | 120ms ease-default | `--transition-fast` |

```css
.baseball-ball {
  opacity: var(--ball-opacity-idle);
  transform: scale(1);
  filter: drop-shadow(var(--shadow-float));
  cursor: grab;
  transition: var(--transition-fast);
  transform-origin: center;
}
```

---

### 2.2 HOVER — 마우스 오버

| 속성 | 값 | 토큰 |
|------|----|----|
| opacity | 1.0 | `--ball-opacity-hover` |
| transform | scale(1.05) | `--scale-hover` |
| box-shadow | 강화된 드롭 | `--shadow-float-hover` |
| 트리거 | `mouseover`/`pointerenter` | — |

```css
.baseball-ball:hover {
  opacity: var(--ball-opacity-hover);
  transform: scale(var(--scale-hover));
  filter: drop-shadow(var(--shadow-float-hover));
}
```

---

### 2.3 DRAGGING — 드래그 중 (5px 임계값 초과)

| 속성 | 값 | 토큰 |
|------|----|----|
| opacity | 0.92 | `--ball-opacity-drag` |
| transform | scale(1.10) | `--scale-drag` |
| box-shadow | 가장 진한 드롭 | `--shadow-float-drag` |
| cursor | `grabbing` | — |
| 패널 | 강제 닫힘 (있다면) | — |
| 트리거 | `mousedown` + `mousemove > 5px` | `--drag-threshold-px` |

```css
.baseball-ball.is-dragging {
  opacity: var(--ball-opacity-drag);
  transform: scale(var(--scale-drag));
  filter: drop-shadow(var(--shadow-float-drag));
  cursor: grabbing;
}
```

**참고:** Electron 윈도우 이동은 IPC (`window:drag-start`, `window:drag-move`)로 메인에 위치 업데이트 위임. 너무 잦은 이벤트는 throttle (16ms 권장 = 60fps).

---

### 2.4 PANEL-OPEN — 채팅 패널 열림

| 속성 | 값 | 토큰 |
|------|----|----|
| 패널 등장 | slide-in 220ms ease-out | `--duration-medium` / `--ease-out` |
| 패널 width | 360px | `--panel-width` |
| 패널 height | 520px | `--panel-height` |
| 패널 bg | 반투명 흰색 + blur | `--panel-bg` + `--panel-backdrop` |
| 패널 radius | 14px | `--panel-radius` |
| shadow | 패널 전용 | `--shadow-panel` |
| 야구공 위치 | 패널 좌상단 헤더에 부착 | — |
| 닫기 트리거 | `✕` 클릭 / `Esc` / 야구공 재클릭 | — |

```css
.chat-panel {
  width: var(--panel-width);
  height: var(--panel-height);
  background: var(--panel-bg);
  border-radius: var(--panel-radius);
  box-shadow: var(--shadow-panel);
  backdrop-filter: var(--panel-backdrop);
  transform-origin: top left;
  animation: panel-slide-in var(--duration-medium) var(--ease-out);
}
```

---

### 2.5 LOADING — Claude 스트리밍 중

| 속성 | 값 | 토큰 |
|------|----|----|
| 마지막 assistant bubble | 끝에 `▎` 커서 + pulse | — |
| 입력창 | disabled, placeholder "응답 중…" | — |
| 전송 버튼 | disabled (회색) | `--send-btn-bg-disabled` |
| 헤더 야구공 | 미세한 회전 1deg ↔ -1deg 펄스 (1.6s) | — |

```css
@keyframes cursor-blink {
  0%, 50%   { opacity: 1; }
  51%, 100% { opacity: 0.2; }
}
.assistant-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  margin-left: 2px;
  animation: cursor-blink 1.2s var(--ease-default) infinite;
}

@keyframes ball-thinking {
  0%, 100% { transform: rotate(-1deg); }
  50%      { transform: rotate(1deg); }
}
.baseball-ball.is-thinking {
  animation: ball-thinking 1.6s var(--ease-default) infinite;
}
```

---

### 2.6 ERROR — API 에러 / 키 없음 / 네트워크 실패

| 종류 | 표시 | 토큰 |
|------|------|----|
| 키 없음 | 채팅 영역 대신 "API 키를 설정해 주세요" CTA + ⚙ 버튼 | `--warn-fg` / `--warn-bg` |
| Invalid 키 | assistant bubble을 에러 스타일로 | `--error-fg` / `--error-bg` |
| Rate limit | "잠시 후 다시 시도해 주세요" (재시도 버튼) | `--warn-fg` |
| 네트워크 실패 | "연결 실패. 재시도" | `--error-fg` |

```css
.bubble--error {
  background: var(--error-bg);
  color: var(--error-fg);
  border: 1px solid var(--error-fg);
}
```

---

## 3. 사용자 컨트롤 반응

### 3.1 Opacity 슬라이더 (0.4 ~ 1.0)

- 슬라이더 이동 → IPC `window:set-opacity` (throttle 50ms)
- 메인 프로세스가 `BrowserWindow.setOpacity(value)` 호출
- 슬라이더 라벨 우측에 현재 값 표시 (예: `0.85`)

### 3.2 Size 슬라이더 (0.7x ~ 1.4x)

- 슬라이더 이동 → CSS 변수 `--current-scale` 업데이트 (renderer-only)
- 또는 윈도우 크기 자체를 IPC로 조정 (`window:set-size`)
- 야구공 + 패널이 같은 비율로 스케일
- 라벨에 `1.0×` 표시

---

## 4. 전이 (Transition) 통합 룰

| 변화 | duration | easing |
|------|----------|--------|
| hover / scale | `--duration-fast` (120ms) | `--ease-default` |
| 패널 등장/닫힘 | `--duration-medium` (220ms) | `--ease-out` |
| API 키 모달 전환 | `--duration-medium` | `--ease-out` |
| 슬라이더 thumb | `--duration-fast` | `--ease-default` |
| 스트리밍 커서 | `1.2s` infinite | `--ease-default` |
| 로딩 펄스 | `1.6s` infinite | `--ease-default` |

`transform-origin: center` (야구공) / `transform-origin: top left` (패널) 통일.

---

## 5. 접근성 / Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

스트리밍 커서와 thinking 펄스는 reduced motion 환경에서 정적으로 표시.