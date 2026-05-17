// KBO 점수 폴링 스케줄러 — 3분마다 크롤링 & 변화 감지 & 알림 전송
import * as schedule from 'node-schedule'
import type { BrowserWindow } from 'electron'
import { fetchTodayGames } from './crawler'
import { detectChanges, isDuplicate, logNotification } from './score-tracker'
import { generateMessage } from './notification'
import store from '../store'

export interface KboNotification {
  message: string
  scoringTeam: string
  isOurTeam: boolean
  score: string         // "LG 3:2 삼성" 형태
  type: 'score' | 'final'
}

let job: schedule.Job | null = null

// 스케줄러 시작 — 즉시 1회 실행 후 3분마다 반복
export function startKboScheduler(
  win: BrowserWindow,
  getApiKey: () => string | null,
): void {
  // 앱 시작 시 즉시 1회 실행
  runCycle(win, getApiKey)

  // 3분마다 반복 (서버 부하 고려)
  job = schedule.scheduleJob('*/3 * * * *', () => {
    runCycle(win, getApiKey)
  })

  console.log('[KBO 스케줄러] 시작됨 — 3분 간격')
}

export function stopKboScheduler(): void {
  job?.cancel()
  job = null
  console.log('[KBO 스케줄러] 중지됨')
}

async function runCycle(
  win: BrowserWindow,
  getApiKey: () => string | null,
): Promise<void> {
  try {
    const favoriteTeam = store.get('favoriteTeam') as string
    if (!favoriteTeam) {
      // 응원팀 미선택 — 경기 목록만 전송
      const games = await fetchTodayGames()
      if (!win.isDestroyed()) win.webContents.send('kbo:games-updated', games)
      return
    }

    const games = await fetchTodayGames()

    // 최신 경기 목록 렌더러에 전송
    if (!win.isDestroyed()) win.webContents.send('kbo:games-updated', games)

    // 점수 변화 감지
    const events = detectChanges(games, favoriteTeam)
    const apiKey = getApiKey()

    for (const event of events) {
      // 이벤트 키 생성 (중복 방지용)
      const eventKey =
        event.type === 'final'
          ? `final_${event.scoringTeam}`
          : `score_${event.scoringTeam}_${event.game.homeScore}_${event.game.awayScore}`

      if (isDuplicate(event.game.gameId, eventKey)) continue

      // 메시지 생성 (Claude API or 기본)
      const message = await generateMessage(
        event,
        apiKey ?? '',
      )

      logNotification(event.game.gameId, eventKey)

      // 렌더러로 알림 전송
      const notification: KboNotification = {
        message,
        scoringTeam: event.scoringTeam,
        isOurTeam: event.isOurTeam,
        score: `${event.game.awayTeam} ${event.game.awayScore}:${event.game.homeScore} ${event.game.homeTeam}`,
        type: event.type,
      }

      if (!win.isDestroyed()) win.webContents.send('kbo:notification', notification)

      console.log(`[KBO] 알림 전송: ${message}`)
    }
  } catch (err) {
    console.error('[KBO 스케줄러] 사이클 오류:', err instanceof Error ? err.message : err)
  }
}
