import type { Message } from '../App'
import { MessageList } from './MessageList'
import { InputBar } from './InputBar'
import { Controls } from './Controls'
import { ApiKeySetup } from './ApiKeySetup'
import { TeamSelect } from './TeamSelect'
import { ScoreBoard } from './ScoreBoard'

interface Props {
  messages: Message[]
  isLoading: boolean
  hasApiKey: boolean
  showApiKeySetup: boolean
  showTeamSelect: boolean
  favoriteTeam: string
  games: KboGameInfo[]
  onClose: () => void
  onOpenSettings: () => void
  onCloseSettings: () => void
  onOpenTeamSelect: () => void
  onCloseTeamSelect: () => void
  onTeamSelect: (team: string) => void
  onSend: (text: string) => void
  onApiKeySaved: () => void
}

export function ChatPanel({
  messages,
  isLoading,
  hasApiKey,
  showApiKeySetup,
  showTeamSelect,
  favoriteTeam,
  games,
  onClose,
  onOpenSettings,
  onCloseSettings,
  onOpenTeamSelect,
  onCloseTeamSelect,
  onTeamSelect,
  onSend,
  onApiKeySaved,
}: Props) {
  // 현재 보여줄 뷰 결정
  const view: 'team-select' | 'api-key' | 'chat' = showTeamSelect
    ? 'team-select'
    : showApiKeySetup
      ? 'api-key'
      : 'chat'

  return (
    <div className="chat-panel">
      {/* ── 헤더 ─────────────────────────────────────────── */}
      <div
        style={{
          height: 44,
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-3)',
          borderBottom: '1px solid var(--panel-divider)',
          gap: 'var(--space-2)',
          WebkitAppRegion: 'drag',
          flexShrink: 0,
        } as React.CSSProperties}
      >
        {/* 야구공 미니 아이콘 */}
        <svg viewBox="0 0 100 100" width={24} height={24} style={{ flexShrink: 0 }} aria-hidden>
          <circle cx="50" cy="50" r="42" fill="var(--baseball-ball-bg, #f5f5f3)"/>
          <path d="M 33 14 Q 22 50 33 86" fill="none" stroke="var(--baseball-spine, #9ca3af)" strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M 67 14 Q 78 50 67 86" fill="none" stroke="var(--baseball-spine, #9ca3af)" strokeWidth="2.5" strokeLinecap="round"/>
          <g stroke="var(--baseball-stitch, #d96060)" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M 28 24 L 31 19 L 34 24"/><path d="M 24 44 L 27 39 L 30 44"/>
            <path d="M 24 55 L 27 50 L 30 55"/><path d="M 27 75 L 30 70 L 33 75"/>
          </g>
          <g stroke="var(--baseball-stitch, #d96060)" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d="M 66 24 L 69 19 L 72 24"/><path d="M 70 44 L 73 39 L 76 44"/>
            <path d="M 70 55 L 73 50 L 76 55"/><path d="M 67 75 L 70 70 L 73 75"/>
          </g>
          <circle cx="40" cy="47" r="2.8" fill="#3d3d3d"/>
          <circle cx="60" cy="47" r="2.8" fill="#3d3d3d"/>
          <path d="M 40 60 Q 50 68 60 60" fill="none" stroke="#4a4a4a" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--panel-fg)',
          }}
        >
          Baseball Assistant
          {favoriteTeam && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--panel-fg-muted)', marginLeft: 6 }}>
              응원팀: {favoriteTeam}
            </span>
          )}
        </span>

        {/* 버튼 영역 — no-drag */}
        <div style={{ display: 'flex', gap: 2, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <IconButton onClick={onOpenTeamSelect} title="응원팀 변경">⚾</IconButton>
          <IconButton onClick={onOpenSettings} title="API 키 설정">⚙</IconButton>
          <IconButton onClick={onClose} title="닫기">✕</IconButton>
        </div>
      </div>

      {/* ── 바디 ─────────────────────────────────────────── */}
      {view === 'team-select' && (
        <TeamSelect
          onSelect={onTeamSelect}
          onClose={onCloseTeamSelect}
          isInitial={!favoriteTeam}
        />
      )}

      {view === 'api-key' && (
        <>
          <SubHeader onBack={hasApiKey ? onCloseSettings : undefined} title="API Key 설정" />
          <ApiKeySetup
            onSaved={onApiKeySaved}
            onCancel={hasApiKey ? onCloseSettings : undefined}
            isInitial={!hasApiKey}
          />
        </>
      )}

      {view === 'chat' && (
        <>
          {/* 오늘의 KBO 경기 스코어보드 (있을 때만) */}
          {games.length > 0 && <ScoreBoard games={games} favoriteTeam={favoriteTeam} />}
          <MessageList messages={messages} />
          <Controls />
          <InputBar onSend={onSend} isLoading={isLoading} />
        </>
      )}
    </div>
  )
}

// ── 서브 헤더 (뒤로가기 + 타이틀) ────────────────────────────────────────
function SubHeader({ onBack, title }: { onBack?: () => void; title: string }) {
  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--space-4)',
        borderBottom: '1px solid var(--panel-divider)',
        gap: 'var(--space-2)',
        flexShrink: 0,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--iconbtn-fg)', fontSize: 16, padding: 4, marginLeft: -4,
          }}
        >
          ←
        </button>
      )}
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--panel-fg)' }}>
        {title}
      </span>
    </div>
  )
}

// ── 아이콘 버튼 ───────────────────────────────────────────────────────────
function IconButton({
  onClick, title, children,
}: {
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36,
        background: 'none', border: 'none', borderRadius: 8,
        cursor: 'pointer', color: 'var(--iconbtn-fg)', fontSize: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        WebkitAppRegion: 'no-drag',
        transition: 'background var(--duration-fast) var(--ease-default), color var(--duration-fast) var(--ease-default)',
      } as React.CSSProperties}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--iconbtn-bg-hover)'
        e.currentTarget.style.color = 'var(--iconbtn-fg-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'none'
        e.currentTarget.style.color = 'var(--iconbtn-fg)'
      }}
    >
      {children}
    </button>
  )
}
