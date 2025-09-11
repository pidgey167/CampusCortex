'use client'

import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import axios from 'axios'

// Lazy import to avoid SSR issues when window isn't available
let CryptoJS
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  CryptoJS = require('crypto-js')
}

const CRYPTO_SECRET = process.env.NEXT_PUBLIC_CRYPTO_SECRET || 'harbor-default-secret'

const AUTH_HEADER = () => {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

function encrypt(text) {
  try {
    return CryptoJS ? CryptoJS.AES.encrypt(text, CRYPTO_SECRET).toString() : text
  } catch {
    return text
  }
}

function decrypt(cipher) {
  try {
    if (!CryptoJS) return cipher
    const bytes = CryptoJS.AES.decrypt(cipher, CRYPTO_SECRET)
    return bytes.toString(CryptoJS.enc.Utf8) || cipher
  } catch {
    return cipher
  }
}

// Minimal IndexedDB helper
const idb = {
  db: null,
  async init() {
    if (typeof window === 'undefined') return
    if (this.db) return
    await new Promise((resolve, reject) => {
      const request = indexedDB.open('harbor-cache', 1)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('responses')) db.createObjectStore('responses')
        if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { autoIncrement: true })
      }
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  },
  async get(store, key) {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readonly')
      const req = tx.objectStore(store).get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },
  async set(store, key, value) {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite')
      const req = tx.objectStore(store).put(value, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  },
  async add(store, value) {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite')
      const req = tx.objectStore(store).add(value)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  },
  async popAll(store) {
    await this.init()
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(store, 'readwrite')
      const storeRef = tx.objectStore(store)
      const items = []
      const cursorReq = storeRef.openCursor()
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result
        if (cursor) {
          items.push({ key: cursor.key, value: cursor.value })
          cursor.delete()
          cursor.continue()
        } else {
          resolve(items)
        }
      }
      cursorReq.onerror = () => reject(cursorReq.error)
    })
  }
}

export default function Harbor() {
  const [socket, setSocket] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [mood, setMood] = useState(null)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine)
    handler()
    window.addEventListener('online', handler)
    window.addEventListener('offline', handler)
    return () => {
      window.removeEventListener('online', handler)
      window.removeEventListener('offline', handler)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const s = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      auth: {
        token: typeof window !== 'undefined' ? localStorage.getItem('token') : undefined
      }
    })
    setSocket(s)

    s.on('connect', () => {
      // no-op for now
    })

    s.on('ai-response', (payload) => {
      const content = decrypt(payload.encryptedContent || '') || payload.content
      setMessages(prev => [...prev, { role: 'assistant', content }])
    })

    s.on('harbor-alert', () => {
      setMessages(prev => [...prev, { role: 'system', content: 'A support authority has been alerted for your safety.' }])
    })

    return () => {
      s.disconnect()
    }
  }, [])

  useEffect(() => {
    const fetchMood = async () => {
      try {
        // Try latest, fallback to today
        let res
        try {
          res = await axios.get('/api/mood/latest', { headers: AUTH_HEADER() })
        } catch {
          res = await axios.get('/api/mood/today', { headers: AUTH_HEADER() })
        }
        const latest = res?.data?.data?.moodLog || res?.data?.data
        setMood(latest?.mood || latest?.status || 'Neutral')
        const greet = `Your ${latest?.mood || latest?.status || 'Neutral'} mood needs calm—let’s breathe!`
        setMessages([{ role: 'assistant', content: greet }])
      } catch {
        setMessages([{ role: 'assistant', content: "Welcome to Harbor. Let's begin with a deep breath." }])
      }
    }
    fetchMood()
  }, [])

  const startVoice = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) return
      const rec = new SpeechRecognition()
      rec.lang = 'en-IN'
      rec.interimResults = false
      rec.onresult = (e) => {
        const txt = e.results[0][0].transcript
        setInput(txt)
      }
      rec.onend = () => setIsRecording(false)
      recognitionRef.current = rec
      setIsRecording(true)
      rec.start()
    } catch {
      setIsRecording(false)
    }
  }

  const stopVoice = () => {
    try {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } catch {}
  }

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text }])

    const encryptedContent = encrypt(text)

    const payload = { content: text, encryptedContent, mood }

    if (isOnline && socket?.connected) {
      socket.emit('harbor-message', payload)
    } else {
      await idb.add('queue', payload)
      setMessages(prev => [...prev, { role: 'system', content: 'You are offline. Messages queued.' }])
    }
  }

  useEffect(() => {
    if (!isOnline) return
    const sync = async () => {
      const queued = await idb.popAll('queue')
      for (const item of queued) {
        socket?.emit('harbor-message', item.value)
      }
    }
    sync()
  }, [isOnline, socket])

  const breathing = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: 'Starting a 1-minute box breathing exercise. Inhale 4, hold 4, exhale 4, hold 4.' }])
  }

  const affirmation = () => {
    const list = [
      'Chinta chita samaan. Let go of worry; breathe and be present.',
      'Idam porul evvalavu sirithāl, uḷ porul athigam. (Tamil: Inner wealth matters more.)',
      'Aaram se, sab theek hoga. (Take it easy, it will be okay.)',
      'Thedi kidaikkum uḷḷam thelivāgum. (Tamil: Seeking brings clarity.)'
    ]
    const pick = list[Math.floor(Math.random() * list.length)]
    setMessages(prev => [...prev, { role: 'assistant', content: pick }])
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 max-w-[90vw] shadow-lg border rounded-lg overflow-hidden" style={{ background: 'var(--harbor-bg, #ffffff)' }}>
      <div className="p-3 border-b flex items-center justify-between" style={{ background: 'var(--harbor-header, #ADD8E6)' }}>
        <div className="font-semibold" style={{ color: 'var(--harbor-text, #333333)' }}>Harbor</div>
        <div className="flex gap-2">
          <button onClick={affirmation} className="text-sm px-2 py-1 rounded bg-gray-100">Affirmation</button>
          <button onClick={breathing} className="text-sm px-2 py-1 rounded bg-gray-100">Breathing Exercise</button>
        </div>
      </div>
      <div className="h-80 overflow-y-auto p-3 space-y-2" style={{ background: 'var(--harbor-bg, #ffffff)' }}>
        {messages.map((m, idx) => (
          <div key={idx} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={m.role === 'user' ? 'max-w-[75%] px-3 py-2 rounded-lg text-white' : 'max-w-[75%] px-3 py-2 rounded-lg'}
                 style={m.role === 'user' ? { background: '#3b82f6' } : { background: '#e5e7eb', color: '#111827' }}>
              {m.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-3 border-t flex items-center gap-2" style={{ background: 'var(--harbor-bg, #ffffff)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 border rounded px-3 py-2"
        />
        {!isRecording ? (
          <button onClick={startVoice} className="px-3 py-2 rounded bg-gray-100">🎙️</button>
        ) : (
          <button onClick={stopVoice} className="px-3 py-2 rounded bg-gray-100">🛑</button>
        )}
        <button onClick={send} className="px-3 py-2 rounded bg-blue-600 text-white">Send</button>
      </div>
      {!isOnline && (
        <div className="px-3 py-2 text-xs text-center" style={{ color: '#b45309', background: '#fffbeb' }}>
          You are offline. Messages will be queued.
        </div>
      )}
    </div>
  )
}


