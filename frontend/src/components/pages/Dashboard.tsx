'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { WelcomeCard } from '@/components/dashboard/WelcomeCard'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { MoodTracker } from '@/components/dashboard/MoodTracker'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { StatsOverview } from '@/components/dashboard/StatsOverview'

export function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    window.location.href = '/'
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <WelcomeCard user={user} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Stats Overview */}
        <StatsOverview />

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mood Tracker */}
          <MoodTracker />

          {/* Recent Activity */}
          <RecentActivity />
        </div>
      </div>
    </DashboardLayout>
  )
}
