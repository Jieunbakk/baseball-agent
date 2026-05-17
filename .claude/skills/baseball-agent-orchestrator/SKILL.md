---
name: baseball-agent-orchestrator
description: "떠다니는 야구공 AI 어시스턴트 (Electron + Claude API) 빌드 오케스트레이터. 파이프라인 + 에이전트 팀 모드로 ui-designer → backend-dev → frontend-dev → qa-inspector를 조율하여 데스크톱 위젯 앱을 생성. 야구공 어시스턴트, 떠다니는 야구공, baseball agent, Electron 어시스턴트 앱 빌드 요청 시 사용. 후속 작업: 야구공 앱 수정, 디자인 변경, 채팅 기능 보완, IPC 채널 추가, QA 재실행, 부분 재구현, 다시 빌드, 결과 개선, 이전 결과 기반 업데이트 요청 시에도 반드시 이 스킬을 사용."
---

# Baseball Agent Build Orchestrator

떠다니는 야구공 AI 어시스턴트(Electron + React + Claude API) 빌드를 조율하는 통합 스킬. 4명의 전문 에이전트가 파이프라인으로 협업하며 산출물이 누적된다.

## 실행 모드: 에이전트 팀 (파이프라인 + 실시간 통신)

순서는 파이프라인이지만, 각 에이전트는 `SendMessage`로 직접 통신하며 경계면 이슈를 즉시 해결한다. backend contract 확정 이후에는 frontend와 backend가 병렬로 진행한다.

## 에이전트 구성

| 팀원 | 에이전트 타입 | 역할 | 사용 스킬 | 주 출력 위치 |
|------|-------------|------|----------|------------|
| ui-designer | ui-designer (커스텀) | SVG + 디자인 토큰 + UI 목업 | svg-design | `_workspace/01_design/` |
| backend-dev | backend-dev (커스텀) | Claude API + IPC contract | claude-api-integration | `src/main/`, `_workspace/02_backend_contract.md` |
| frontend-dev | frontend-dev (커스텀) | Electron + React 구현 | electron-react | `src/` |
| qa-inspector | qa-inspector (커스텀) | 통합 정합성 검증 | integration-qa | `_workspace/04_qa/` |

**모델:** 전원 `opus`.

## 워크플로우

### Phase 0: 컨텍스트 확인

1. `_workspace/` 디렉토리 존재 여부 확인
2. `src/`의 기존 파일 목록 확인
3. 실행 모드 결정:
   - **`_workspace/` 미존재** → 초기 빌드. Phase 1로 진행
   - **`_workspace/` 존재 + 사용자가 부분 수정 요청** (예: "야구공 색만 바꿔줘", "QA만 다시", "IPC 채널 하나 추가") → 부분 재실행. 해당 에이전트만 호출하여 기존 결과를 읽고 수정
   - **`_workspace/` 존재 + 새 요구사항 추가/전면 재빌드** → 새 실행. 기존 `_workspace/`를 `_workspace_{YYYYMMDD_HHMMSS}/`로 이동, `src/`는 그대로 두고 덮어쓰기 (작업 손실 방지를 위해 사용자에게 사전 확인)
4. 부분 재실행 시: 호출되는 에이전트에게 이전 산출물 경로 + 사용자 피드백을 명시적으로 전달

### Phase 1: 준비

1. 사용자 요구사항을 5개 항목으로 정리: 항상 떠다님 / 클릭 시 패널 / Claude API 실시간 / 드래그 이동 / 투명도·사이즈 조절
2. 작업 디렉토리에 `_workspace/` 생성 (또는 새 실행 시 기존 보관)
3. `_workspace/00_requirements.md`에 요구사항·제약·범위 정리
4. API 키 처리 정책 확정 — 사용자가 앱 첫 실행 시 입력하고 safeStorage에 저장하는 흐름

### Phase 2: 팀 구성

`TeamCreate`로 4명 팀 생성:

```
TeamCreate(
  team_name: "baseball-agent-team",
  members: [
    { name: "ui-designer", agent_type: "ui-designer", model: "opus",
      prompt: "..._workspace/00_requirements.md를 읽고 svg-design 스킬에 따라 _workspace/01_design/에 자산 생성. 완료 시 backend-dev, frontend-dev에 SendMessage." },
    { name: "backend-dev", agent_type: "backend-dev", model: "opus",
      prompt: "_workspace/00_requirements.md를 읽고 claude-api-integration 스킬에 따라 먼저 _workspace/02_backend_contract.md를 작성한 뒤 src/main/claude-client.ts, ipc-handlers.ts, api-key-store.ts, chat-history.ts 구현. contract 변경은 frontend-dev에게 즉시 알림." },
    { name: "frontend-dev", agent_type: "frontend-dev", model: "opus",
      prompt: "_workspace/01_design/과 _workspace/02_backend_contract.md를 읽고 electron-react 스킬에 따라 src/main/index.ts·preload·renderer 일체 구현. backend-dev contract가 확정될 때까지 mock IPC로 컴포넌트 선행." },
    { name: "qa-inspector", agent_type: "qa-inspector", model: "opus",
      prompt: "integration-qa 스킬에 따라 증분 QA 수행. 각 에이전트의 완료 알림을 받으면 즉시 해당 영역 검증, 경계면 이슈 발견 시 양쪽 에이전트 동시 통보." }
  ]
)
```

