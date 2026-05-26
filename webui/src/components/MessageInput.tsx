import { useRef, useState } from 'react'

interface Props {
  onSend: (text: string) => void
  disabled: boolean
}

export function MessageInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }

  const submit = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="message-input-form"
      onSubmit={e => {
        e.preventDefault()
        submit()
      }}
    >
      <textarea
        ref={textareaRef}
        className="message-input"
        value={text}
        onChange={e => {
          setText(e.target.value)
          autoResize()
        }}
        onKeyDown={handleKeyDown}
        placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
        maxLength={1000}
        disabled={disabled}
        rows={1}
        aria-label="Message input"
      />
      <button
        type="submit"
        className="send-button"
        disabled={disabled || !text.trim()}
        aria-label="Send message"
      >
        Send
      </button>
    </form>
  )
}
