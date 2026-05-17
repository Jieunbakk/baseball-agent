# 떠다니는 야구공 AI 어시스턴트 — 요구사항

빌드 일시: 2026-05-15
빌드 모드: 초기 빌드 (서브 에이전트 순차 호출)

## 1. 핵심 요구사항 (5개)

| # | 요구사항 | 검증 기준 |
|---|---------|----------|
| 1 | 화면 위에 항상 떠다니는 야구공 아이콘 | `alwaysOnTop: true` + 모든 워크스페이스에서 보임 |
| 2 | 클릭하면 채팅 UI 패널 열림 | 야구공 클릭 시 패널 슬라이드 인 (5px 드래그 임계값으로 클릭 구분) |
| 3 | Claude API와 실시간 연결 | Anthropic SDK 스트리밍 + IPC chunk 전달 |
| 4 | 드래그로 위치 이동 | mousedown + 5px 초과 이동 시 윈도우 이동, IPC 기반 |
| 5 | 투명도/사이즈 조절 | Opacity 슬라이더 (0.4~1.0), Size 슬라이더 (0.7~1.4) |

## 2. 기술 스택

- Electron (메인 프로세스 + preload + 렌더러)
- React 18 + TypeScript
- Vite (멀티 빌드)
- Anthropic SDK (`@anthropic-ai/sdk`)
- `electron-store` (윈도우 상태 저장)
- Electron `safeStorage` (API 키 암호화)

## 3. 보안 정책

- `contextIsolation: true`, `nodeIntegration: false` 고정
- API 키는 `safeStorage`로 OS keychain에 암호화 저장
- 키를 IPC로 렌더러에 절대 노출하지 않음
- 로그·콘솔에 키 출력 금지

## 4. 모델 정책

- 기본 모델: `claude-sonnet-4-6`
- 환경변수 `CLAUDE_MODEL`로 오버라이드 가능
- 시스템 프롬프트와 (장기적으로) 히스토리에 prompt caching 적용

## 5. API 키 처리 흐름

1. 앱 첫 실행 시 `settings:has-api-key` 호출 → `false`면 설정 UI 표시
2. 사용자가 키 입력 → `settings:set-api-key`로 메인 전송 → safeStorage 저장
3. 이후 채팅 시 메인 프로세스가 키를 로드하여 SDK 호출

## 6. 디자인 참조

- ui-designer는 svg-design 스킬의 메모 "`/ball/25475.jpg` 스타일의 귀여운 느낌"을 참고하여 SVG 디자인
- 귀여워야됨.
- 눈,입이 있으면 좋음 . 눈은 점으로 입은 웃고 있는 야구공
- 야구 실밥이 > 모양이 아닌 ㅅ 모양 이여야됨
- 토큰은 다크/라이트 배경 모두에서 가독성 유지

## 7. 산출물 위치

| 산출물 | 위치 |
|--------|------|
| 디자인 자산 | `_workspace/01_design/` |
| IPC contract | `_workspace/02_backend_contract.md` |
| Frontend 요약 | `_workspace/03_frontend_summary.md` |
| QA 리포트 | `_workspace/04_qa/` |
| 실제 코드 | `src/` (Electron 메인/preload/렌더러) |
| 설정 파일 | 프로젝트 루트 (`package.json`, `tsconfig*.json`, `vite.config.ts`, `electron-builder.yml`, `.gitignore`) |

## 8. 빌드 단계

1. Phase 1: 요구사항 정리 (이 문서)
2. Phase 3: ui-designer → 디자인 자산
3. Phase 4: backend-dev → contract + Claude API + IPC + 키 저장
4. Phase 5: frontend-dev → Electron 메인 + preload + React 렌더러
5. Phase 6: qa-inspector → 통합 정합성 검증 보고서
6. Phase 7: 발견된 이슈 수정 + 최종 보고

## 9. 환경 제약

- 환경에 `TeamCreate` 도구가 없어 에이전트 팀 모드 대신 **서브 에이전트 순차 호출**로 진행
- 에이전트 간 통신은 파일 기반 (각 단계의 산출물을 다음 에이전트에 명시적 전달)
- QA는 전체 구현 후 1회 일괄 검증 (증분 검증 불가 — 순차 호출 한계)