`TaskCreate`로 작업 등록 (의존성 명시):

```
TaskCreate(tasks: [
  // ui-designer
  { id: "T1", title: "SVG + 토큰 + 목업 생성", assignee: "ui-designer" },
  { id: "T2", title: "인터랙션 상태 명세", assignee: "ui-designer", depends_on: ["T1"] },

  // backend-dev (T3가 우선 — frontend-dev가 기다림)
  { id: "T3", title: "IPC contract 문서화", assignee: "backend-dev" },
  { id: "T4", title: "Claude API 클라이언트 + 스트리밍", assignee: "backend-dev", depends_on: ["T3"] },
  { id: "T5", title: "API 키 safeStorage 저장", assignee: "backend-dev", depends_on: ["T3"] },
  { id: "T6", title: "IPC 핸들러 등록 + 에러 분류", assignee: "backend-dev", depends_on: ["T4","T5"] },

  // frontend-dev
  { id: "T7", title: "Electron 메인 + BrowserWindow 옵션", assignee: "frontend-dev" },
  { id: "T8", title: "preload contextBridge", assignee: "frontend-dev", depends_on: ["T3"] },
  { id: "T9", title: "React 컴포넌트 (Icon/Panel/Controls)", assignee: "frontend-dev", depends_on: ["T1"] },
  { id: "T10", title: "useDraggable + 5px 임계값 클릭 분리", assignee: "frontend-dev", depends_on: ["T7"] },
  { id: "T11", title: "useChat + 스트리밍 표시", assignee: "frontend-dev", depends_on: ["T8","T6"] },
  { id: "T12", title: "투명도/사이즈 슬라이더 + 윈도우 상태 저장", assignee: "frontend-dev", depends_on: ["T7"] },

  // qa-inspector (증분 + 최종)
  { id: "T13", title: "contract ↔ preload ↔ useChat 교차 검증", assignee: "qa-inspector", depends_on: ["T8","T11"] },
  { id: "T14", title: "디자인 토큰 ↔ tokens.css 일치 검증", assignee: "qa-inspector", depends_on: ["T1","T9"] },
  { id: "T15", title: "요구사항 5개 커버리지 매트릭스", assignee: "qa-inspector", depends_on: ["T7","T10","T11","T12"] },
  { id: "T16", title: "Electron 보안 점검 + 최종 보고서", assignee: "qa-inspector", depends_on: ["T13","T14","T15"] },
])
```

### Phase 3: 디자인 (파이프라인 1단계)

ui-designer가 단독으로 진행.
- 작업: T1, T2
- 완료 시: backend-dev, frontend-dev에게 "디자인 산출물 완료" SendMessage
- 리더는 산출물(`_workspace/01_design/`) 존재 확인

### Phase 4: Contract 확정 (파이프라인 2단계 — 병목 해소)

backend-dev가 T3를 최우선으로 처리.
- T3 완료 즉시 frontend-dev에게 "contract.md 1차 완성" SendMessage
- frontend-dev는 이 시점부터 preload·useChat 작업 시작 가능
- T3 이후 T4~T6은 frontend의 작업과 병렬

### Phase 5: 병렬 구현 (파이프라인 3단계, 사실상 팬아웃)

frontend-dev와 backend-dev가 자체 작업 목록에서 동시 진행.
- frontend-dev: T7~T12
- backend-dev: T4~T6
- ui-designer는 대기. 단, 양쪽에서 토큰 부족·시각 명세 모호 SendMessage 오면 응대
- qa-inspector는 증분 QA 시작:
  - T8 완료 → 검증 1-1, 1-2 (preload ↔ contract)
  - T11 완료 → 검증 1-2 (useChat ↔ contract)
  - T1 + T9 완료 → 검증 4 (디자인 토큰 ↔ tokens.css)

**경계면 이슈 발견 시 흐름:**
1. qa-inspector가 이슈 감지 → backend-dev + frontend-dev에 동시 SendMessage
2. 두 에이전트가 contract.md 기준으로 합의
3. 양쪽 수정 완료 후 qa-inspector에 재검증 요청
4. 통과까지 반복

### Phase 6: 통합 QA (파이프라인 4단계)

모든 구현 작업(T4~T12) 완료 후 qa-inspector가 최종 검증.
- T15: 요구사항 5개 커버리지 매트릭스
- T16: Electron 보안 점검 + 최종 보고서 작성
- 출력: `_workspace/04_qa/qa-report.md`, `boundary-issues.md`, `requirements-coverage.md`

리더는 QA 보고서를 읽고:
- 🔒 보안 이슈가 있으면 즉시 backend-dev에 수정 요청
- ❌ 실패 항목이 있으면 해당 에이전트에 추가 작업 요청
- 모두 ✅이면 Phase 7로

