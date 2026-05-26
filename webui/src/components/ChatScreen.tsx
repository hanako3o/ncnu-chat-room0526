import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { StatusIndicator } from './StatusIndicator'
import type { ConnectionStatus, ServerMessage } from '../types'

interface Props {
  callsign: string
  messages: ServerMessage[]
  status: ConnectionStatus
  onSend: (text: string) => void
  onLeave: () => void
  onReconnect: () => void
}

export function ChatScreen({ callsign, messages, status, onSend, onLeave, onReconnect }: Props) {
  const canSend = status === 'connected'

  return (
    <div className="chat-screen">
      <header className="chat-header">
        <div className="chat-header-info">
          <h1 className="chat-title">Anonymous Chat</h1>
          <span className="chat-callsign">
            You are: <strong>{callsign}</strong>
          </span>
        </div>
        <div className="chat-header-actions">
          <StatusIndicator status={status} />
          <button className="leave-button" onClick={onLeave} aria-label="Leave chat">
            Leave
          </button>
        </div>
      </header>

      <main className="chat-main">
        <MessageList messages={messages} callsign={callsign} />
      </main>

      <footer className="chat-footer">
        {status === 'disconnected' && (
          <div className="chat-disconnected-banner" role="alert">
            <span>Connection lost.</span>
            <button className="reconnect-button" onClick={onReconnect}>
              Reconnect
            </button>
          </div>
        )}
        {status === 'reconnecting' && (
          <p className="chat-reconnecting-notice">Reconnecting…</p>
        )}
        <MessageInput onSend={onSend} disabled={!canSend} />
      </footer>
    </div>
  )
}
