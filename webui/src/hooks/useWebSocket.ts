import { useCallback, useEffect, useRef, useState } from 'react'
import type { ServerMessage, ConnectionStatus } from '../types'
import { WS_ENDPOINT } from '../config'

const MAX_RETRIES = 5
const BASE_DELAY_MS = 2000
const MAX_DELAY_MS = 30000

export interface UseWebSocketReturn {
  status: ConnectionStatus
  messages: ServerMessage[]
  connect: (callsign: string) => void
  reconnect: () => void
  disconnect: () => void
  sendMessage: (text: string) => void
}

export function useWebSocket(): UseWebSocketReturn {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [messages, setMessages] = useState<ServerMessage[]>([])

  const wsRef = useRef<WebSocket | null>(null)
  const callsignRef = useRef('')
  const retryCountRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // True after the first successful onopen — enables automatic retry on close.
  const shouldRetryRef = useRef(false)
  const closedIntentionallyRef = useRef(false)

  const clearRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }

  const openWs = useCallback((callsign: string) => {
    const ws = new WebSocket(`${WS_ENDPOINT}?callsign=${encodeURIComponent(callsign)}`)
    wsRef.current = ws

    ws.onopen = () => {
      shouldRetryRef.current = true
      retryCountRef.current = 0
      setStatus('connected')
    }

    ws.onmessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data as string) as ServerMessage
        setMessages(prev => [...prev, msg])
      } catch {
        // ignore malformed frames
      }
    }

    ws.onclose = () => {
      if (closedIntentionallyRef.current) {
        setStatus('disconnected')
        return
      }
      if (!shouldRetryRef.current) {
        // Connection never opened — initial join failed, no retry
        setStatus('disconnected')
        return
      }
      if (retryCountRef.current >= MAX_RETRIES) {
        setStatus('disconnected')
        return
      }
      setStatus('reconnecting')
      const delay = Math.min(BASE_DELAY_MS * 2 ** retryCountRef.current, MAX_DELAY_MS)
      retryCountRef.current++
      retryTimerRef.current = setTimeout(() => openWs(callsignRef.current), delay)
    }

    ws.onerror = () => {
      // onclose fires after onerror and handles everything
    }
  }, [])

  const connect = useCallback(
    (callsign: string) => {
      closedIntentionallyRef.current = false
      shouldRetryRef.current = false
      retryCountRef.current = 0
      callsignRef.current = callsign
      clearRetryTimer()
      wsRef.current?.close()
      setMessages([])
      setStatus('connecting')
      openWs(callsign)
    },
    [openWs],
  )

  // Manual reconnect after retries exhausted — resets retry counter and tries again.
  const reconnect = useCallback(() => {
    closedIntentionallyRef.current = false
    shouldRetryRef.current = true
    retryCountRef.current = 0
    clearRetryTimer()
    wsRef.current?.close()
    setStatus('connecting')
    openWs(callsignRef.current)
  }, [openWs])

  const disconnect = useCallback(() => {
    closedIntentionallyRef.current = true
    clearRetryTimer()
    wsRef.current?.close()
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'sendMessage', text }))
    }
  }, [])

  useEffect(() => {
    return () => {
      closedIntentionallyRef.current = true
      clearRetryTimer()
      wsRef.current?.close()
    }
  }, [])

  return { status, messages, connect, reconnect, disconnect, sendMessage }
}
