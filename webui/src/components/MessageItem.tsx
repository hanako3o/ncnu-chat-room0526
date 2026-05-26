import type { ServerMessage } from '../types'

interface Props {
  message: ServerMessage
  isOwn: boolean
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function MessageItem({ message, isOwn }: Props) {
  const time = formatTime(message.timestamp)

  if (message.type === 'system') {
    const label =
      message.event === 'user_joined'
        ? `→ ${message.callsign} joined`
        : `← ${message.callsign} left`
    return (
      <div className="message-system" role="status">
        <span>{label}</span>
        {time && <time dateTime={message.timestamp}>{time}</time>}
      </div>
    )
  }

  return (
    <div className={`message-wrapper ${isOwn ? 'message-own' : 'message-other'}`}>
      {!isOwn && <span className="message-callsign">{message.callsign}</span>}
      <div className={`message-bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
        <p className="message-text">{message.text}</p>
        {time && (
          <time className="message-time" dateTime={message.timestamp}>
            {time}
          </time>
        )}
      </div>
    </div>
  )
}
