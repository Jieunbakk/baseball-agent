import { useState, useRef, useCallback } from 'react'

interface Props {
  onSend: (text: string) => void
  isLoading: boolean
}

export function InputBar({ onSend, isLoading }: Props) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [value, isLoading, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--panel-divider)',
        alignItems: 'flex-end',
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder={isLoading ? '응답 중…' : '메시지를 입력하세요…'}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          borderRadius: 'var(--input-radius)',
          padding: 'var(--space-2) var(--space-3)',
          color: 'var(--input-fg)',
          fontSize: 'var(--font-size-md)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--line-height-normal)',
          minHeight: 36,
          maxHeight: 120,
          outline: 'none',
          transition: 'border-color var(--duration-fast) var(--ease-default), background var(--duration-fast) var(--ease-default)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--input-border-focus)'
          e.target.style.background = 'var(--input-bg-focus)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--input-border)'
          e.target.style.background = 'var(--input-bg)'
        }}
      />
      <button
        onClick={handleSend}
        disabled={isLoading || !value.trim()}
        title="전송 (Enter)"
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          background: isLoading || !value.trim() ? 'var(--send-btn-bg-disabled)' : 'var(--send-btn-bg)',
          color: 'var(--send-btn-fg)',
          border: 'none',
          borderRadius: 'var(--input-radius)',
          cursor: isLoading || !value.trim() ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background var(--duration-fast) var(--ease-default)',
          fontSize: 16,
        }}
        onMouseEnter={(e) => {
          if (!isLoading && value.trim()) {
            (e.target as HTMLButtonElement).style.background = 'var(--send-btn-bg-hover)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && value.trim()) {
            (e.target as HTMLButtonElement).style.background = 'var(--send-btn-bg)'
          }
        }}
      >
        ↑
      </button>
    </div>
  )
}
