'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Flame, 
  Trophy, 
  Calendar, 
  Target,
  Star,
  Gift,
  Zap
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface StreakData {
  current: number
  longest: number
  lastLogDate: string | null
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  unlocked: boolean
  progress: number
  maxProgress: number
  reward?: string
}

const achievements: Achievement[] = [
  {
    id: 'first_log',
    name: 'Getting Started',
    description: 'Log your first mood',
    icon: Star,
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'week_streak',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: Flame,
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    reward: 'Unlock premium mood insights'
  },
  {
    id: 'month_streak',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: Trophy,
    unlocked: false,
    progress: 0,
    maxProgress: 30,
    reward: 'Exclusive mood patterns report'
  },
  {
    id: 'hundred_logs',
    name: 'Century Club',
    description: 'Log 100 mood entries',
    icon: Target,
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    reward: 'Personalized wellness plan'
  }
]

export function StreakTracker() {
  const { user } = useAuth()
  const [streakData, setStreakData] = useState<StreakData>({ current: 0, longest: 0, lastLogDate: null })
  const [userAchievements, setUserAchievements] = useState<Achievement[]>(achievements)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadStreakData()
    loadAchievements()
  }, [])

  const loadStreakData = async () => {
    try {
      const response = await api.get('/mood/streak')
      if (response.data.success) {
        setStreakData(response.data.data.streak)
      }
    } catch (error) {
      console.error('Failed to load streak data:', error)
    }
  }

  const loadAchievements = async () => {
    try {
      const response = await api.get('/mood/achievements')
      if (response.data.success) {
        setUserAchievements(response.data.data.achievements)
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
      // Use default achievements if API fails
    }
  }

  const getStreakMessage = () => {
    if (streakData.current === 0) {
      return "Start your mood tracking journey today!"
    } else if (streakData.current === 1) {
      return "Great start! Keep it going!"
    } else if (streakData.current < 7) {
      return `${streakData.current} days strong! You're building a great habit.`
    } else if (streakData.current < 30) {
      return `Amazing! ${streakData.current} days in a row! You're on fire! 🔥`
    } else {
      return `Incredible! ${streakData.current} days! You're a mood tracking champion! 🏆`
    }
  }

  const getStreakColor = () => {
    if (streakData.current === 0) return 'text-gray-500'
    if (streakData.current < 3) return 'text-blue-500'
    if (streakData.current < 7) return 'text-green-500'
    if (streakData.current < 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getStreakIcon = () => {
    if (streakData.current === 0) return Flame
    if (streakData.current < 7) return Flame
    if (streakData.current < 30) return Zap
    return Trophy
  }

  const StreakIcon = getStreakIcon()

  const isStreakActive = () => {
    if (!streakData.lastLogDate) return false
    
    const lastLog = new Date(streakData.lastLogDate)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    lastLog.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)
    
    return lastLog.getTime() === today.getTime() || lastLog.getTime() === yesterday.getTime()
  }

  const getDaysSinceLastLog = () => {
    if (!streakData.lastLogDate) return null
    
    const lastLog = new Date(streakData.lastLogDate)
    const today = new Date()
    const diffTime = today.getTime() - lastLog.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Main Streak Card */}
      <Card className="p-6 bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isStreakActive() ? 'bg-primary-100' : 'bg-gray-100'
            }`}>
              <StreakIcon className={`h-6 w-6 ${
                isStreakActive() ? 'text-primary-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Mood Tracking Streak</h3>
              <p className="text-sm text-gray-600">{getStreakMessage()}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`text-3xl font-bold ${getStreakColor()}`}>
              {streakData.current}
            </div>
            <div className="text-sm text-gray-500">days</div>
          </div>
        </div>

        {/* Streak Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{streakData.longest}</div>
              <div className="text-xs text-gray-500">Longest</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {isStreakActive() ? '🔥' : '❄️'}
              </div>
              <div className="text-xs text-gray-500">Status</div>
            </div>
          </div>
          
          {!isStreakActive() && streakData.current > 0 && (
            <div className="text-right">
              <div className="text-sm text-orange-600 font-medium">
                {getDaysSinceLastLog() === 1 ? 'Streak at risk!' : 'Streak broken'}
              </div>
              <div className="text-xs text-gray-500">
                {getDaysSinceLastLog() === 1 
                  ? 'Log today to continue' 
                  : `Last logged ${getDaysSinceLastLog()} days ago`
                }
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to next milestone</span>
            <span>{streakData.current}/7</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((streakData.current / 7) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          <Trophy className="h-5 w-5 text-yellow-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userAchievements.map((achievement) => {
            const IconComponent = achievement.icon
            const progressPercentage = (achievement.progress / achievement.maxProgress) * 100
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  achievement.unlocked
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <IconComponent className={`h-5 w-5 ${
                      achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-medium ${
                        achievement.unlocked ? 'text-yellow-800' : 'text-gray-900'
                      }`}>
                        {achievement.name}
                      </h4>
                      {achievement.unlocked && (
                        <Gift className="h-4 w-4 text-yellow-600" />
                      )}
                    </div>
                    
                    <p className={`text-sm mt-1 ${
                      achievement.unlocked ? 'text-yellow-700' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                    
                    {achievement.reward && achievement.unlocked && (
                      <p className="text-xs text-yellow-600 mt-1 font-medium">
                        Reward: {achievement.reward}
                      </p>
                    )}
                    
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{achievement.progress}/{achievement.maxProgress}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            achievement.unlocked ? 'bg-yellow-500' : 'bg-primary-500'
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Streak Tips */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Streak Tips</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Set a daily reminder to log your mood at the same time each day</p>
          <p>• Even if you miss a day, don't give up - start a new streak!</p>
          <p>• Use the mood passport to track patterns and improve your well-being</p>
          <p>• Share your achievements with friends for extra motivation</p>
        </div>
      </Card>
    </div>
  )
}
