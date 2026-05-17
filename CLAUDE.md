# Baseball Agent — 떠다니는 야구공 AI 어시스턴트

Electron + React + Claude API로 만드는 데스크톱 오버레이 위젯 프로젝트.

## 하네스: Baseball Agent Build

**목표:** 4명의 전문 에이전트(UI Designer / Backend Dev / Frontend Dev / QA Inspector)가 파이프라인으로 협업하여 떠다니는 야구공 AI 어시스턴트를 빌드한다.

**트리거:** 야구공 어시스턴트의 빌드·수정·QA·디자인 변경·IPC 채널 추가·부분 재구현 요청 시 `baseball-agent-orchestrator` 스킬을 사용하라. 단순 질문이나 단발성 코드 수정은 직접 응답 가능.

**변경 이력:**

| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-05-15 | 초기 구성 (4 에이전트 + 4 스킬 + 오케스트레이터) | 전체 | 신규 프로젝트 |
