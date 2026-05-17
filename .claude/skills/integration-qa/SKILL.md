---
name: integration-qa
description: "통합 정합성 검증 워크플로우. IPC 계약과 실제 코드의 교차 비교, 디자인 토큰과 CSS 일치 확인, Electron 보안 점검(contextIsolation/nodeIntegration), 사용자 요구사항 5개 충족 매트릭스. QA 검증, 경계면 버그 점검, 요구사항 커버리지 점검 시 반드시 이 스킬을 사용."
---

# Integration QA Skill

떠다니는 야구공 AI 어시스턴트의 통합 정합성을 검증하는 절차. qa-inspector 에이전트가 사용한다. 핵심은 **"양쪽 동시 읽기"** — 생산자와 소비자 코드를 함께 열어 경계면을 비교한다.

## 검증 우선순위

1. **통합 정합성** (가장 높음) — 경계면 불일치
2. **사용자 요구사항 5개 충족**
3. **Electron 보안 설정**
4. **디자인 토큰 일관성**
5. 코드 품질·미사용 코드

## 검증 1: IPC contract ↔ 실제 코드

### 1-1. 채널 이름 일치

읽을 파일: `_workspace/02_backend_contract.md` + `src/main/ipc-handlers.ts` + `src/preload/index.ts` + `src/renderer/hooks/useChat.ts`

검증:
- contract의 채널 목록 = ipc-handlers의 `ipcMain.handle/on` 등록 목록
- contract의 채널 목록 ⊇ preload의 `contextBridge` 노출 채널
- preload 노출 채널 ⊇ useChat이 호출하는 채널

불일치 발견 시: 양쪽 에이전트(backend + frontend) 동시 통보.

### 1-2. payload shape 일치

각 채널마다:
1. contract의 입력/응답/payload 타입 확인
2. ipc-handlers에서 `webContents.send(channel, ...)` 또는 `return { ... }`로 보내는 객체의 shape 확인
3. useChat에서 받는 payload의 destructuring 확인
4. 필드명·옵셔널 여부·타입(string vs string[] 등) 비교

**대표적인 버그 패턴:**
- contract: `{ messageId, delta }` / 실제 송신: `{ id, text }` → 둘 다 수정 필요
- contract: `{ chunks: string[] }` / 훅: `data.text` 접근 → 래핑 누락
- snake_case ↔ camelCase 혼용

### 1-3. 에러 코드 enum 일치

contract의 ErrorCode enum과 ipc-handlers의 classifyError 반환값, useChat의 에러 분기 처리가 모두 같은 enum 값을 사용하는지 확인.

## 검증 2: 사용자 요구사항 5개

`requirements-coverage.md`에 매트릭스로 정리.

| 요구사항 | 구현 위치 | 검증 방법 | 통과 조건 |
|---------|----------|----------|----------|
| (1) 항상 떠다님 | `main/index.ts` BrowserWindow 옵션 | grep `alwaysOnTop` | `alwaysOnTop: true` + `setAlwaysOnTop(true, 'floating')` |
| (2) 클릭 → 패널 열림 | `BaseballIcon.tsx` 클릭 핸들러 | onClick 핸들러 + 상태 변경 | 클릭 시 `setPanelOpen(true)` 분기 존재 |
| (3) Claude API 실시간 | `claude-client.ts` 스트리밍 | grep `messages.stream` | 스트리밍 호출 + chunk IPC 송신 |
| (4) 드래그 위치 이동 | `useDraggable.ts` + `ipc-handlers.ts` window 채널 | 드래그 핸들러 + `win.setPosition` | mousedown 핸들러 + 5px 임계값 + IPC 채널 |
| (5) 투명도/사이즈 조절 | `Controls.tsx` + window IPC | 슬라이더 컴포넌트 + IPC | Opacity 슬라이더 → `win.setOpacity`, Size 슬라이더 → 윈도우 dimension + CSS scale |

