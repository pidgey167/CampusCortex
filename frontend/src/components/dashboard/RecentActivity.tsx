'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MessageCircle, Users, BookOpen, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

const recentActivities = [
  {
    id: 1,
    type: 'chat',
    title: 'Chat with AI Sathi',
    description: 'Discussed exam anxiety and coping strategies',
    time: '2 hours ago',
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    id: 2,
    type: 'forum',
    title: 'Posted in Stress Management Pod',
    description: 'Shared study tips with peers',
    time: '5 hours ago',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    id: 3,
    type: 'resource',
    title: 'Viewed Meditation Guide',
    description: 'Completed 10-minute breathing exercise',
    time: '1 day ago',
    icon: BookOpen,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    id: 4,
    type: 'booking',
    title: 'Booked Counselling Session',
    description: 'Scheduled for tomorrow at 2:00 PM',
    time: '2 days ago',
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    id: 5,
    type: 'mood',
    title: 'Logged Mood Entry',
    description: 'Feeling calm and focused',
    time: '3 days ago',
    icon: Clock,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
]

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                <activity.icon className={`h-4 w-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link href="/activity">
            <button className="w-full text-sm text-primary-600 hover:text-primary-500 font-medium">
              View All Activity
            </button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
