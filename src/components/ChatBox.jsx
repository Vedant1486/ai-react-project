import { useState, useRef, useEffect } from 'react'
import styles from './ChatBox.module.css'

const MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
]

const geminiURL = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`

async function callGemini(apiKey, contents) {
  for (const model of MODELS) {
    const res = await fetch(geminiURL(model, apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    })
    if (res.status === 503 || res.status === 429) continue
    if (res.status === 400) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.error?.message || ''
      if (msg.includes('no longer available') || msg.includes('deprecated')) continue
      throw new Error(msg || 'API error 400')
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API error ${res.status}`)
    }
    const data = await res.json()
    return data.candidates[0].content.parts[0].text
  }
  throw new Error('All models are currently overloaded. Please try again in a moment.')
}

function Message({ role, content }) {
  return (
    <div className={`${styles.message} ${styles[role]}`}>
      <span className={styles.role}>{role === 'user' ? 'You' : 'AI'}</span>
      <p className={styles.content}>{content}</p>
    </div>
  )
}

export default function ChatBox() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(e) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) {
      setError('Missing VITE_GEMINI_API_KEY in .env.local')
      return
    }

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]

    setMessages(updatedMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const contents = updatedMessages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }))
      const aiText = await callGemini(apiKey, contents)
      setMessages((prev) => [...prev, { role: 'model', content: aiText }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([])
    setError(null)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gemini Chat</h1>
        {messages.length > 0 && (
          <button onClick={clearChat} className={styles.clearBtn} aria-label="Clear chat">
            Clear
          </button>
        )}
      </header>

      <div className={styles.feed} role="log" aria-live="polite" aria-label="Chat messages">
        {messages.length === 0 && !loading && (
          <p className={styles.empty}>Ask me anything...</p>
        )}
        {messages.map((msg, i) => (
          <Message key={i} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className={`${styles.message} ${styles.model}`}>
            <span className={styles.role}>AI</span>
            <p className={styles.thinking}>Thinking...</p>
          </div>
        )}
        {error && (
          <p className={styles.error} role="alert">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
          aria-label="Chat input"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          disabled={loading || !input.trim()}
          aria-label="Send message"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
