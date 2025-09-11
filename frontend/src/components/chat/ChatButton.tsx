'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import dynamic from 'next/dynamic'
const Harbor = dynamic(() => import('../../components/Harbor'), { ssr: false })
import { MessageCircle, X } from 'lucide-react'

export function ChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (isOpen) {
      setIsMinimized(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={toggleChat}
            className="w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700"
            size="lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <Harbor />
      )}
    </>
  )
}
