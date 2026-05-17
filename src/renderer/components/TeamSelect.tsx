// 응원팀 선택 화면 — 앱 첫 실행 시 또는 설정에서 변경 시 표시
import { useState } from 'react'

const KBO_TEAMS = [
  'LG', '두산', 'KT', 'SSG', '롯데',
  '삼성', '한화', 'KIA', 'NC', '키움',
] as const

// 팀별 대표 색상 (버튼 hover accent)
const TEAM_COLORS: Record<string, string> = {
  LG: '#C30452',
  두산: '#131230',
  KT: '#000000',
  SSG: '#CE0E2D',
  롯데: '#041E42',
  삼성: '#1A4B9B',
  한화: '#FF6600',
  KIA: '#EA0029',
  NC: '#071D3C',
  키움: '#820024',
}

interface Props {
  onSelect: (team: string) => void
  onClose?: () => void   // 설정에서 열었을 때 닫기 버튼용
  isInitial?: boolean    // 최초 실행 여부
}

export function TeamSelect({ onSelect, onClose, isInitial = false }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-5) var(--space-4)',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}
    >
      {/* 헤더 */}
      <div>
        <div
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--panel-fg)',
            marginBottom: 'var(--space-1)',
          }}
        >
          ⚾ 응원팀을 선택해주세요
        </div>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--panel-fg-muted)' }}>
          {isInitial
            ? '선택한 팀의 득점 소식을 실시간으로 알려드려요!'
            : '언제든지 변경할 수 있어요.'}
        </div>
      </div>

      {/* 팀 그리드 (2열) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-2)',
        }}
      >
        {KBO_TEAMS.map((team) => {
          const isHov = hovered === team
          const color = TEAM_COLORS[team] ?? '#3a82f7'
          return (
            <button
              key={team}
              onClick={() => onSelect(team)}
              onMouseEnter={() => setHovered(team)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: 'var(--space-3)',
                background: isHov ? color : 'var(--bubble-assistant-bg)',
                color: isHov ? '#ffffff' : 'var(--panel-fg)',
                border: `1px solid ${isHov ? color : 'var(--panel-border)'}`,
                borderRadius: 'var(--panel-radius-sm)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)',
                fontFamily: 'var(--font-sans)',
                transition: 'var(--transition-fast)',
                textAlign: 'center',
              }}
            >
              {team}
            </button>
          )
        })}
      </div>

      {/* 나중에 선택 (초기 실행 시만) */}
      {isInitial && (
        <button
          onClick={() => onClose?.()}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--panel-fg-muted)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            textDecoration: 'underline',
            alignSelf: 'center',
            padding: 'var(--space-1)',
          }}
        >
          나중에 선택하기
        </button>
      )}
    </div>
  )
}
