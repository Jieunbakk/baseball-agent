---
name: claude-api-integration
description: "Anthropic SDK 기반 Claude API 통합 워크플로우. 스트리밍 응답, prompt caching, API 키 보안 저장(safeStorage), IPC 채널 설계와 contract 문서화, 에러 분류(키 없음/invalid/rate limit/네트워크)를 처리. Claude API 연결, IPC 통신, API 키 처리 작업 시 반드시 이 스킬을 사용."
---

# Claude API + IPC Integration Skill

Electron 메인 프로세스에서 Claude API를 호출하고 렌더러와 IPC로 통신하는 절차. backend-dev 에이전트가 사용한다.

## 0단계: contract 문서를 먼저 작성

코드보다 `_workspace/02_backend_contract.md`를 먼저 쓴다. 이 문서가 frontend-dev의 단일 진실 공급원이다. 채널 이름·payload shape·에러 코드를 먼저 합의해야 양쪽 모두 같은 그림을 그린다.

### contract.md 필수 섹션

```markdown
# Backend Contract — IPC 채널 명세

## 채널 목록

### chat:send (renderer → main, invoke)
입력: { message: string }
응답: { messageId: string }  // 이후 stream-chunk가 이 messageId로 흐름

### chat:stream-chunk (main → renderer, send)
payload: { messageId: string, delta: string }

### chat:stream-end (main → renderer, send)
payload: { messageId: string }

### chat:error (main → renderer, send)
payload: { messageId?: string, code: ErrorCode, message: string }

### settings:set-api-key (renderer → main, invoke)
입력: { apiKey: string }
응답: { ok: boolean }

### settings:has-api-key (renderer → main, invoke)
응답: { hasKey: boolean }

### window:drag-start / window:drag-move / window:drag-end / window:resize / window:set-opacity
(frontend-dev 영역, 참고만)

## ErrorCode enum
NO_API_KEY | INVALID_API_KEY | RATE_LIMIT | NETWORK | UPSTREAM
```

## 1단계: Anthropic SDK 설정

`src/main/claude-client.ts`:

```ts
import Anthropic from '@anthropic-ai/sdk';

export function createClient(apiKey: string) {
  return new Anthropic({ apiKey });
}

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';
const SYSTEM = '당신은 데스크톱에 떠 있는 야구공 모양의 친절한 AI 어시스턴트입니다. 짧고 명확하게 답하세요.';

export async function* streamChat(
  client: Anthropic,
  history: { role: 'user'|'assistant'; content: string }[],
) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: history,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text;
    }
  }
}
```

**Prompt caching:** 시스템 프롬프트에 `cache_control: { type: 'ephemeral' }`. 히스토리가 길어지면(>1024 tokens) 마지막 user 메시지 직전 메시지에도 cache_control 적용 검토.

**모델 ID:** 기본 `claude-sonnet-4-6`. 환경변수로 오버라이드 가능. ID는 절대 추측하지 말 것 — 모르면 사용자에게 확인.

## 2단계: API 키 보안 저장

`src/main/api-key-store.ts` — Electron의 `safeStorage` 사용 (OS keychain).

```ts
import { safeStorage } from 'electron';
import Store from 'electron-store';

const store = new Store<{ encryptedKey?: string }>();

export function setApiKey(key: string) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('safeStorage unavailable');
  const buf = safeStorage.encryptString(key);
  store.set('encryptedKey', buf.toString('base64'));
}

export function getApiKey(): string | null {
  const encoded = store.get('encryptedKey');
  if (!encoded) return null;
  const buf = Buffer.from(encoded, 'base64');
  return safeStorage.decryptString(buf);
}

export function hasApiKey(): boolean {
  return !!store.get('encryptedKey');
}
```

**금기:** API 키를 평문으로 디스크에 저장하거나, IPC로 렌더러에 노출하거나, 로그에 출력하지 않는다.

## 3단계: IPC 핸들러

`src/main/ipc-handlers.ts`:

