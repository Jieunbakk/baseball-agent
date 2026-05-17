// 오늘의 KBO 경기 스코어 미니 보드
// 채팅 패널 상단에 접어둘 수 있는 형태로 표시
import { useState } from 'react'

interface Props {
  games: KboGameInfo[]
  favoriteTeam: string
}

const STATUS_LABEL: Record<string, string> = {
  pre: '경기 전',
  live: '진행 중',
  final: '종료',
}

export function ScoreBoard({ games, favoriteTeam }: Props) {
  const [expanded, setExpanded] = useState(false)

  // 오늘 진행 중이거나 종료된 경기만 우선 표시
  const liveOrFinal = games.filter((g) => g.status !== 'pre')
  const displayGames = expanded ? games : liveOrFinal.slice(0, 3)

  if (games.length === 0) return null

  return (
    <div
      style={{
        borderBottom: '1px solid var(--panel-divider)',
        flexShrink: 0,
      }}
    >
      {/* 스코어보드 헤더 (클릭으로 펼치기/접기) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-2) var(--space-4)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--panel-fg-muted)',
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span>⚾ 오늘의 KBO ({games.length}경기)</span>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* 경기 목록 */}
      {expanded || liveOrFinal.length > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '0 var(--space-3) var(--space-2)',
            maxHeight: expanded ? 200 : 'auto',
            overflowY: expanded ? 'auto' : 'visible',
          }}
        >
          {displayGames.map((game) => {
            const isFav = game.homeTeam === favoriteTeam || game.awayTeam === favoriteTeam
            return (
              <div
                key={game.gameId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: '3px var(--space-2)',
                  borderRadius: 6,
                  background: isFav ? 'rgba(58,130,247,0.08)' : 'transparent',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {/* 어웨이팀 */}
                <TeamName name={game.awayTeam} isFav={game.awayTeam === favoriteTeam} />
                {/* 스코어 */}
                <span
                  style={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: game.status === 'pre' ? 'var(--panel-fg-muted)' : 'var(--panel-fg)',
                    minWidth: 36,
                    textAlign: 'center',
                    letterSpacing: '0.05em',
                  }}
                >
                  {game.status === 'pre'
                    ? 'vs'
                    : `${game.awayScore}:${game.homeScore}`}
                </span>
                {/* 홈팀 */}
                <TeamName name={game.homeTeam} isFav={game.homeTeam === favoriteTeam} />
                {/* 이닝 / 상태 */}
                <span
                  style={{
                    marginLeft: 'auto',
                    color: game.status === 'live' ? '#059669' : 'var(--panel-fg-muted)',
                    fontSize: 10,
                  }}
                >
                  {game.status === 'live' ? game.inning : STATUS_LABEL[game.status]}
                </span>
              </div>
            )
          })}
          {!expanded && games.length > liveOrFinal.length && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--panel-fg-muted)', fontSize: 10,
                padding: '2px 0', textAlign: 'left',
              }}
            >
              + 경기 전 {games.length - liveOrFinal.length}경기 더 보기
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}

function TeamName({ name, isFav }: { name: string; isFav: boolean }) {
  return (
    <span
      style={{
        minWidth: 28,
        fontWeight: isFav ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
        color: isFav ? 'var(--bubble-user-bg)' : 'var(--panel-fg)',
      }}
    >
      {name}
    </span>
  )
}
