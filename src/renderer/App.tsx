import { useState, useEffect, useCallback, useRef } from 'react'
import { BallIcon } from './components/BallIcon'
import { ChatPanel } from './components/ChatPanel'
import { SpeechBubble } from './components/SpeechBubble'
import { TeamSelect } from './components/TeamSelect'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  isError?: boolean
}

interface BubbleState {
  message: string
  isOurTeam: boolean
}

export default function App() {
  // ── 채팅 패널 상태 ────────────────────────────────────────
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null)
  const [showApiKeySetup, setShowApiKeySetup] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const streamingIdRef = useRef<string | null>(null)

  // ── KBO 상태 ──────────────────────────────────────────────
  const [favoriteTeam, setFavoriteTeam] = useState<string>('')
  const [showTeamSelect, setShowTeamSelect] = useState(false)
  const [bubble, setBubble] = useState<BubbleState | null>(null)
  const [games, setGames] = useState<KboGameInfo[]>([])

  // ── 초기화 ────────────────────────────────────────────────
  useEffect(() => {
    // API 키 확인
    window.api.hasApiKey().then((has) => {
      setHasApiKey(has)
      if (!has) setShowApiKeySetup(true)
    })

    // 응원팀 확인 — 없으면 팀 선택 화면 표시
    window.api.getFavoriteTeam().then((team) => {
      if (team) {
        setFavoriteTeam(team)
      } else {
        // 팀 미선택 → 패널 자동 오픈 후 팀 선택 화면 표시
        setShowTeamSelect(true)
        setIsPanelOpen(true)
        window.api.togglePanel(true)
      }
    })
  }, [])

  // ── 스트리밍 이벤트 구독 ──────────────────────────────────
  useEffect(() => {
    const removeChunk = window.api.onStreamChunk((text) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current ? { ...m, content: m.content + text } : m,
        ),
      )
    })
    const removeEnd = window.api.onStreamEnd(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current ? { ...m, isStreaming: false } : m,
        ),
      )
      streamingIdRef.current = null
      setIsLoading(false)
    })
    const removeError = window.api.onStreamError((msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingIdRef.current
            ? { ...m, content: `오류: ${msg}`, isStreaming: false, isError: true }
            : m,
        ),
      )
      streamingIdRef.current = null
      setIsLoading(false)
    })
    return () => { removeChunk(); removeEnd(); removeError() }
  }, [])

  // ── KBO 이벤트 구독 ──────────────────────────────────────
  useEffect(() => {
    // 득점/경기종료 알림 수신
    const removeNotif = window.api.onKboNotification((n) => {
      setBubble({ message: n.message, isOurTeam: n.isOurTeam })
    })
    // 경기 목록 업데이트 수신
    const removeGames = window.api.onGamesUpdated((g) => {
      setGames(g)
    })
    return () => { removeNotif(); removeGames() }
  }, [])

  // ── 패널 토글 ─────────────────────────────────────────────
  const handleTogglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const next = !prev
      window.api.togglePanel(next)
      return next
    })
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    window.api.togglePanel(false)
  }, [])

  // ── 채팅 전송 ─────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string) => {
      if (isLoading || !text.trim()) return
      const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text.trim() }
      const assistantId = `a-${Date.now()}`
      const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true }
      streamingIdRef.current = assistantId
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setIsLoading(true)
      window.api.sendMessage(
        [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
      )
    },
    [isLoading, messages],
  )

  // ── 팀 선택 처리 ──────────────────────────────────────────
  const handleTeamSelect = useCallback(async (team: string) => {
    await window.api.setFavoriteTeam(team)
    setFavoriteTeam(team)
    setShowTeamSelect(false)
  }, [])

  const handleApiKeySaved = useCallback(() => {
    setHasApiKey(true)
    setShowApiKeySetup(false)
  }, [])

  // ── 렌더 ──────────────────────────────────────────────────
  if (!isPanelOpen) {
    // 볼 전용 모드
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: 12,
          position: 'relative',
        }}
      >
        <BallIcon onTogglePanel={handleTogglePanel} isThinking={isLoading} />
        {bubble && (
          <SpeechBubble
            message={bubble.message}
            isOurTeam={bubble.isOurTeam}
            isPanelOpen={false}
            onClose={() => setBubble(null)}
          />
        )}
      </div>
    )
  }

  // 패널 오픈 모드
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <ChatPanel
        messages={messages}
        isLoading={isLoading}
        hasApiKey={hasApiKey ?? false}
        showApiKeySetup={showApiKeySetup}
        showTeamSelect={showTeamSelect}
        favoriteTeam={favoriteTeam}
        games={games}
        onClose={handleClosePanel}
        onOpenSettings={() => setShowApiKeySetup(true)}
        onCloseSettings={() => setShowApiKeySetup(false)}
        onOpenTeamSelect={() => setShowTeamSelect(true)}
        onCloseTeamSelect={() => setShowTeamSelect(false)}
        onTeamSelect={handleTeamSelect}
        onSend={handleSend}
        onApiKeySaved={handleApiKeySaved}
      />
      {/* 패널 열린 상태에서의 알림 배너 */}
      {bubble && (
        <SpeechBubble
          message={bubble.message}
          isOurTeam={bubble.isOurTeam}
          isPanelOpen={true}
          onClose={() => setBubble(null)}
        />
      )}
    </div>
  )
}
