'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Heart, 
  MessageCircle, 
  Users, 
  BookOpen, 
  Calendar, 
  TrendingUp,
  Shield,
  Bell
} from 'lucide-react'
import Link from 'next/link'

const quickActions = [
  {
    name: 'Log Today\'s Mood',
    description: 'Track how you\'re feeling',
    icon: Heart,
    href: '/mood',
    color: 'text-red-500',
    bgColor: 'bg-red-50',
  },
  {
    name: 'Chat with AI Sathi',
    description: 'Get instant support',
    icon: MessageCircle,
    href: '/chat',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
  },
  {
    name: 'Join Peer Pods',
    description: 'Connect with others',
    icon: Users,
    href: '/forum',
    color: 'text-green-500',
    bgColor: 'bg-green-50',
  },
  {
    name: 'Browse Resources',
    description: 'Mental health guides',
    icon: BookOpen,
    href: '/resources',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
  },
  {
    name: 'Book Counsellor',
    description: 'Schedule a session',
    icon: Calendar,
    href: '/booking',
    color: 'text-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    name: 'View Progress',
    description: 'Track your journey',
    icon: TrendingUp,
    href: '/progress',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-50',
  },
]

const emergencyActions = [
  {
    name: 'Crisis Support',
    description: 'Immediate help available',
    icon: Shield,
    href: '/crisis',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    urgent: true,
  },
  {
    name: 'Emergency Contacts',
    description: '24/7 helpline numbers',
    icon: Bell,
    href: '/emergency',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    urgent: true,
  },
]

export function QuickActions() {
  return (
    <div className="space-y-6">
      {/* Regular Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        {action.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Actions */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800">Emergency Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {emergencyActions.map((action) => (
              <Link key={action.name} href={action.href}>
                <div className="p-4 rounded-lg border border-red-200 bg-white hover:border-red-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${action.bgColor}`}>
                      <action.icon className={`h-5 w-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-red-800">
                        {action.name}
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
