'use client'

import { useAuth } from '@/components/providers/AuthProvider'
import { Heart, Home, MessageCircle, Users, BookOpen, Calendar, BarChart3, Settings, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Mood Passport', href: '/mood', icon: Heart },
  { name: 'AI Sathi', href: '/chat', icon: MessageCircle },
  { name: 'Peer Pods', href: '/forum', icon: Users },
  { name: 'Resource Hub', href: '/resources', icon: BookOpen },
  { name: 'Book Counsellor', href: '/booking', icon: Calendar },
]

const adminNavigation = [
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
]

export function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
  const { user } = useAuth()
  const pathname = usePathname()

  const isAdmin = user?.role === 'admin' || user?.role === 'counsellor'

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 lg:hidden">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
      </div>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">CampusCortex</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    {
                      'bg-primary-100 text-primary-700': isActive,
                      'text-gray-600 hover:bg-gray-100 hover:text-gray-900': !isActive,
                    }
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}

            {/* Admin navigation */}
            {isAdmin && (
              <>
                <div className="pt-6">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Administration
                  </div>
                </div>
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onClose}
                      className={clsx(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        {
                          'bg-primary-100 text-primary-700': isActive,
                          'text-gray-600 hover:bg-gray-100 hover:text-gray-900': !isActive,
                        }
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
