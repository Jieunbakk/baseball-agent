import { useState, useCallback } from 'react'

interface Props {
  onSaved: () => void
  onCancel?: () => void
  isInitial?: boolean
}

export function ApiKeySetup({ onSaved, onCancel, isInitial = false }: Props) {
  const [key, setKey] = useState('')
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = useCallback(async () => {
    const trimmed = key.trim()
    if (!trimmed) {
      setError('API 키를 입력해 주세요.')
      return
    }
    if (!trimmed.startsWith('sk-ant-')) {
      setError('올바른 Anthropic API 키 형식이 아닙니다.')
      return
    }
    setSaving(true)
    setError('')
    const ok = await window.api.setApiKey(trimmed)
    setSaving(false)
    if (ok) {
      onSaved()
    } else {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
    }
  }, [key, onSaved])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSave()
    },
    [handleSave],
  )

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-6) var(--space-4)',
        gap: 'var(--space-4)',
        overflowY: 'auto',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--panel-fg)',
            marginBottom: 'var(--space-1)',
          }}
        >
          Anthropic API Key
        </div>
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--panel-fg-muted)',
            marginBottom: 'var(--space-3)',
          }}
        >
          {isInitial
            ? '첫 사용을 위해 API 키를 입력해 주세요.'
            : '새 API 키로 교체합니다.'}
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={visible ? 'text' : 'password'}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="sk-ant-api03-…"
            autoFocus
            style={{
              width: '100%',
              background: 'var(--input-bg)',
              border: `1px solid ${error ? 'var(--error-fg)' : 'var(--input-border)'}`,
              borderRadius: 'var(--input-radius)',
              padding: 'var(--space-2) 40px var(--space-2) var(--space-3)',
              color: 'var(--input-fg)',
              fontSize: 'var(--font-size-sm)',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = error ? 'var(--error-fg)' : 'var(--input-border-focus)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? 'var(--error-fg)' : 'var(--input-border)'
            }}
          />
          <button
            onClick={() => setVisible((v) => !v)}
            title={visible ? '숨기기' : '보기'}
            style={{
              position: 'absolute',
              right: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--iconbtn-fg)',
              fontSize: 14,
              padding: 4,
            }}
          >
            {visible ? '🙈' : '👁'}
          </button>
        </div>
        {error && (
          <div
            style={{
              marginTop: 'var(--space-2)',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--error-fg)',
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 'var(--space-2)',
          padding: 'var(--space-3)',
          background: 'var(--bubble-assistant-bg)',
          borderRadius: 'var(--panel-radius-sm)',
        }}
      >
        <span style={{ fontSize: 14 }}>ℹ️</span>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--panel-fg-muted)', lineHeight: 'var(--line-height-relaxed)' }}>
          키는 OS keychain에 안전하게 저장됩니다. 외부로 전송되지 않습니다.
        </span>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'auto' }}>
        {!isInitial && onCancel && (
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--bubble-assistant-bg)',
              border: '1px solid var(--panel-border)',
              borderRadius: 'var(--input-radius)',
              color: 'var(--panel-fg)',
              fontSize: 'var(--font-size-sm)',
              cursor: 'pointer',
            }}
          >
            취소
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 1,
            padding: 'var(--space-2) var(--space-3)',
            background: saving ? 'var(--send-btn-bg-disabled)' : 'var(--send-btn-bg)',
            border: 'none',
            borderRadius: 'var(--input-radius)',
            color: 'var(--send-btn-fg)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  )
}
