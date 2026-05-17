<div align="center">

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="120" height="120">
  <defs>
    <radialGradient id="bh" cx="0.32" cy="0.28" r="0.55">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="42" fill="#f5f5f3"/>
  <circle cx="50" cy="50" r="42" fill="url(#bh)"/>
  <path d="M 33 14 Q 22 50 33 86" fill="none" stroke="#9ca3af" stroke-width="2.2" stroke-linecap="round"/>
  <path d="M 67 14 Q 78 50 67 86" fill="none" stroke="#9ca3af" stroke-width="2.2" stroke-linecap="round"/>
  <g stroke="#d96060" stroke-width="1.6" stroke-linecap="round" fill="none">
    <path d="M 28 24 L 31 19 L 34 24"/><path d="M 25 34 L 28 29 L 31 34"/>
    <path d="M 24 44 L 27 39 L 30 44"/><path d="M 24 55 L 27 50 L 30 55"/>
    <path d="M 25 65 L 28 60 L 31 65"/><path d="M 27 75 L 30 70 L 33 75"/>
  </g>
  <g stroke="#d96060" stroke-width="1.6" stroke-linecap="round" fill="none">
    <path d="M 66 24 L 69 19 L 72 24"/><path d="M 69 34 L 72 29 L 75 34"/>
    <path d="M 70 44 L 73 39 L 76 44"/><path d="M 70 55 L 73 50 L 76 55"/>
    <path d="M 69 65 L 72 60 L 75 65"/><path d="M 67 75 L 70 70 L 73 75"/>
  </g>
  <circle cx="34" cy="60" r="5" fill="rgba(255,130,130,0.30)"/>
  <circle cx="66" cy="60" r="5" fill="rgba(255,130,130,0.30)"/>
  <circle cx="40" cy="47" r="3.2" fill="#3d3d3d"/>
  <circle cx="60" cy="47" r="3.2" fill="#3d3d3d"/>
  <circle cx="41.2" cy="45.8" r="1.1" fill="white"/>
  <circle cx="61.2" cy="45.8" r="1.1" fill="white"/>
  <path d="M 40 60 Q 50 70 60 60" fill="none" stroke="#4a4a4a" stroke-width="2.2" stroke-linecap="round"/>
</svg>

# ⚾ Baseball Agent

**떠다니는 야구공 AI 어시스턴트**

