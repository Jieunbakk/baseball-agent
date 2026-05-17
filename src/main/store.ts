// 앱 전체에서 공유하는 electron-store 인스턴스
// SQLite 대신 electron-store 사용 — 데스크톱 앱에서 별도 DB 서버 불필요
import Store from 'electron-store'
import type { GameInfo } from './kbo/crawler'

export interface GameState {
  homeScore: number
  awayScore: number
  inning: string
  status: 'pre' | 'live' | 'final'
  updatedAt: number
}

export interface NotificationEntry {
  gameId: string
  eventKey: string // '득점_팀명' | 'final_팀명'
  sentAt: number
}

export interface AppStoreSchema {
  // 기존 필드
  windowX: number
  windowY: number
  opacity: number
  encryptedApiKey: string

  // KBO 관련 필드
  favoriteTeam: string                      // 응원팀 (LG, 삼성 등)
  gameStates: Record<string, GameState>     // gameId → 마지막 점수
  notificationLog: NotificationEntry[]      // 중복 알림 방지 로그
}

const store = new Store<AppStoreSchema>({
  defaults: {
    windowX: 0,
    windowY: 0,
    opacity: 1.0,
    encryptedApiKey: '',
    favoriteTeam: '',
    gameStates: {},
    notificationLog: [],
  },
})

export default store