### Phase 7: 정리 및 보고

1. 팀원들에게 종료 메시지 (SendMessage)
2. `TeamDelete`로 팀 정리
3. `_workspace/`는 보존 (감사 추적용)
4. 사용자에게 최종 보고:
   - 구현된 기능 (요구사항 5개 충족 매트릭스 요약)
   - 실행 방법 (`npm install`, `npm run dev`)
   - API 키 설정 방법 (첫 실행 시 설정 UI에서 입력)
   - QA 결과 요약 (통과/실패)
   - 알려진 제약 사항

## 데이터 흐름

```
사용자 요구사항
    ↓
_workspace/00_requirements.md
    ↓
[ui-designer] ──→ _workspace/01_design/{baseball-icon.svg, design-tokens.css, mockup, states}
    ↓ (SendMessage)
[backend-dev] ──→ _workspace/02_backend_contract.md ──→ frontend-dev 통보
    ↓                ↓
src/main/*       (병렬 구현)
                     ↓
                 [frontend-dev] ──→ src/{main,preload,renderer}/*
                                          ↓
                 [qa-inspector] ──증분 검증→ 경계면 이슈 발견 → 양쪽 SendMessage
                                          ↓
                 _workspace/04_qa/{qa-report, boundary-issues, requirements-coverage}.md
                                          ↓
                                      [리더 통합]
                                          ↓
                                       최종 보고
```

## 에러 핸들링

| 상황 | 전략 |
|------|------|
| ui-designer가 토큰 정의 누락 | frontend-dev가 SendMessage로 요청, ui-designer가 추가 |
| backend-dev contract 변경 | frontend-dev에게 즉시 통보, useChat·preload 동시 수정, qa-inspector 재검증 |
| frontend-dev가 contract 위반 (필드명 오타 등) | qa-inspector가 양쪽 동시 통보, contract 기준으로 정정 |
| 팀원 1명 실패/중지 | 리더가 SendMessage로 상태 확인 → 재시작 또는 대체 작업 분할 |
| QA에서 보안 이슈 발견 (예: nodeIntegration: true) | 빌드 중단, backend-dev에 즉시 수정 요청, 수정 후 진행 |
| API 키 처리 정책 충돌 | 리더가 사용자에게 확인 후 결정 |
| 타임아웃 | 현재까지 수집된 부분 결과 사용, 미완료는 보고서에 명시 |

## 부분 재실행 시나리오

| 사용자 요청 예 | 호출 대상 | 동작 |
|--------------|----------|------|
| "야구공 색만 분홍으로" | ui-designer | design-tokens.css의 ball-bg/stitch만 수정, frontend-dev에 통보 |
| "메시지 입력 후 엔터 전송 안 되는 버그" | frontend-dev | ChatPanel 입력 핸들러 점검·수정 |
| "Claude 모델을 Opus로 바꿔줘" | backend-dev | claude-client.ts의 MODEL 변경 + contract 갱신 |
| "QA 다시 돌려줘" | qa-inspector | 현재 산출물 전체 재검증 |
| "IPC 채널에 토큰 사용량 필드 추가" | backend-dev + frontend-dev + qa-inspector | contract 갱신 → 양쪽 구현 → 재검증 |

## 테스트 시나리오

### 정상 흐름
1. 사용자가 "야구공 어시스턴트 빌드" 요청
2. Phase 0: `_workspace/` 미존재 → 초기 빌드
3. Phase 1: 요구사항 5개 정리, `_workspace/00_requirements.md` 생성
4. Phase 2: 4명 팀 생성, 16개 작업 등록
5. Phase 3: ui-designer가 SVG·토큰·목업 생성
6. Phase 4: backend-dev가 contract.md 1차 완성, frontend-dev에 통보
7. Phase 5: frontend·backend 병렬 구현, qa가 증분 검증
8. Phase 6: qa-inspector 최종 보고서 작성, 모든 요구사항 ✅
9. Phase 7: 팀 정리, 사용자에게 실행 방법 안내
10. 예상 결과: `src/` 완성, `_workspace/04_qa/qa-report.md` 생성

### 에러 흐름 — 경계면 불일치
1. Phase 5에서 frontend-dev가 useChat에서 `data.text`로 접근 (contract는 `delta`)
2. qa-inspector가 T11 완료 알림 받자마자 검증 → 불일치 발견
3. backend-dev + frontend-dev에 동시 SendMessage (양쪽 코드 발췌 포함)
4. contract.md 기준으로 frontend-dev가 `delta`로 수정
5. qa-inspector 재검증 → 통과
6. Phase 6 정상 진행

## description의 후속 작업 키워드 (재트리거 보장)

본 description에 다음 표현 포함됨 — 새 세션에서도 후속 요청이 트리거됨:
- 야구공 앱 수정 / 디자인 변경 / 채팅 기능 보완
- IPC 채널 추가 / QA 재실행 / 부분 재구현
- 다시 빌드 / 결과 개선 / 이전 결과 기반 업데이트
