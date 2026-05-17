import { useEffect, useRef } from 'react'
import type { Message } from '../App'
import { Bubble } from './Bubble'

interface Props {
  messages: Message[]
}

export function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
      }}
    >
      {messages.length === 0 && (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--panel-fg-muted)',
            fontSize: 'var(--font-size-sm)',
            textAlign: 'center',
            lineHeight: 'var(--line-height-relaxed)',
          }}
        >
          안녕하세요! ⚾<br />무엇이든 물어보세요.
        </div>
      )}
      {messages.map((msg) => (
        <Bubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
