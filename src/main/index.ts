import { app, BrowserWindow, ipcMain, screen, safeStorage } from 'electron'
import { join } from 'path'
import Anthropic from '@anthropic-ai/sdk'
import store from './store'
import { startKboScheduler, stopKboScheduler } from './kbo/scheduler'

const BALL_W = 88
const BALL_H = 88
const PANEL_W = 368
const PANEL_H = 528
// 말풍선 표시 시 확장 너비 (볼 88 + 여백 10 + 말풍선 최대 220)
const BUBBLE_W = 318
const BUBBLE_H = 88

let mainWindow: BrowserWindow | null = null
let isPanelOpen = false

function createWindow(): void {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize

  const x = store.get('windowX', sw - BALL_W - 40) as number
  const y = store.get('windowY', Math.floor(sh / 2) - 44) as number
  const opacity = store.get('opacity', 1.0) as number

  mainWindow = new BrowserWindow({
    x,
    y,
    width: BALL_W,
    height: BALL_H,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js'),
    },
  })

  mainWindow.setOpacity(opacity)
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('moved', () => {
    if (!mainWindow) return
    const [wx, wy] = mainWindow.getPosition()
    store.set('windowX', wx)
    store.set('windowY', wy)
  })

  // KBO 스케줄러 시작
  startKboScheduler(mainWindow, getApiKey)
}

// ── 윈도우 컨트롤 IPC ──────────────────────────────────────────────────────

ipcMain.on('window:drag-move', (_e, { dx, dy }: { dx: number; dy: number }) => {
  if (!mainWindow) return
  const [x, y] = mainWindow.getPosition()
  mainWindow.setPosition(x + Math.round(dx), y + Math.round(dy))
})

ipcMain.on('window:set-opacity', (_e, opacity: number) => {
  if (!mainWindow) return
  const val = Math.max(0.4, Math.min(1.0, opacity))
  mainWindow.setOpacity(val)
  store.set('opacity', val)
})

ipcMain.on('window:toggle-panel', (_e, open: boolean) => {
  if (!mainWindow) return
  isPanelOpen = open
  const [x, y] = mainWindow.getPosition()
  if (open) {
    mainWindow.setSize(PANEL_W, PANEL_H)
    mainWindow.setPosition(x, y)
  } else {
    mainWindow.setSize(BALL_W, BALL_H)
    mainWindow.setPosition(x, y)
  }
})

// 말풍선 표시/숨김 — 볼 전용 모드에서 윈도우 너비 확장
ipcMain.on('window:bubble-show', () => {
  if (!mainWindow || isPanelOpen) return
  mainWindow.setSize(BUBBLE_W, BUBBLE_H)
})

ipcMain.on('window:bubble-hide', () => {
  if (!mainWindow || isPanelOpen) return
  mainWindow.setSize(BALL_W, BALL_H)
})

// ── API 키 IPC ─────────────────────────────────────────────────────────────

ipcMain.handle('settings:has-api-key', () => {
  return Boolean(store.get('encryptedApiKey', ''))
})

ipcMain.handle('settings:set-api-key', (_e, key: string) => {
  try {
    if (safeStorage.isEncryptionAvailable()) {
      store.set('encryptedApiKey', safeStorage.encryptString(key).toString('base64'))
    } else {
      store.set('encryptedApiKey', Buffer.from(key).toString('base64'))
    }
    return true
  } catch {
    return false
  }
})

ipcMain.handle('settings:delete-api-key', () => {
  store.delete('encryptedApiKey')
  return true
})

export function getApiKey(): string | null {
  const b64 = store.get('encryptedApiKey', '') as string
  if (!b64) return null
  try {
    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(b64, 'base64'))
    }
    return Buffer.from(b64, 'base64').toString('utf-8')
  } catch {
    return null
  }
}

// ── KBO 관련 IPC ───────────────────────────────────────────────────────────

// 응원팀 저장
ipcMain.handle('kbo:set-favorite-team', (_e, team: string) => {
  store.set('favoriteTeam', team)
  return true
})

// 응원팀 조회
ipcMain.handle('kbo:get-favorite-team', () => {
  return store.get('favoriteTeam', '') as string
})

// ── 채팅 IPC ──────────────────────────────────────────────────────────────

ipcMain.on(
  'chat:send',
  async (event, { messages }: { messages: { role: 'user' | 'assistant'; content: string }[] }) => {
    const apiKey = getApiKey()
    if (!apiKey) {
      event.sender.send('chat:stream-error', 'API 키가 설정되지 않았습니다.')
      return
    }

    const client = new Anthropic({ apiKey })
    const model = process.env['CLAUDE_MODEL'] ?? 'claude-sonnet-4-6'

    try {
      const stream = client.messages.stream({
        model,
        max_tokens: 2048,
        system: [
          {
            type: 'text',
            text: '당신은 데스크톱 오버레이 위젯에 내장된 AI 어시스턴트입니다. 친근하고 간결하게 응답하세요. 필요하면 마크다운을 사용해도 됩니다.',
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages,
      })

      stream.on('text', (text) => event.sender.send('chat:stream-chunk', text))
      await stream.finalMessage()
      event.sender.send('chat:stream-end')
    } catch (err: unknown) {
      event.sender.send('chat:stream-error', err instanceof Error ? err.message : String(err))
    }
  },
)

// ── 앱 생명주기 ────────────────────────────────────────────────────────────

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  stopKboScheduler()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
