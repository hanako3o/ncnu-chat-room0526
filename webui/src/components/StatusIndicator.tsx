import type { ConnectionStatus } from '../types'

const LABELS: Record<ConnectionStatus, string> = {
  connecting:   'Connecting…',
  connected:    'Connected',
  disconnected: 'Disconnected',
  reconnecting: 'Reconnecting…',
}

interface Props {
  status: ConnectionStatus
}

export function StatusIndicator({ status }: Props) {
  return (
    <div
      className={`status-indicator status-${status}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="status-dot" aria-hidden="true" />
      <span className="status-label">{LABELS[status]}</span>
    </div>
  )
}
