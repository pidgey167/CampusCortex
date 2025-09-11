'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageCircle, 
  Calendar,
  Heart,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface MoodData {
  date: string
  mood: string
  intensity: number
  stressLevel: number
  energyLevel: number
}

interface AnalyticsData {
  moodTrends: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  moodDistribution: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
    }[]
  }
  stressLevels: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
  weeklyStats: {
    totalMoodLogs: number
    averageMood: number
    averageStress: number
    averageEnergy: number
    mostCommonMood: string
    stressSpikes: number
  }
  monthlyStats: {
    totalMoodLogs: number
    averageMood: number
    averageStress: number
    averageEnergy: number
    mostCommonMood: string
    stressSpikes: number
  }
  departmentStats: {
    department: string
    totalUsers: number
    averageMood: number
    averageStress: number
    crisisAlerts: number
  }[]
  chatStats: {
    totalSessions: number
    averageSessionLength: number
    crisisInterventions: number
    escalationRate: number
  }
  bookingStats: {
    totalBookings: number
    completedSessions: number
    cancellationRate: number
    averageRating: number
  }
}

const moodColors = {
  happy: '#10B981',
  sad: '#3B82F6',
  anxious: '#F59E0B',
  stressed: '#EF4444',
  tired: '#6B7280',
  angry: '#DC2626',
  excited: '#8B5CF6',
  calm: '#059669',
  confused: '#7C3AED',
  lonely: '#1F2937'
}

const stressColors = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626'
}

export function AnalyticsDashboard() {
  const { user } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange, selectedDepartment, refreshKey])

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        timeRange,
        department: selectedDepartment
      })
      
      const response = await api.get(`/admin/analytics?${params.toString()}`)
      if (response.data.success) {
        setAnalyticsData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      const response = await api.get(`/admin/analytics/export?timeRange=${timeRange}&department=${selectedDepartment}`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `mindsutra-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      
      toast.success('Analytics data exported successfully')
    } catch (error) {
      console.error('Failed to export data:', error)
      toast.error('Failed to export data')
    }
  }

  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
    toast.success('Data refreshed')
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const currentStats = timeRange === 'week' ? analyticsData.weeklyStats : analyticsData.monthlyStats

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into student mental health and platform usage.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={exportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Departments</option>
            <option value="computer_science">Computer Science</option>
            <option value="engineering">Engineering</option>
            <option value="medicine">Medicine</option>
            <option value="business">Business</option>
            <option value="arts">Arts</option>
          </select>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mood Logs</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.totalMoodLogs}</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-primary-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+12% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Mood</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.averageMood.toFixed(1)}/10</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">+0.3 from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stress Spikes</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.stressSpikes}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600">-8% from last period</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Most Common Mood</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{currentStats.mostCommonMood}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">32% of all logs</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mood Trends */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mood Trends Over Time</h3>
          <div className="h-64">
            <Line
              data={analyticsData.moodTrends}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 10,
                  },
                },
              }}
            />
          </div>
        </Card>

        {/* Mood Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Mood Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={analyticsData.moodDistribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                },
              }}
            />
          </div>
        </Card>
      </div>

      {/* Stress Levels */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Stress Levels Over Time</h3>
        <div className="h-64">
          <Bar
            data={analyticsData.stressLevels}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 10,
                },
              },
            }}
          />
        </div>
      </Card>

      {/* Department Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Department Statistics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Mood
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Stress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Crisis Alerts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analyticsData.departmentStats.map((dept, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.department.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.totalUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.averageMood.toFixed(1)}/10
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {dept.averageStress.toFixed(1)}/10
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      dept.crisisAlerts > 5 
                        ? 'bg-red-100 text-red-800' 
                        : dept.crisisAlerts > 2 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {dept.crisisAlerts}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Platform Usage Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">AI Chatbot Usage</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Sessions</span>
              <span className="font-semibold">{analyticsData.chatStats.totalSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Session Length</span>
              <span className="font-semibold">{analyticsData.chatStats.averageSessionLength} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Crisis Interventions</span>
              <span className="font-semibold text-red-600">{analyticsData.chatStats.crisisInterventions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Escalation Rate</span>
              <span className="font-semibold">{(analyticsData.chatStats.escalationRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Counselling Bookings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Bookings</span>
              <span className="font-semibold">{analyticsData.bookingStats.totalBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completed Sessions</span>
              <span className="font-semibold">{analyticsData.bookingStats.completedSessions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Cancellation Rate</span>
              <span className="font-semibold">{(analyticsData.bookingStats.cancellationRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Rating</span>
              <span className="font-semibold">{analyticsData.bookingStats.averageRating.toFixed(1)}/5</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