각 항목에 ✅ / ⚠️ / ❌ 표시.

## 검증 3: Electron 보안

`main/index.ts` BrowserWindow 옵션 검사:
- [ ] `contextIsolation: true`
- [ ] `nodeIntegration: false`
- [ ] `sandbox`는 명시되어 있음
- [ ] preload 외부에서 `ipcRenderer` 직접 노출 없음 (preload만 사용)

`api-key-store.ts` 검사:
- [ ] API 키가 평문으로 디스크에 저장되지 않음 (safeStorage 사용)
- [ ] 키가 IPC로 렌더러에 전달되지 않음 (한 방향: 렌더러 → 메인)
- [ ] 로그에 키 출력 없음 — `console.log(.*apiKey.*)` 검색

**보안 이슈 발견 시:** 보고서 최상단에 🔒 표시, 즉시 알림.

## 검증 4: 디자인 토큰 일관성

읽을 파일: `_workspace/01_design/design-tokens.css` + `src/renderer/styles/tokens.css`

검증:
- 변수명 1:1 일치
- 값 일치 (수정사항 있으면 ui-designer가 갱신했는지 확인)
- 컴포넌트 .tsx에서 하드코딩 색상 없음: grep `#[0-9a-fA-F]{3,6}`, `rgba?\(` 검출

## 검증 5: 드래그 동작 정합성

`useDraggable.ts` ↔ window IPC 채널:
- mousedown에서 `dragStart` 송신
- mousemove에서 5px 임계값 검사 후 `dragMove` 송신
- mouseup에서 `dragEnd` 송신
- 메인 프로세스 핸들러가 세 채널 모두 등록되어 있고 `win.setPosition` 호출

**클릭과 드래그의 분리:**
- mouseup에서 이동 거리 < 5px → 클릭으로 처리 (패널 토글)
- 이동 거리 ≥ 5px → 클릭 이벤트 무시

이 분리가 깨지면 드래그할 때마다 패널이 열려/닫혀 사용성이 망가진다.

## 보고서 작성

`_workspace/04_qa/qa-report.md`:

```markdown
# QA 검증 보고서 (YYYY-MM-DD)

## 요약
- 통과: N개
- 실패: N개
- 미검증: N개

## 통합 정합성 (우선)
### IPC contract ↔ 코드
- [✅/⚠️/❌] 채널 이름 일치 — 상세
- [✅/⚠️/❌] payload shape 일치 — 상세

## 사용자 요구사항 5개
(매트릭스 표)

## 보안
- [✅/❌] contextIsolation
...

## 발견된 경계면 이슈
1. [이슈 제목]
   - 파일: src/foo.ts:42 / src/bar.ts:88
   - 좌(생산자): `{ id, text }`
   - 우(소비자): `{ messageId, delta }`
   - 영향: 채팅 메시지 표시 실패
   - 권장 수정: contract 기준으로 양쪽 통일

## 권장 후속 작업
- backend-dev에게: ...
- frontend-dev에게: ...
```

## 증분 QA 트리거

각 에이전트가 산출물 완료 알림을 보내면 즉시 해당 영역만 검증:
- backend-dev contract 완성 → 검증 1 + 검증 3
- frontend-dev preload 완성 → 검증 1 (preload ↔ contract)
- frontend-dev useChat 완성 → 검증 1 (useChat ↔ contract)
- ui-designer 토큰 완성 + frontend-dev tokens.css 복사 → 검증 4
- 전체 완성 → 모든 검증 + 요구사항 5개

## 자가 점검

- [ ] "존재 확인"이 아니라 "교차 비교"로 검증했는가
- [ ] 경계면 이슈에서 양쪽 코드 발췌를 보고서에 포함했는가
- [ ] 보안 이슈를 보고서 최상단에 강조했는가
- [ ] 미검증 항목을 통과로 표시하지 않았는가
