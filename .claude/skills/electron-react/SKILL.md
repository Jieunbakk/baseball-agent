---
name: electron-react
description: "Electron + React + TypeScript + Vite 데스크톱 앱 구현 워크플로우. 항상 떠 있는 투명 프레임리스 윈도우, 좌클릭 드래그 이동, 투명도/사이즈 조절, 윈도우 상태 저장, IPC로 메인-렌더러 통신을 구현. Electron 메인/렌더러 코드 작성, 윈도우 설정, 드래그 핸들링, React 컴포넌트 생성 시 반드시 이 스킬을 사용."
---

# Electron + React Implementation Skill

떠다니는 야구공 위젯의 Electron 메인 + React 렌더러를 구현하는 절차. frontend-dev 에이전트가 사용한다.

## 0단계: 프로젝트 구조

```
src/
├── main/
│   ├── index.ts              # Electron 진입점
│   ├── window-state.ts       # 위치/크기/투명도 저장
│   ├── claude-client.ts      # (backend-dev 작성)
│   ├── ipc-handlers.ts       # (backend-dev 작성)
│   ├── api-key-store.ts      # (backend-dev 작성)
│   └── chat-history.ts       # (backend-dev 작성)
├── preload/
│   └── index.ts              # contextBridge로 안전한 API 노출
└── renderer/
    ├── index.html
    ├── main.tsx
    ├── App.tsx
    ├── components/
    │   ├── BaseballIcon.tsx
    │   ├── ChatPanel.tsx
    │   ├── Message.tsx
    │   └── Controls.tsx
    ├── hooks/
    │   ├── useChat.ts
    │   └── useDraggable.ts
    └── styles/
        ├── tokens.css        # 01_design/design-tokens.css 복사
        └── global.css
```

설정 파일: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `electron-builder.yml`, `.gitignore`.

## 1단계: BrowserWindow 설정

`src/main/index.ts`에서 항상 떠 있는 투명 프레임리스 윈도우를 만든다.

```ts
const win = new BrowserWindow({
  width: 380,
  height: 540,
  x: savedState.x,
  y: savedState.y,
  frame: false,                  // 프레임 제거
  transparent: true,             // 투명 배경
  alwaysOnTop: true,             // 항상 위
  resizable: false,              // 리사이즈는 슬라이더로
  skipTaskbar: true,             // 작업표시줄 미노출
  hasShadow: false,              // 투명 영역 그림자 제거
  webPreferences: {
    preload: path.join(__dirname, '../preload/index.js'),
    contextIsolation: true,      // 보안 필수
    nodeIntegration: false,      // 보안 필수
    sandbox: false,
  },
});

win.setAlwaysOnTop(true, 'floating');
win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
```

**중요:** `frame: false` + `transparent: true`는 OS별 동작이 다르다. macOS는 `vibrancy`가 필요할 수 있음. 우선 기본값으로 구현하고 OS별 분기는 동작 확인 후 추가.

## 2단계: 좌클릭 드래그로 윈도우 이동

`-webkit-app-region: drag`는 클릭 이벤트와 충돌하므로 **사용하지 않는다.** 대신 IPC로 윈도우를 이동한다.

`useDraggable.ts` 훅:
```ts
export function useDraggable(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0, startY = 0, moved = false;

    const onDown = (e: MouseEvent) => {
      startX = e.screenX; startY = e.screenY; moved = false;
      window.api.window.dragStart({ x: e.screenX, y: e.screenY });

      const onMove = (m: MouseEvent) => {
        const dx = m.screenX - startX;
        const dy = m.screenY - startY;
        if (!moved && Math.hypot(dx, dy) < 5) return; // 5px 임계값
        moved = true;
        window.api.window.dragMove({ x: m.screenX, y: m.screenY });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.api.window.dragEnd({ moved });
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    };
    el.addEventListener('mousedown', onDown);
    return () => el.removeEventListener('mousedown', onDown);
  }, [ref]);

  // moved 여부는 click 핸들러에서 참조 — 드래그 끝났으면 클릭 무시
}
```

메인 프로세스 IPC 핸들러:
- `window:drag-start` — 현재 윈도우 위치와 마우스 시작점 저장
- `window:drag-move` — `win.setPosition(startWinX + (mouseX - startMouseX), ...)`
- `window:drag-end` — 위치 저장 (`window-state.ts`)

