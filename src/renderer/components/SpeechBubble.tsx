// 득점/경기 종료 시 야구공 옆에 뜨는 말풍선 팝업
// 3초 후 자동 페이드아웃
import { useEffect, useState, useRef } from 'react'

interface Props {
  message: string
  isOurTeam: boolean
  isPanelOpen: boolean   // 패널 열린 상태이면 창 리사이즈 없이 배너만 표시
  onClose: () => void
}

const DISPLAY_MS = 3500   // 말풍선 표시 시간
const FADE_MS    = 300    // 페이드아웃 시간

export function SpeechBubble({ message, isOurTeam, isPanelOpen, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const closedRef = useRef(false)

  useEffect(() => {
    // 마운트 직후 창 확장 (볼 전용 모드에서만)
    if (!isPanelOpen) window.api.showBubble()

    // 한 프레임 뒤 visible = true → CSS transition 트리거
    const raf = requestAnimationFrame(() => setVisible(true))

    // DISPLAY_MS 후 페이드아웃 시작
    const hideTimer = setTimeout(() => {
      if (closedRef.current) return
      setVisible(false)
      // FADE_MS 후 창 원복 + 언마운트
      setTimeout(() => {
        if (!isPanelOpen) window.api.hideBubble()
        onClose()
      }, FADE_MS)
    }, DISPLAY_MS)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hideTimer)
      closedRef.current = true
      if (!isPanelOpen) window.api.hideBubble()
    }
  }, [isPanelOpen, onClose])

  // 응원팀 득점 여부에 따른 색상
  const bg = isOurTeam ? 'var(--bubble-user-bg)' : 'var(--panel-bg)'
  const fg = isOurTeam ? 'var(--bubble-user-fg)' : 'var(--panel-fg)'
  const arrowColor = isOurTeam ? '#3a82f7' : 'rgba(255,255,255,0.94)'

  if (isPanelOpen) {
    // 패널 오픈 상태 → 패널 상단 배너로 표시
    return (
      <div
        style={{
          position: 'absolute',
          top: 44, // 헤더 아래
          left: 0,
          right: 0,
          background: bg,
          color: fg,
          padding: 'var(--space-2) var(--space-4)',
          fontSize: 'var(--font-size-sm)',
          textAlign: 'center',
          borderBottom: '1px solid var(--panel-divider)',
          opacity: visible ? 1 : 0,
          transition: `opacity ${FADE_MS}ms ease`,
          zIndex: 50,
        }}
      >
        {message}
      </div>
    )
  }

  // 볼 전용 모드 → 볼 오른쪽 말풍선
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,           // 볼(88px) + 여백(8px)
        top: '50%',
        transform: `translateY(-50%) scale(${visible ? 1 : 0.92})`,
        transformOrigin: 'left center',
        background: bg,
        color: fg,
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 12,
        fontSize: 'var(--font-size-sm)',
        fontFamily: 'var(--font-sans)',
        whiteSpace: 'nowrap',
        maxWidth: 210,
        boxShadow: 'var(--shadow-panel)',
        border: '1px solid var(--panel-border)',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms var(--ease-out)`,
        pointerEvents: 'none',
        backdropFilter: 'var(--panel-backdrop)',
        WebkitBackdropFilter: 'var(--panel-backdrop)',
      }}
    >
      {message}
      {/* 왼쪽 말풍선 꼬리 (삼각형) */}
      <span
        style={{
          position: 'absolute',
          left: -7,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: `7px solid ${arrowColor}`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
