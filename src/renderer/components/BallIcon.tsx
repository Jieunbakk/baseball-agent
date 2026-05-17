import { useRef, useEffect, useCallback } from 'react'

interface Props {
  onTogglePanel: () => void
  isThinking: boolean
}

export function BallIcon({ onTogglePanel, isThinking }: Props) {
  const dragState = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  })
  const isDraggingClass = useRef(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const s = dragState.current
    s.active = true
    s.startX = e.screenX
    s.startY = e.screenY
    s.lastX = e.screenX
    s.lastY = e.screenY
    s.moved = false
  }, [])

  useEffect(() => {
    let frameId: number | null = null
    let pendingDx = 0
    let pendingDy = 0

    const onMove = (e: MouseEvent) => {
      const s = dragState.current
      if (!s.active) return
      const dx = e.screenX - s.lastX
      const dy = e.screenY - s.lastY
      const dist = Math.hypot(e.screenX - s.startX, e.screenY - s.startY)
      if (dist > 5) s.moved = true
      if (s.moved) {
        if (!isDraggingClass.current) {
          isDraggingClass.current = true
          wrapperRef.current?.classList.add('is-dragging')
        }
        pendingDx += dx
        pendingDy += dy
        s.lastX = e.screenX
        s.lastY = e.screenY
        if (!frameId) {
          frameId = requestAnimationFrame(() => {
            if (pendingDx !== 0 || pendingDy !== 0) {
              window.api.dragMove(pendingDx, pendingDy)
              pendingDx = 0
              pendingDy = 0
            }
            frameId = null
          })
        }
      }
    }

    const onUp = () => {
      const s = dragState.current
      if (s.active && !s.moved) onTogglePanel()
      s.active = false
      if (isDraggingClass.current) {
        isDraggingClass.current = false
        wrapperRef.current?.classList.remove('is-dragging')
      }
      pendingDx = 0
      pendingDy = 0
      if (frameId) {
        cancelAnimationFrame(frameId)
        frameId = null
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (frameId) cancelAnimationFrame(frameId)
    }
  }, [onTogglePanel])

  return (
    <div
      ref={wrapperRef}
      className={`ball-wrapper${isThinking ? ' is-thinking' : ''}`}
      onMouseDown={handleMouseDown}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-label="Baseball assistant">
        <defs>
          <radialGradient id="bh" cx="0.32" cy="0.28" r="0.55">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95"/>
            <stop offset="55%"  stopColor="#ffffff" stopOpacity="0.18"/>
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
          </radialGradient>
        </defs>
        {/* 공 본체 */}
        <circle cx="50" cy="50" r="42" fill="var(--baseball-ball-bg, #f5f5f3)"/>
        <circle cx="50" cy="50" r="42" fill="url(#bh)"/>
        {/* 스파인 */}
        <path d="M 33 14 Q 22 50 33 86" fill="none" stroke="var(--baseball-spine, #9ca3af)" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M 67 14 Q 78 50 67 86" fill="none" stroke="var(--baseball-spine, #9ca3af)" strokeWidth="2.2" strokeLinecap="round"/>
        {/* 왼쪽 ㅅ 실밥 */}
        <g stroke="var(--baseball-stitch, #d96060)" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M 28 24 L 31 19 L 34 24"/>
          <path d="M 25 34 L 28 29 L 31 34"/>
          <path d="M 24 44 L 27 39 L 30 44"/>
          <path d="M 24 55 L 27 50 L 30 55"/>
          <path d="M 25 65 L 28 60 L 31 65"/>
          <path d="M 27 75 L 30 70 L 33 75"/>
        </g>
        {/* 오른쪽 ㅅ 실밥 */}
        <g stroke="var(--baseball-stitch, #d96060)" strokeWidth="1.6" strokeLinecap="round" fill="none">
          <path d="M 66 24 L 69 19 L 72 24"/>
          <path d="M 69 34 L 72 29 L 75 34"/>
          <path d="M 70 44 L 73 39 L 76 44"/>
          <path d="M 70 55 L 73 50 L 76 55"/>
          <path d="M 69 65 L 72 60 L 75 65"/>
          <path d="M 67 75 L 70 70 L 73 75"/>
        </g>
        {/* 볼터치(홍조) */}
        <circle cx="34" cy="60" r="5" fill="rgba(255,130,130,0.30)"/>
        <circle cx="66" cy="60" r="5" fill="rgba(255,130,130,0.30)"/>
        {/* 눈 */}
        <circle cx="40" cy="47" r="3.2" fill="#3d3d3d"/>
        <circle cx="60" cy="47" r="3.2" fill="#3d3d3d"/>
        <circle cx="41.2" cy="45.8" r="1.1" fill="white"/>
        <circle cx="61.2" cy="45.8" r="1.1" fill="white"/>
        {/* 웃는 입 */}
        <path d="M 40 60 Q 50 70 60 60" fill="none" stroke="#4a4a4a" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    </div>
  )
}
