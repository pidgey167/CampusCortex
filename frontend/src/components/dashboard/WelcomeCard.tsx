'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Heart, MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  firstName: string
  lastName: string
  role: string
  department?: string
  year?: string
}

interface WelcomeCardProps {
  user: User
}

export function WelcomeCard({ user }: WelcomeCardProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getMotivationalMessage = () => {
    const messages = [
      "Take a moment to check in with yourself today.",
      "Your mental health matters. You're doing great!",
      "Remember, it's okay to not be okay sometimes.",
      "Small steps lead to big changes. Keep going!",
      "You're stronger than you think. Believe in yourself.",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  return (
    <Card className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {getGreeting()}, {user.firstName}! 👋
            </h1>
            <p className="text-primary-100 text-lg">
              {getMotivationalMessage()}
            </p>
            <div className="flex items-center space-x-4 text-sm text-primary-100">
              {user.department && (
                <span>📚 {user.department}</span>
              )}
              {user.year && (
                <span>🎓 {user.year} Year</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 mt-6 lg:mt-0">
            <Link href="/mood">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Heart className="h-4 w-4 mr-2" />
                Log Mood
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant="secondary" className="w-full sm:w-auto">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat with AI
              </Button>
            </Link>
            <Link href="/booking">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Calendar className="h-4 w-4 mr-2" />
                Book Session
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
