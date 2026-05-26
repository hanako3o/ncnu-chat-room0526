import { useEffect, useState } from 'react'
import { JoinScreen } from './components/JoinScreen'
import { ChatScreen } from './components/ChatScreen'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  const [screen, setScreen] = useState<'join' | 'chat'>('join')
  const [callsign, setCallsign] = useState('')
  const [joinError, setJoinError] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const { status, messages, connect, reconnect, disconnect, sendMessage } = useWebSocket()

  // Transition to chat on successful connect, or surface error on failure.
  useEffect(() => {
    if (!isJoining) return
    if (status === 'connected') {
      setIsJoining(false)
      setScreen('chat')
    } else if (status === 'disconnected') {
      setIsJoining(false)
      setJoinError('Connection failed. Check your callsign or the server endpoint.')
    }
  }, [status, isJoining])

  const handleJoin = (name: string) => {
    setJoinError('')
    setIsJoining(true)
    setCallsign(name)
    connect(name)
  }

  const handleLeave = () => {
    disconnect()
    setScreen('join')
    setCallsign('')
  }

  if (screen === 'chat') {
    return (
      <ChatScreen
        callsign={callsign}
        messages={messages}
        status={status}
        onSend={sendMessage}
        onLeave={handleLeave}
        onReconnect={reconnect}
      />
    )
  }

  return <JoinScreen onJoin={handleJoin} isConnecting={isJoining} error={joinError} />
}
