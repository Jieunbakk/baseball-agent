# Chat Panel Mockup — 떠다니는 야구공 AI 어시스턴트

ui-designer 산출물. ASCII wireframe + 영역별 토큰 매핑.
frontend-dev는 이 문서를 보고 React 컴포넌트 트리를 즉시 매핑할 수 있다.

---

## 상태 (a) 야구공만 떠있는 상태 (icon-only)

데스크톱 임의의 위치, 항상 위(`alwaysOnTop`), 5px 드래그 임계값으로 클릭/드래그 구분.

```
  ┌──────────────┐
  │              │  데스크톱 배경 (임의의 OS 화면)
  │     ⚾        │  ← 야구공 위젯 (64px, opacity 0.85)
  │              │     - cursor: grab
  │              │     - shadow-float (부드러운 드롭 그림자)
  └──────────────┘
```

- 컨테이너: `--ball-size` (기본 64px) × `--ball-size`
- 배경: 투명 (Electron `transparent: true`)
- 야구공 자체: `baseball-icon.svg`, opacity `--ball-opacity-idle`
- 그림자: `--shadow-float`
- hover 시: scale → `--scale-hover` (1.05), opacity → 1.0, shadow → `--shadow-float-hover`
- dragging 시: scale → `--scale-drag` (1.10), opacity → 0.92, cursor `grabbing`

---

## 상태 (b) 채팅 패널 열린 상태 (panel-open)

야구공 클릭 → 패널이 오른쪽으로 슬라이드 인 (`220ms ease-out`).
야구공은 패널 좌상단 헤더에 부착되어 함께 이동.

```
  ┌─────┐                                                    
  │     │   ┌──────────────────────────────────────────┐    
  │     │   │  ⚾  Baseball Assistant      ⚙  −  ✕     │ ← 헤더 (drag handle)
  │     │   ├──────────────────────────────────────────┤    
  │     │   │                                          │    
  │     │   │   ╭─────────────────────────╮            │    
  │     │   │   │  안녕하세요! 무엇을      │            │ ← assistant bubble
  │     │   │   │  도와드릴까요?           │            │   (좌측 정렬)
  │     │   │   ╰─────────────────────────╯            │    
  │     │   │                                          │    
  │     │   │            ╭────────────────────────╮    │    
  │     │   │            │  Vite 설정 좀 물어볼   │    │ ← user bubble
  │     │   │            │  게요                   │    │   (우측 정렬)
  │     │   │            ╰────────────────────────╯    │    
  │     │   │                                          │    
  │     │   │   ╭─────────────────────────╮            │    
  │     │   │   │  네! 어떤 부분이 궁금   │            │ ← streaming...
  │     │   │   │  하신가요?▎              │            │   (커서 펄스)
  │     │   │   ╰─────────────────────────╯            │    
  │     │   │                                          │    
  │     │   ├──────────────────────────────────────────┤ ← 컨트롤 영역
  │     │   │  Opacity  ●━━━━━○━━━━━━━━     1.0       │    
  │     │   │  Size     ━━━━━━━●━━━━━━━     1.0×      │    
  │     │   ├──────────────────────────────────────────┤    
  │     │   │  ┌──────────────────────────────┐  ┌──┐ │ ← 입력창
  │     │   │  │  메시지를 입력하세요…         │  │↑ │ │   (Enter 전송)
  │     │   │  └──────────────────────────────┘  └──┘ │    
  │     │   └──────────────────────────────────────────┘    
  │     │                                                    
  └─────┘                                                    
```

### 영역별 명세

