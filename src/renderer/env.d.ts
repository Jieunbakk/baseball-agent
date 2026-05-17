/// <reference types="vite/client" />

type RemoveFn = () => void

interface KboGameInfo {
  gameId: string
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  inning: string
  status: 'pre' | 'live' | 'final'
}

interface KboNotification {
  message: string
  scoringTeam: string
  isOurTeam: boolean
  score: string
  type: 'score' | 'final'
}

interface Window {
  api: {
    // 윈도우 컨트롤
    dragMove: (dx: number, dy: number) => void
    setOpacity: (opacity: number) => void
    togglePanel: (open: boolean) => void
    showBubble: () => void
    hideBubble: () => void

    // API 키
    hasApiKey: () => Promise<boolean>
    setApiKey: (key: string) => Promise<boolean>
    deleteApiKey: () => Promise<boolean>

    // 채팅
    sendMessage: (messages: { role: 'user' | 'assistant'; content: string }[]) => void
    onStreamChunk: (cb: (text: string) => void) => RemoveFn
    onStreamEnd: (cb: () => void) => RemoveFn
    onStreamError: (cb: (msg: string) => void) => RemoveFn

    // KBO
    setFavoriteTeam: (team: string) => Promise<boolean>
    getFavoriteTeam: () => Promise<string>
    onKboNotification: (cb: (n: KboNotification) => void) => RemoveFn
    onGamesUpdated: (cb: (games: KboGameInfo[]) => void) => RemoveFn
  }
}
