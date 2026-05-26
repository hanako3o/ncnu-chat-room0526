import { useEffect, useRef } from 'react'
import { MessageItem } from './MessageItem'
import type { ServerMessage } from '../types'

interface Props {
  messages: ServerMessage[]
  callsign: string
}

export function MessageList({ messages, callsign }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="message-list" role="log" aria-label="Chat messages" aria-live="polite">
      {messages.map((msg, idx) => (
        <MessageItem
          key={`${msg.timestamp}-${idx}`}
          message={msg}
          isOwn={msg.type === 'message' && msg.callsign === callsign}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