| 영역 | 토큰 / 스타일 |
|------|--------------|
| **패널 컨테이너** | width `--panel-width` (360px), height `--panel-height` (520px), background `--panel-bg`, border-radius `--panel-radius` (14px), box-shadow `--shadow-panel`, backdrop-filter `--panel-backdrop` (blur 16px) |
| **헤더** | height 44px, padding `--space-3` `--space-4`, border-bottom `1px solid --panel-divider`, **drag handle (-webkit-app-region: drag)** |
| **헤더 아이콘 (야구공)** | 24px, `baseball-icon.svg`, opacity 1.0 |
| **헤더 타이틀** | font `--font-sans`, size `--font-size-md` (14px), weight `--font-weight-semibold` (600), color `--panel-fg` |
| **헤더 버튼 (⚙ − ✕)** | 28x28px, color `--iconbtn-fg`, hover bg `--iconbtn-bg-hover`, **-webkit-app-region: no-drag** |
| **메시지 영역** | flex:1, padding `--space-4`, gap `--space-3`, overflow-y auto, scrollbar 얇게 |
| **assistant bubble** | bg `--bubble-assistant-bg`, fg `--bubble-assistant-fg`, padding `--space-3`, radius `--bubble-radius` (좌하 코너만 `--bubble-radius-tail`), max-width `--bubble-max-width` (78%) |
| **user bubble** | bg `--bubble-user-bg`, fg `--bubble-user-fg`, 같은 룰 (우하 코너만 tail), align-self: flex-end |
| **스트리밍 커서** | `▎` 또는 1px wide 박스, `animation: cursor-blink 1.2s --ease-default infinite` |
| **컨트롤 영역** | padding `--space-3` `--space-4`, border-top `1px solid --panel-divider`, gap `--space-2` |
| **슬라이더 라벨** | size `--font-size-sm` (12px), color `--control-label-fg`, width 64px |
| **슬라이더 트랙** | bg `--control-track`, height 4px, radius 999px |
| **슬라이더 채움** | bg `--control-track-fill` |
| **슬라이더 thumb** | 14px circle, bg `--control-thumb`, border `1px solid --control-thumb-border`, shadow 미세 |
| **입력 영역** | padding `--space-3` `--space-4`, border-top `1px solid --panel-divider`, display flex gap `--space-2` |
| **textarea** | flex:1, bg `--input-bg`, border `1px solid --input-border`, radius `--input-radius`, padding `--space-2` `--space-3`, focus bg `--input-bg-focus` + border `--input-border-focus`, min-height 36px, max-height 120px (auto-grow) |
| **전송 버튼** | 36x36px, bg `--send-btn-bg`, fg `--send-btn-fg`, radius `--input-radius`, hover `--send-btn-bg-hover`, disabled `--send-btn-bg-disabled` |

### 슬라이드 인 애니메이션

```css
/* 패널 등장 */
@keyframes panel-slide-in {
  from {
    opacity: 0;
    transform: translateX(-12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}
.panel--open {
  animation: panel-slide-in var(--duration-medium) var(--ease-out);
  transform-origin: top left; /* 야구공이 좌상단 기준 */
}
```

---

## 상태 (c) API 키 설정 진입점

헤더 ⚙ 버튼 클릭 → 패널 내 인라인 모달 (또는 별도 view).

```
  ┌──────────────────────────────────────────┐
  │  ←  API Key 설정                          │
  ├──────────────────────────────────────────┤
  │                                          │
  │  Anthropic API Key                       │
  │  ┌────────────────────────────────────┐  │
  │  │  sk-ant-···········  [👁]          │  │ ← password input, 토글 가시
  │  └────────────────────────────────────┘  │
  │                                          │
  │  ⓘ 키는 OS keychain에 안전하게 저장됩니다 │ ← muted helper
  │                                          │
  │  ┌──────────┐  ┌──────────┐              │
  │  │  취소    │  │  저장    │              │
  │  └──────────┘  └──────────┘              │
  │                                          │
  └──────────────────────────────────────────┘
```

- 헬퍼 텍스트: color `--panel-fg-muted`, size `--font-size-sm`
- 저장 버튼: primary `--send-btn-bg`
- 첫 실행 시 `settings:has-api-key === false`면 이 화면이 자동 표시 (메시지 영역 대체)

---

## 사이즈 정책

| 항목 | 기본 | 최소 | 최대 |
|------|------|------|------|
| Ball | 64px | 44px (0.7x) | 90px (1.4x) |
| Panel width | 360px | 280px | 480px |
| Panel height | 520px | 400px | 720px |
| Window opacity | 1.0 | 0.4 | 1.0 |

`Size` 슬라이더 = 야구공+패널 동시 스케일 (0.7~1.4).
`Opacity` 슬라이더 = 전체 BrowserWindow opacity (0.4~1.0).