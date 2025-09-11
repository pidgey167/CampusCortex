'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Globe, 
  AlertTriangle, 
  Phone,
  Heart,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  language?: string
  metadata?: {
    mood?: string
    intent?: string
    confidence?: number
  }
}

interface ChatSession {
  sessionId: string
  messages: Message[]
  isActive: boolean
  context: {
    language: string
    currentMood?: string
    escalationLevel: number
  }
  flags: string[]
}

interface AiSathiChatProps {
  isOpen: boolean
  onClose: () => void
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function AiSathiChat({ isOpen, onClose, isMinimized, onToggleMinimize }: AiSathiChatProps) {
  const { user } = useAuth()
  const [session, setSession] = useState<ChatSession | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferences?.language || 'en')
  const [showCrisisResources, setShowCrisisResources] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇮🇳' }
  ]

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognitionRef.current = new (window as any).webkitSpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = selectedLanguage === 'en' ? 'en-US' : 'hi-IN'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setMessage(transcript)
        setIsRecording(false)
      }

      recognitionRef.current.onerror = () => {
        setIsRecording(false)
        toast.error('Speech recognition failed')
      }
    }
  }, [selectedLanguage])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages])

  // Start chat session on mount
  useEffect(() => {
    if (isOpen && !session) {
      startChatSession()
    }
  }, [isOpen])

  const startChatSession = async () => {
    try {
      setIsLoading(true)
      const response = await api.post('/chat/session', {
        language: selectedLanguage
      })
      
      if (response.data.success) {
        setSession(response.data.data)
      }
    } catch (error) {
      console.error('Failed to start chat session:', error)
      toast.error('Failed to start chat session')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || !session || isLoading) return

    const userMessage = message.trim()
    setMessage('')
    setIsLoading(true)

    try {
      // Add user message to UI immediately
      const tempSession = {
        ...session,
        messages: [
          ...session.messages,
          {
            role: 'user' as const,
            content: userMessage,
            timestamp: new Date().toISOString(),
            language: selectedLanguage
          }
        ]
      }
      setSession(tempSession)

      const response = await api.post('/chat/message', {
        sessionId: session.sessionId,
        content: userMessage,
        language: selectedLanguage
      })

      if (response.data.success) {
        const { response: aiResponse, escalationLevel, isCrisis, needsEscalation } = response.data.data

        // Add AI response
        const updatedSession = {
          ...tempSession,
          messages: [
            ...tempSession.messages,
            {
              role: 'assistant' as const,
              content: aiResponse,
              timestamp: new Date().toISOString(),
              language: selectedLanguage,
              metadata: {
                confidence: 0.8
              }
            }
          ],
          context: {
            ...tempSession.context,
            escalationLevel
          },
          flags: [
            ...tempSession.flags,
            ...(isCrisis ? ['crisis'] : []),
            ...(needsEscalation ? ['escalation_needed'] : [])
          ]
        }
        setSession(updatedSession)

        // Show crisis resources if needed
        if (isCrisis || escalationLevel >= 2) {
          setShowCrisisResources(true)
          toast.error('Crisis detected - showing emergency resources')
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported')
      return
    }

    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getCrisisResources = async () => {
    try {
      const response = await api.get(`/chat/crisis-resources?language=${selectedLanguage}`)
      if (response.data.success) {
        const resources = response.data.data.resources
        return resources
      }
    } catch (error) {
      console.error('Failed to get crisis resources:', error)
    }
    return null
  }

  if (!isOpen) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${isMinimized ? 'w-80' : 'w-96'} transition-all duration-300`}>
      <Card className="bg-white shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">AI Sathi</h3>
                <p className="text-xs opacity-90">Your mental health companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onToggleMinimize && (
                <button
                  onClick={onToggleMinimize}
                  className="p-1 hover:bg-white/20 rounded"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Language Selector */}
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border-0 bg-transparent focus:ring-0"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Crisis Alert */}
            {showCrisisResources && (
              <div className="p-3 bg-red-50 border-b border-red-200">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Crisis Support Available
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      If you're in immediate danger, please call emergency services.
                    </p>
                    <div className="flex space-x-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => window.open('tel:108')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        Emergency: 108
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => window.open('tel:1800-599-0019')}
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        KIRAN: 1800-599-0019
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {isLoading && !session ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Starting conversation...</p>
                  </div>
                </div>
              ) : session?.messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with AI Sathi</p>
                </div>
              ) : (
                session?.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && session && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <button
                    onClick={toggleRecording}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                      isRecording ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!message.trim() || isLoading}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
