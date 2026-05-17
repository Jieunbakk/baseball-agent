import { contextBridge, ipcRenderer } from 'electron'

type RemoveFn = () => void

contextBridge.exposeInMainWorld('api', {
  // ── 윈도우 컨트롤 ────────────────────────────────────────
  dragMove: (dx: number, dy: number) => ipcRenderer.send('window:drag-move', { dx, dy }),
  setOpacity: (opacity: number) => ipcRenderer.send('window:set-opacity', opacity),
  togglePanel: (open: boolean) => ipcRenderer.send('window:toggle-panel', open),
  showBubble: () => ipcRenderer.send('window:bubble-show'),
  hideBubble: () => ipcRenderer.send('window:bubble-hide'),

  // ── API 키 설정 ──────────────────────────────────────────
  hasApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:has-api-key'),
  setApiKey: (key: string): Promise<boolean> => ipcRenderer.invoke('settings:set-api-key', key),
  deleteApiKey: (): Promise<boolean> => ipcRenderer.invoke('settings:delete-api-key'),

  // ── 채팅 ─────────────────────────────────────────────────
  sendMessage: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
    ipcRenderer.send('chat:send', { messages }),

  onStreamChunk: (cb: (text: string) => void): RemoveFn => {
    const h = (_: unknown, t: string) => cb(t)
    ipcRenderer.on('chat:stream-chunk', h)
    return () => ipcRenderer.removeListener('chat:stream-chunk', h)
  },
  onStreamEnd: (cb: () => void): RemoveFn => {
    const h = () => cb()
    ipcRenderer.on('chat:stream-end', h)
    return () => ipcRenderer.removeListener('chat:stream-end', h)
  },
  onStreamError: (cb: (msg: string) => void): RemoveFn => {
    const h = (_: unknown, msg: string) => cb(msg)
    ipcRenderer.on('chat:stream-error', h)
    return () => ipcRenderer.removeListener('chat:stream-error', h)
  },

  // ── KBO ──────────────────────────────────────────────────
  setFavoriteTeam: (team: string): Promise<boolean> =>
    ipcRenderer.invoke('kbo:set-favorite-team', team),
  getFavoriteTeam: (): Promise<string> =>
    ipcRenderer.invoke('kbo:get-favorite-team'),

  onKboNotification: (cb: (n: KboNotification) => void): RemoveFn => {
    const h = (_: unknown, n: KboNotification) => cb(n)
    ipcRenderer.on('kbo:notification', h)
    return () => ipcRenderer.removeListener('kbo:notification', h)
  },
  onGamesUpdated: (cb: (games: KboGameInfo[]) => void): RemoveFn => {
    const h = (_: unknown, games: KboGameInfo[]) => cb(games)
    ipcRenderer.on('kbo:games-updated', h)
    return () => ipcRenderer.removeListener('kbo:games-updated', h)
  },
})
