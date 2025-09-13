'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Heart, Plus } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '../providers/AuthProvider'
import { useEffect, useState } from 'react'
import api from '@/lib/api'

const moodEmojis = {
  happy: '😊',
  sad: '😢',
  anxious: '😰',
  stressed: '😤',
  tired: '😴',
  angry: '😠',
  excited: '🤩',
  calm: '😌',
  confused: '😕',
  lonely: '😔',
}

const recentMoods = [
  { date: '2024-01-15', mood: 'happy', intensity: 8, note: 'Great day at college!' },
  { date: '2024-01-14', mood: 'calm', intensity: 6, note: 'Peaceful study session' },
  { date: '2024-01-13', mood: 'stressed', intensity: 7, note: 'Exam preparation' },
  { date: '2024-01-12', mood: 'excited', intensity: 9, note: 'Project presentation went well' },
  { date: '2024-01-11', mood: 'tired', intensity: 5, note: 'Long day of classes' },
]

export function MoodTracker() {
  const { user } = useAuth()
  const [todayMood, setTodayMood] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchTodayMood = async () => {
      try {
        const response = await api.get('/mood/today', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        setTodayMood(response.data.data.moodLog) // backend should return the mood log for today
      } catch (err) {
        console.error('Failed to fetch today\'s mood', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTodayMood()
  }, [user])

  console.log(todayMood)
  if (loading) return <p>Loading...</p>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2 text-red-500" />
            Mood Passport
          </CardTitle>
          <Link href="/mood">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Log Mood
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {todayMood ? (
          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-4xl mb-2">
                {moodEmojis[todayMood.mood as keyof typeof moodEmojis]}
              </div>
              <h3 className="font-semibold text-green-800 capitalize">
                {todayMood.mood} ({todayMood.intensity}/10)
              </h3>
              <p className="text-sm text-green-600 mt-1">
                {todayMood.note}
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Recent Entries</h4>
              <div className="space-y-2">
                {recentMoods.slice(0, 3).map((mood, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {moodEmojis[mood.mood as keyof typeof moodEmojis]}
                      </span>
                      <div>
                        <p className="text-sm font-medium capitalize">{mood.mood}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(mood.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      {mood.intensity}/10
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Haven't logged your mood today?
            </h3>
            <p className="text-gray-600 mb-4">
              Take a moment to check in with yourself and track how you're feeling.
            </p>
            <Link href="/mood">
              <Button>
                <Heart className="h-4 w-4 mr-2" />
                Log Today's Mood
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