## 3단계: 클릭으로 패널 토글

`BaseballIcon.tsx`:
- mousedown 시점에 드래그 시작 좌표 기록
- mouseup에서 이동 거리 < 5px면 클릭으로 간주 → `setPanelOpen(prev => !prev)`
- 5px 이상이면 클릭 무시 (드래그였으므로)

패널 열림 시:
- 윈도우 크기를 패널 크기로 확장 (`window:resize` IPC)
- 패널 슬라이드 인 애니메이션 (CSS transition)
- `setIgnoreMouseEvents(false)` — 패널 영역도 클릭 가능

패널 닫힘 시:
- 윈도우 크기를 아이콘 크기로 축소
- 야구공 외부 영역은 `setIgnoreMouseEvents(true, { forward: true })`로 클릭 통과

## 4단계: 투명도/사이즈 조절

`Controls.tsx`:
- Opacity 슬라이더 (0.4 ~ 1.0) → `window:set-opacity` IPC → `win.setOpacity(value)`
- Size 슬라이더 (0.7 ~ 1.4) → 렌더러 root 요소에 `transform: scale(value)` + 윈도우 크기 IPC 갱신

**주의:** `win.setOpacity()`는 윈도우 전체에 적용된다. 사이즈는 윈도우 dimension + 내부 CSS scale을 함께 조절.

## 5단계: 윈도우 상태 저장

`window-state.ts` — electron-store 사용.
- 저장 키: `windowState` = `{ x, y, width, height, opacity, scale }`
- 앱 시작 시 로드, 종료 또는 위치 변경 시 저장 (debounce 500ms)
- 디스플레이 영역 밖이면 기본 위치로 fallback

## 6단계: preload로 안전한 API 노출

`preload/index.ts`:
```ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  window: {
    dragStart: (p) => ipcRenderer.send('window:drag-start', p),
    dragMove: (p) => ipcRenderer.send('window:drag-move', p),
    dragEnd: (p) => ipcRenderer.send('window:drag-end', p),
    resize: (size) => ipcRenderer.send('window:resize', size),
    setOpacity: (v) => ipcRenderer.send('window:set-opacity', v),
  },
  chat: {
    send: (msg) => ipcRenderer.invoke('chat:send', msg),
    onChunk: (cb) => {
      const handler = (_e, chunk) => cb(chunk);
      ipcRenderer.on('chat:stream-chunk', handler);
      return () => ipcRenderer.off('chat:stream-chunk', handler);
    },
    onEnd: (cb) => { /* 동일 */ },
    onError: (cb) => { /* 동일 */ },
  },
  settings: {
    setApiKey: (key) => ipcRenderer.invoke('settings:set-api-key', key),
    hasApiKey: () => ipcRenderer.invoke('settings:has-api-key'),
  },
});
```

**preload는 backend-dev의 `_workspace/02_backend_contract.md`를 기준으로 한다.** contract 갱신 시 preload도 함께 갱신.

## 7단계: useChat 훅

`useChat.ts`는 contract의 IPC 채널을 React 상태로 변환한다.
- `messages: Message[]` 로컬 상태
- `send(text)`: assistant 빈 메시지 추가 → `window.api.chat.send()` → chunk 도착 시 마지막 메시지에 append
- onEnd: 메시지 완료 처리, onError: 에러 메시지 표시

## 8단계: package.json + 빌드

```json
{
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "electron .",
    "dist": "electron-builder"
  }
}
```

vite는 메인/preload/renderer를 각각 빌드하는 멀티 빌드 설정이 필요. `vite-plugin-electron` 사용 권장.

## 자가 점검

frontend-dev는 산출물 제출 전 다음을 확인:
- [ ] BrowserWindow에 `contextIsolation: true`, `nodeIntegration: false`
- [ ] 모든 색상이 tokens.css 변수 사용 (하드코딩 없음)
- [ ] 드래그 5px 임계값으로 클릭과 구분
- [ ] preload의 채널 이름이 contract와 1:1 일치
- [ ] `_workspace/03_frontend_summary.md`에 구현된 컴포넌트/IPC 호출 목록 작성
