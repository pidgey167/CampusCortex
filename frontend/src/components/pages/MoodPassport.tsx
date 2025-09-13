'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Heart, Calendar, TrendingUp, Target } from 'lucide-react'
import toast from 'react-hot-toast'

const moodOptions = [
  { value: 'happy', emoji: '😊', label: 'Happy', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'sad', emoji: '😢', label: 'Sad', color: 'bg-blue-100 text-blue-800' },
  { value: 'anxious', emoji: '😰', label: 'Anxious', color: 'bg-purple-100 text-purple-800' },
  { value: 'stressed', emoji: '😤', label: 'Stressed', color: 'bg-red-100 text-red-800' },
  { value: 'tired', emoji: '😴', label: 'Tired', color: 'bg-gray-100 text-gray-800' },
  { value: 'angry', emoji: '😠', label: 'Angry', color: 'bg-red-100 text-red-800' },
  { value: 'excited', emoji: '🤩', label: 'Excited', color: 'bg-orange-100 text-orange-800' },
  { value: 'calm', emoji: '😌', label: 'Calm', color: 'bg-green-100 text-green-800' },
  { value: 'confused', emoji: '😕', label: 'Confused', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lonely', emoji: '😔', label: 'Lonely', color: 'bg-indigo-100 text-indigo-800' },
]

const triggerOptions = [
  'academic', 'social', 'family', 'health', 'financial', 'relationship', 'work', 'other'
]

const activityOptions = [
  'exercise', 'study', 'social', 'rest', 'hobby', 'work', 'other'
]

const sleepQualityOptions = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-100 text-green-800' },
  { value: 'good', label: 'Good', color: 'bg-blue-100 text-blue-800' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'poor', label: 'Poor', color: 'bg-red-100 text-red-800' },
]

interface MoodLog {
  mood: string
  intensity: number
  notes: string
  triggers: string[]
  activities: string[]
  sleep: {
    hours: number
    quality: string
  }
  stressLevel: number
  energyLevel: number
}

export function MoodPassport() {
  const { user } = useAuth()
  const [selectedMood, setSelectedMood] = useState('')
  const [intensity, setIntensity] = useState(5)
  const [notes, setNotes] = useState('')
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([])
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepQuality, setSleepQuality] = useState('')
  const [stressLevel, setStressLevel] = useState(5)
  const [energyLevel, setEnergyLevel] = useState(5)
  const [loading, setLoading] = useState(false)
  const [todayMood, setTodayMood] = useState<MoodLog | null>(null)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    // Check if mood is already logged today
    checkTodayMood()
    getMoodStreak()
  }, [])

  const checkTodayMood = async () => {
    try {
      // This would be an API call to check today's mood
      // For now, we'll simulate it
      setTodayMood(null)
    } catch (error) {
      console.error('Error checking today\'s mood:', error)
    }
  }

  const getMoodStreak = async () => {
    try {
      // This would be an API call to get mood streak
      // For now, we'll simulate it
      setStreak(7)
    } catch (error) {
      console.error('Error getting mood streak:', error)
    }
  }

  const handleTriggerToggle = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) 
        ? prev.filter(t => t !== trigger)
        : [...prev, trigger]
    )
  }

  const handleActivityToggle = (activity: string) => {
    setSelectedActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedMood) {
      toast.error('Please select a mood')
      return
    }

    setLoading(true)
    try {
      const moodData = {
        mood: selectedMood,
        intensity,
        notes,
        triggers: selectedTriggers,
        activities: selectedActivities,
        sleep: {
          hours: sleepHours,
          quality: sleepQuality
        },
        stressLevel,
        energyLevel
      }

      const token = localStorage.getItem('token')
      // This would be an API call to save the mood log
     const res = await fetch("http://localhost:5000/api/mood", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // if you're using JWT auth
      },
      body: JSON.stringify(moodData),
    })

    if (!res.ok) {
      throw new Error("Failed to log mood")
    }

    const data = await res.json() 
      // Simulate API call
      
      toast.success('Mood logged successfully!')
      
      // Reset form
      setSelectedMood('')
      setIntensity(5)
      setNotes('')
      setSelectedTriggers([])
      setSelectedActivities([])
      setSleepHours(8)
      setSleepQuality('')
      setStressLevel(5)
      setEnergyLevel(5)
      
      // Refresh today's mood
      checkTodayMood()
      getMoodStreak()
      
    } catch (error) {
      toast.error('Failed to log mood. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mood Passport</h1>
            <p className="text-gray-600 mt-2">
              Track your daily emotions and mental well-being
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600">{streak}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <Heart className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        {todayMood ? (
          /* Today's mood already logged */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Today's Mood Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <div className="text-6xl mb-4">
                  {moodOptions.find(m => m.value === todayMood.mood)?.emoji}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                  {todayMood.mood} ({todayMood.intensity}/10)
                </h3>
                <p className="text-gray-600 mb-4">
                  {todayMood.notes}
                </p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span>Stress: {todayMood.stressLevel}/10</span>
                  <span>Energy: {todayMood.energyLevel}/10</span>
                  <span>Sleep: {todayMood.sleep.hours}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Mood logging form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mood Selection */}
            <Card>
              <CardHeader>
                <CardTitle>How are you feeling today?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.value}
                      type="button"
                      onClick={() => setSelectedMood(mood.value)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedMood === mood.value
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-3xl mb-2">{mood.emoji}</div>
                      <div className="text-sm font-medium">{mood.label}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Intensity and Levels */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Mood Intensity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>How intense is this feeling? ({intensity}/10)</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={intensity}
                        onChange={(e) => setIntensity(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stress Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Current stress level ({stressLevel}/10)</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={stressLevel}
                        onChange={(e) => setStressLevel(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Energy Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Current energy level ({energyLevel}/10)</Label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={energyLevel}
                        onChange={(e) => setEnergyLevel(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Triggers and Activities */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What might have influenced your mood?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {triggerOptions.map((trigger) => (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => handleTriggerToggle(trigger)}
                        className={`p-2 rounded-md text-sm font-medium transition-colors ${
                          selectedTriggers.includes(trigger)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {trigger.charAt(0).toUpperCase() + trigger.slice(1)}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What activities did you do today?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {activityOptions.map((activity) => (
                      <button
                        key={activity}
                        type="button"
                        onClick={() => handleActivityToggle(activity)}
                        className={`p-2 rounded-md text-sm font-medium transition-colors ${
                          selectedActivities.includes(activity)
                            ? 'bg-primary-100 text-primary-700 border border-primary-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {activity.charAt(0).toUpperCase() + activity.slice(1)}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sleep Quality */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sleep Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid lg:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="sleepHours">Hours of sleep last night</Label>
                    <Input
                      id="sleepHours"
                      type="number"
                      min="0"
                      max="24"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Sleep quality</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {sleepQualityOptions.map((quality) => (
                        <button
                          key={quality.value}
                          type="button"
                          onClick={() => setSleepQuality(quality.value)}
                          className={`p-2 rounded-md text-sm font-medium transition-colors ${
                            sleepQuality === quality.value
                              ? quality.color + ' border border-current'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {quality.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Notes (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Share any additional thoughts or feelings..."
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                loading={loading}
                disabled={loading || !selectedMood}
                size="lg"
              >
                <Heart className="h-4 w-4 mr-2" />
                Log My Mood
              </Button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  )
}
