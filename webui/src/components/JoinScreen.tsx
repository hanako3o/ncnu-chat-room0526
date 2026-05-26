import { useState } from 'react'

const CALLSIGN_RE = /^[a-zA-Z0-9_]{1,20}$/

interface Props {
  onJoin: (callsign: string) => void
  isConnecting: boolean
  error: string
}

export function JoinScreen({ onJoin, isConnecting, error }: Props) {
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setValidationError('Callsign is required.')
      return
    }
    if (!CALLSIGN_RE.test(value)) {
      setValidationError('1–20 characters: letters, digits, and underscores only.')
      return
    }
    setValidationError('')
    onJoin(value)
  }

  const displayError = validationError || error

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1 className="join-title">Anonymous Chat</h1>
        <p className="join-subtitle">Enter a callsign to join the room</p>

        <form onSubmit={handleSubmit} className="join-form" noValidate>
          <label htmlFor="callsign" className="join-label">
            Callsign
          </label>
          <input
            id="callsign"
            type="text"
            value={value}
            onChange={e => {
              setValue(e.target.value)
              setValidationError('')
            }}
            placeholder="e.g. CoolDog42"
            maxLength={20}
            disabled={isConnecting}
            className="join-input"
            aria-describedby={displayError ? 'join-error' : undefined}
            aria-invalid={displayError ? 'true' : 'false'}
            autoComplete="off"
            autoFocus
          />
          {displayError && (
            <p id="join-error" className="join-error" role="alert">
              {displayError}
            </p>
          )}
          <button type="submit" disabled={isConnecting} className="join-button">
            {isConnecting ? 'Connecting…' : 'Join Chat'}
          </button>
        </form>
      </div>
    </div>
  )
}
