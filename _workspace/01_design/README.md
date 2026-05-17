# 01_design — 디자인 자산 인덱스

**산출자:** ui-designer
**일시:** 2026-05-15
**참조:** `/Users/jieunpark/baseball_agent/_workspace/00_requirements.md`, `/Users/jieunpark/baseball_agent/ball/25475.jpg`

---

## 1. 산출물

| 파일 | 용도 |
|------|------|
| `baseball-icon.svg` | 야구공 SVG 자산 (viewBox 100×100). 인라인 또는 `<img src>` 사용. |
| `design-tokens.css` | CSS 변수로 정의된 색·간격·타이포·그림자·전이 토큰. `src/renderer`에 복사하여 import. |
| `mockup.md` | 야구공-only 상태 / 패널 열린 상태 / API 키 설정 진입점의 ASCII wireframe + 영역별 토큰 매핑. |
| `states.md` | IDLE / HOVER / DRAGGING / PANEL-OPEN / LOADING / ERROR 등 인터랙션 상태별 시각 명세와 토큰 매핑. |
| `README.md` | (본 문서) 산출물 인덱스와 frontend-dev 가이드. |

---

## 2. frontend-dev가 알아야 할 핵심 규칙

### 2.1 토큰 사용 원칙

- **하드코딩 금지.** 모든 색·간격·반경·그림자·전이는 `design-tokens.css` 변수를 통한다.
- 토큰명은 `--baseball-*` (야구공), `--panel-*` (채팅 패널), `--bubble-*` (메시지), `--input-*`, `--control-*`, `--space-*`, `--font-*`, `--shadow-*`, `--ease-*`, `--duration-*` 네임스페이스를 사용.
- 다크/라이트 자동 적응을 위해 `prefers-color-scheme: dark` 분기는 토큰 파일 하단에 이미 포함.
- 새 색이 필요할 경우 토큰을 추가하고 ui-designer에 통보 (직접 색 값 사용 금지).

### 2.2 SVG 사용 규칙

- `baseball-icon.svg`는 `currentColor`가 아닌 **CSS 변수**로 색을 받는다. 부모 컨테이너에 `--baseball-ball-bg` 등을 오버라이드하면 색이 바뀐다.
- 인라인 삽입 권장 (CSS 변수 우선순위 적용 + filter/transform 자유롭게).
- `<img src="baseball-icon.svg">` 사용도 가능하나 이 경우 토큰 적용은 불가능 (fallback 색 사용).
- viewBox는 `0 0 100 100`. width/height는 `--ball-size` (CSS)로 조절.

### 2.3 인터랙션 적용 규칙

- 야구공: `transform-origin: center`, 패널: `transform-origin: top left` 고정.
- hover/drag/loading은 클래스 토글 (`.is-dragging`, `.is-thinking`)로 표현. JS는 클래스만 갈아끼우고 시각 변화는 CSS가 담당.
- 5px 드래그 임계값은 `--drag-threshold-px` 참고 (실제 비교는 JS).
- 모든 transition은 `--transition-fast` / `--transition-medium` 중 하나로 통일.

### 2.4 패널 사이즈

- 기본 360×520, 슬라이더로 0.7×~1.4× 스케일 조절. 사이즈 변경은 윈도우 자체 크기를 IPC로 변경하거나 (`window:set-size`) renderer-only CSS scale.
- 윈도우 opacity는 `BrowserWindow.setOpacity()` (IPC) — CSS opacity가 아님에 유의.

### 2.5 폰트

- `--font-sans`는 한국어/영어 모두 자연스럽게 보이는 system stack + Pretendard/Noto Sans KR fallback.
- 별도 웹폰트 로드는 하지 않음 (오프라인/오버레이 특성).

---

## 3. backend-dev에게 전달할 시각 정보

| IPC 채널 (제안) | 시각 영향 |
|-----------------|----------|
| `window:drag-move` | dragging 상태 시각 (scale 1.1 + shadow 강화). throttle 16ms 권장. |
| `window:set-opacity` | BrowserWindow.setOpacity (0.4~1.0). UI는 슬라이더만 표시. throttle 50ms. |
| `window:set-size` | 야구공+패널 동시 스케일 (0.7~1.4). |
| `chat:stream-chunk` | LOADING 상태 시각 (커서 펄스 + thinking 애니메이션). |
| `chat:stream-end` | LOADING 해제. |
| `settings:has-api-key` | false면 패널 메시지 영역 자리에 API 키 설정 CTA 자동 표시. |

---

## 4. 핵심 토큰 빠른 참조

| 항목 | 토큰 | 기본값 |
|------|------|--------|
| 공 본체 | `--baseball-ball-bg` | `#f5f5f3` |
| 스파인 | `--baseball-spine` | `#9ca3af` |
| 스티치 | `--baseball-stitch` | `#c0392b` |
| 공 그림자 | `--shadow-float` | `0 4px 12px rgba(0,0,0,0.18)` |
| 패널 폭 | `--panel-width` | `360px` |
| 패널 높이 | `--panel-height` | `520px` |
| 패널 배경 | `--panel-bg` | `rgba(255,255,255,0.94)` |
| 패널 반경 | `--panel-radius` | `14px` |
| 패널 그림자 | `--shadow-panel` | `0 12px 36px rgba(0,0,0,0.22)` |
| user 버블 | `--bubble-user-bg` | `#3a82f7` |
| 빠른 전이 | `--duration-fast` | `120ms` |
| 중간 전이 | `--duration-medium` | `220ms` |
| hover 스케일 | `--scale-hover` | `1.05` |
| 드래그 스케일 | `--scale-drag` | `1.10` |

---

## 5. 자가 점검 (svg-design 스킬 5단계)

- [x] SVG가 100×100 viewBox에서 정확히 렌더링 — 본체 원 + 좌우 스파인 + V자 스티치 18개씩.
- [x] 모든 색상이 토큰 변수를 통함 — SVG는 `var(--baseball-*, #hex)` 형태로 fallback 포함.
- [x] hover/drag 상태의 `transform-origin: center` 명시 — `states.md` 참조.
- [x] 다크/라이트 배경 모두 가독성 — 본체에 미세 보더는 없으나 그림자 + 빨간 스티치 대비로 어두운 배경에서도 식별 가능. `prefers-color-scheme: dark` 시 패널 토큰 자동 전환.
- [x] hard-coded 색 없음 (토큰 파일 외부) — mockup/states 문서 내 예시 CSS도 모두 토큰 참조.

---

## 6. 다음 단계 (backend-dev / frontend-dev)

1. `design-tokens.css`를 `src/renderer/styles/`로 복사하고 진입점 (`main.tsx`)에서 import.
2. `baseball-icon.svg`를 `src/renderer/assets/` 또는 컴포넌트 인라인으로 배치.
3. `mockup.md`의 영역 → React 컴포넌트 매핑 (BallIcon / ChatPanel / Header / MessageList / Bubble / Controls / InputBar / ApiKeySetup).
4. `states.md`의 클래스 토글 패턴으로 인터랙션 구현.
5. 변경/추가 토큰 요청은 ui-designer에 메시지.