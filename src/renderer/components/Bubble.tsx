import type { Message } from '../App'

interface Props {
  message: Message
}

export function Bubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--bubble-max-width)',
          padding: 'var(--space-3)',
          borderRadius: isUser
            ? `var(--bubble-radius) var(--bubble-radius) var(--bubble-radius-tail) var(--bubble-radius)`
            : `var(--bubble-radius) var(--bubble-radius) var(--bubble-radius) var(--bubble-radius-tail)`,
          background: message.isError
            ? 'var(--error-bg)'
            : isUser
              ? 'var(--bubble-user-bg)'
              : 'var(--bubble-assistant-bg)',
          color: message.isError
            ? 'var(--error-fg)'
            : isUser
              ? 'var(--bubble-user-fg)'
              : 'var(--bubble-assistant-fg)',
          border: message.isError ? '1px solid var(--error-fg)' : 'none',
          fontSize: 'var(--font-size-md)',
          lineHeight: 'var(--line-height-relaxed)',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
        {message.isStreaming && (
          <span
            style={{
              display: 'inline-block',
              width: 2,
              height: '1em',
              background: 'currentColor',
              marginLeft: 2,
              verticalAlign: 'text-bottom',
              animation: 'cursor-blink 1.2s var(--ease-default) infinite',
            }}
          />
        )}
        {message.isStreaming && !message.content && (
          <span style={{ opacity: 0.5 }}>생각 중…</span>
        )}
      </div>
    </div>
  )
}
