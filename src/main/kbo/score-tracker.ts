// 점수 변화 감지 및 중복 알림 방지
// electron-store에 이전 상태를 저장해 현재와 비교
import store from '../store'
import type { GameInfo } from './crawler'

export interface ScoreEvent {
  game: GameInfo
  type: 'score' | 'final'      // 득점 이벤트 or 경기 종료
  scoringTeam: string           // 득점한 팀 (final이면 승리팀)
  isOurTeam: boolean            // 응원팀 여부
}

const DEDUP_WINDOW_MS = 5 * 60 * 1000 // 5분 내 같은 이벤트 중복 방지

// 이전 점수와 비교해 변화 이벤트 목록 반환
export function detectChanges(newGames: GameInfo[], favoriteTeam: string): ScoreEvent[] {
  const events: ScoreEvent[] = []
  const states = store.get('gameStates') as Record<string, any>

  for (const game of newGames) {
    const prev = states[game.gameId]

    if (!prev) {
      // 첫 감지 — 저장만 하고 알림 없음
      saveGameState(game)
      continue
    }

    // 경기 종료 전환 감지
    if (prev.status !== 'final' && game.status === 'final') {
      const winner =
        game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam
      const isOurTeam = winner === favoriteTeam
      events.push({ game, type: 'final', scoringTeam: winner, isOurTeam })
    }
    // 홈팀 득점 감지
    else if (game.homeScore > prev.homeScore) {
      events.push({
        game,
        type: 'score',
        scoringTeam: game.homeTeam,
        isOurTeam: game.homeTeam === favoriteTeam,
      })
    }
    // 어웨이팀 득점 감지
    else if (game.awayScore > prev.awayScore) {
      events.push({
        game,
        type: 'score',
        scoringTeam: game.awayTeam,
        isOurTeam: game.awayTeam === favoriteTeam,
      })
    }

    saveGameState(game)
  }

  return events
}

// 게임 상태를 store에 저장
function saveGameState(game: GameInfo): void {
  const states = store.get('gameStates') as Record<string, any>
  states[game.gameId] = {
    homeScore: game.homeScore,
    awayScore: game.awayScore,
    inning: game.inning,
    status: game.status,
    updatedAt: Date.now(),
  }
  store.set('gameStates', states)
}

// 중복 알림 여부 확인 (5분 내 동일 이벤트 재발 방지)
export function isDuplicate(gameId: string, eventKey: string): boolean {
  const log = store.get('notificationLog') as any[]
  const now = Date.now()
  return log.some(
    (entry) =>
      entry.gameId === gameId &&
      entry.eventKey === eventKey &&
      now - entry.sentAt < DEDUP_WINDOW_MS,
  )
}

// 알림 이력 기록
export function logNotification(gameId: string, eventKey: string): void {
  const log = store.get('notificationLog') as any[]
  log.push({ gameId, eventKey, sentAt: Date.now() })
  // 오래된 로그 정리 (24시간 이상 지난 항목 제거)
  const cutoff = Date.now() - 24 * 60 * 60 * 1000
  store.set(
    'notificationLog',
    log.filter((e) => e.sentAt > cutoff),
  )
}
