'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Heart, MessageCircle, Users, Calendar } from 'lucide-react'

const stats = [
  {
    name: 'Mood Streak',
    value: '7 days',
    change: '+2 days',
    changeType: 'positive',
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    name: 'AI Chats',
    value: '12',
    change: '+3 this week',
    changeType: 'positive',
    icon: MessageCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Peer Connections',
    value: '5',
    change: '+1 new',
    changeType: 'positive',
    icon: Users,
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Sessions Booked',
    value: '2',
    change: 'Next: Tomorrow',
    changeType: 'neutral',
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
]

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600' 
                    : stat.changeType === 'negative'
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`}>
                  {stat.change}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