KBO 실시간 점수를 알려주고, Claude API로 대화할 수 있는 macOS 데스크톱 오버레이 위젯

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)
![Claude API](https://img.shields.io/badge/Claude_API-Anthropic-D97706)

</div>

---

## ✨ 기능

- **⚾ 항상 최상단 오버레이** — 화면 위에 항상 떠 있는 야구공 아이콘, 드래그로 위치 이동
- **💬 Claude AI 채팅** — 클릭 시 채팅 패널 오픈, 스트리밍 응답 지원
- **📊 KBO 실시간 점수** — 3분마다 오늘의 경기 스코어 자동 갱신
- **🔔 득점/경기 종료 알림** — 응원팀 득점 시 귀여운 말풍선 팝업 알림
- **🎭 Claude 반응 메시지** — 득점 상황에 맞춰 Claude Haiku가 즉흥 반응 생성
- **🏟️ 응원팀 선택** — KBO 10개 구단 중 응원팀 설정
- **🔑 API 키 암호화 저장** — Electron safeStorage로 안전하게 보관

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Electron 31, React 18, TypeScript 5.5 |
| 빌드 | electron-vite, Vite 5 |
| AI | Anthropic Claude API (Sonnet — 채팅 / Haiku — 알림) |
| KBO 크롤링 | Playwright (headless Chromium) + Cheerio |
| 스케줄링 | node-schedule (3분 간격 폴링) |
| 데이터 저장 | electron-store (JSON 기반 영구 저장) |
| 보안 | Electron safeStorage (API 키 암호화) |

## 📁 프로젝트 구조

```
src/
├── main/
│   ├── index.ts              # 메인 프로세스, IPC 핸들러, BrowserWindow
│   ├── store.ts              # electron-store 공유 인스턴스
│   └── kbo/
│       ├── crawler.ts        # Playwright KBO 스케줄 크롤러
│       ├── score-tracker.ts  # 점수 변화 감지 & 중복 방지
│       ├── notification.ts   # Claude API 반응 메시지 생성
│       └── scheduler.ts      # 3분 간격 폴링 스케줄러
├── preload/
│   └── index.ts              # contextBridge IPC 노출
└── renderer/
    ├── App.tsx               # 루트 컴포넌트, 상태 관리
    └── components/
        ├── BallIcon.tsx      # 드래그 가능한 야구공 SVG 아이콘
        ├── ChatPanel.tsx     # 채팅 패널 (헤더 + 스코어보드 + 메시지)
        ├── ScoreBoard.tsx    # 오늘의 KBO 경기 스코어 접이식 보드
        ├── SpeechBubble.tsx  # 득점 알림 말풍선
        ├── TeamSelect.tsx    # 응원팀 선택 UI (10개 구단)
        ├── MessageList.tsx   # 채팅 메시지 목록
        ├── InputBar.tsx      # 메시지 입력창
        ├── ApiKeySetup.tsx   # API 키 설정 화면
        └── Controls.tsx      # 투명도 슬라이더
```

## 🚀 시작하기

### 요구사항

- Node.js 20+
- npm 10+
- Anthropic API 키 ([발급 링크](https://console.anthropic.com))
- Playwright용 Chromium (`npx playwright install chromium`)

### 설치

```bash
git clone https://github.com/Jieunbakk/baseball-agent.git
cd baseball-agent
npm install
npx playwright install chromium
```

## 🧪 개발

### 개발 모드 실행

```bash
npm run dev
```

앱 실행 후 처음 한 번:
1. 야구공 아이콘 클릭 → 응원팀 선택
2. ⚙ 버튼 → Anthropic API 키 입력
3. 이후 자동으로 KBO 점수 수집 시작

### 빌드

```bash
npm run build
```

`out/` 디렉토리에 빌드 결과물이 생성됩니다.

### 배포 패키징

```bash
npm run dist
```

| 플랫폼 | 출력 형식 |
|--------|----------|
| macOS | `.dmg` (arm64 / x64) |
| Windows | `.exe` (NSIS 인스톨러) |
| Linux | `.AppImage` |

## 🔧 환경 변수

앱 내에서 설정하므로 별도의 `.env` 파일은 필요하지 않습니다.  
API 키는 실행 중 ⚙ 버튼을 통해 입력하며 **Electron safeStorage**로 OS 키체인에 암호화 저장됩니다.

| 환경 변수 | 설명 | 기본값 |
|----------|------|--------|
| `CLAUDE_MODEL` | 사용할 Claude 모델 ID | `claude-sonnet-4-6` |

## 📊 주요 기술 결정사항

### 1. Playwright 도입 (KBO 크롤링)
KBO 공식 사이트는 JS로 렌더링되는 SPA라 axios + cheerio로는 빈 HTML만 반환됩니다.  
Playwright headless Chromium으로 `networkidle` 완료 후 HTML을 파싱하는 방식으로 해결했습니다.

### 2. electron-store (SQLite 대신)
데스크톱 위젯 특성상 별도 DB 서버가 불필요하고, SQLite는 Electron 네이티브 모듈 리빌드가 필요합니다.  
electron-store(JSON 파일 기반)로 경량화하고 배포 복잡성을 줄였습니다.

### 3. 이중 Claude 모델 전략
- **채팅**: `claude-sonnet-4-6` — 풍부한 답변 품질
- **득점 알림**: `claude-haiku-4-5` — 낮은 레이턴시, 30자 이내 즉흥 반응에 최적

### 4. 커스텀 드래그 구현
`-webkit-app-region: drag` 대신 `mousedown → 5px 임계값 → mousemove` 방식으로 구현해  
드래그와 클릭(패널 토글)을 명확히 구분하고 `requestAnimationFrame`으로 이동 성능을 최적화했습니다.

### 5. 5분 중복 알림 방지
같은 득점 이벤트가 3분 폴링 사이클 사이에 반복 감지되는 것을 막기 위해  
electron-store에 알림 로그를 기록하고 5분 이내 동일 이벤트는 무시합니다.

## 🎓 배운 점 & 개선사항

### 구현한 기술
- **Electron IPC 패턴** — contextBridge / contextIsolation 기반 보안 통신 구조 설계
- **Claude API 스트리밍** — `messages.stream()` + `on('text')` 이벤트로 실시간 타이핑 구현
- **Playwright 자동화** — 동적 렌더링 사이트 파싱, networkidle 대기 전략
- **Electron safeStorage** — OS 키체인 연동 API 키 암호화
- **Claude Code 멀티에이전트 하네스** — UI Designer / Backend Dev / Frontend Dev / QA Inspector 4개 에이전트가 파이프라인으로 협업하는 개발 구조 구축

### 향후 개선 계획
- [ ] 이닝별 실시간 점수 (KBO 게임센터 API 연동)
- [ ] Windows / Linux 지원 테스트
- [ ] 시스템 트레이 아이콘 지원
- [ ] 경기 일정 미리 알림 (시작 10분 전)
- [ ] 다크/라이트 모드 자동 전환

## 🤝 기여

이슈나 PR을 환영합니다!

```bash
# 포크 → 브랜치 생성 → 수정 → PR 제출
git checkout -b feature/amazing-feature
git commit -m 'Add amazing feature'
git push origin feature/amazing-feature
```

## 👤 저자

**박지은**
- GitHub: [@Jieunbakk](https://github.com/Jieunbakk)
- Email: sgu101620@gmail.com

## 🙏 감사의 말

- KBO 공식 웹사이트
- Anthropic Claude API
- React & Electron 커뮤니티

---

**⭐ 별 한번 눌러주시면 감사합니다!**