```ts
import { ipcMain, BrowserWindow } from 'electron';
import { randomUUID } from 'crypto';
import { createClient, streamChat } from './claude-client';
import { getApiKey, setApiKey, hasApiKey } from './api-key-store';
import { addMessage, getHistory } from './chat-history';

export function registerIpcHandlers(getWindow: () => BrowserWindow | null) {
  ipcMain.handle('chat:send', async (_e, { message }) => {
    const messageId = randomUUID();
    const win = getWindow();
    if (!win) return { messageId };

    const apiKey = getApiKey();
    if (!apiKey) {
      win.webContents.send('chat:error', { messageId, code: 'NO_API_KEY', message: 'API 키를 먼저 설정해주세요' });
      return { messageId };
    }

    addMessage({ role: 'user', content: message });
    const client = createClient(apiKey);

    try {
      let assistantText = '';
      for await (const delta of streamChat(client, getHistory())) {
        assistantText += delta;
        win.webContents.send('chat:stream-chunk', { messageId, delta });
      }
      addMessage({ role: 'assistant', content: assistantText });
      win.webContents.send('chat:stream-end', { messageId });
    } catch (err: any) {
      const code = classifyError(err);
      win.webContents.send('chat:error', { messageId, code, message: friendlyMessage(code) });
    }
    return { messageId };
  });

  ipcMain.handle('settings:set-api-key', async (_e, { apiKey }) => {
    try { setApiKey(apiKey); return { ok: true }; }
    catch { return { ok: false }; }
  });
  ipcMain.handle('settings:has-api-key', () => ({ hasKey: hasApiKey() }));
}

function classifyError(err: any): string {
  if (err?.status === 401 || err?.status === 403) return 'INVALID_API_KEY';
  if (err?.status === 429) return 'RATE_LIMIT';
  if (err?.code === 'ENOTFOUND' || err?.code === 'ECONNRESET') return 'NETWORK';
  return 'UPSTREAM';
}

function friendlyMessage(code: string): string {
  return {
    INVALID_API_KEY: 'API 키가 유효하지 않습니다.',
    RATE_LIMIT: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    NETWORK: '네트워크 연결을 확인해주세요.',
    UPSTREAM: '서버에서 오류가 발생했습니다.',
  }[code] ?? '알 수 없는 오류';
}
```

## 4단계: 메시지 히스토리

`src/main/chat-history.ts` — 메모리 기반(앱 재시작 시 초기화). 길어지면 최근 N개만 유지.

```ts
type Msg = { role: 'user'|'assistant'; content: string };
const MAX = 40;
let history: Msg[] = [];

export function addMessage(m: Msg) {
  history.push(m);
  if (history.length > MAX) history = history.slice(-MAX);
}
export function getHistory(): Msg[] { return [...history]; }
export function clearHistory() { history = []; }
```

장기적으로는 세션별 영속화도 가능하지만 1차 버전은 메모리만.

## 5단계: 재시도 정책

429(rate limit)는 1회 지수 백오프 재시도(2초). 그 외 에러는 즉시 사용자에게 알림. 무한 재시도는 절대 금지.

## 6단계: contract 갱신 프로토콜

- 채널 추가/삭제/필드 변경 시 **contract.md를 먼저 수정**
- frontend-dev에게 SendMessage로 알림 (예: "chat:stream-chunk에 모델 정보 필드 추가됨")
- 둘 다 수정 완료 후 qa-inspector에게 재검증 요청

## 자가 점검

- [ ] API 키가 평문으로 어디에도 저장되지 않는가 (로그/디스크/렌더러 IPC)
- [ ] 모든 IPC 채널이 contract.md에 명세되어 있는가
- [ ] 에러 코드가 enum으로 명시되고, friendlyMessage가 모든 코드를 처리하는가
- [ ] 스트리밍 도중 에러 시 partial 응답 처리 + 에러 코드 송신
- [ ] 재시도는 1회만, 무한 루프 없음
