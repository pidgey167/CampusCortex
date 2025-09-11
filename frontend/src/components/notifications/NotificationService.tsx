'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { 
  Bell, 
  BellOff, 
  Settings, 
  Smartphone,
  QrCode,
  Download,
  Share,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

interface NotificationSettings {
  moodReminders: boolean
  appointmentReminders: boolean
  streakReminders: boolean
  crisisAlerts: boolean
  weeklyReports: boolean
  pushEnabled: boolean
  emailEnabled: boolean
  smsEnabled: boolean
}

interface QRCodeData {
  url: string
  type: 'ai_chat' | 'mood_log' | 'booking' | 'general'
  title: string
  description: string
}

export function NotificationService() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<NotificationSettings>({
    moodReminders: true,
    appointmentReminders: true,
    streakReminders: true,
    crisisAlerts: true,
    weeklyReports: false,
    pushEnabled: false,
    emailEnabled: true,
    smsEnabled: false
  })
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkNotificationPermission()
    loadNotificationSettings()
  }, [])

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }

  const loadNotificationSettings = async () => {
    try {
      const response = await api.get('/users/notification-settings')
      if (response.data.success) {
        setSettings(response.data.data.settings)
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error)
    }
  }

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      
      if (permission === 'granted') {
        setSettings(prev => ({ ...prev, pushEnabled: true }))
        toast.success('Notifications enabled!')
        
        // Send a test notification
        new Notification('MindSutra', {
          body: 'Welcome to MindSutra! You\'ll now receive helpful reminders.',
          icon: '/favicon.ico'
        })
      } else {
        toast.error('Notification permission denied')
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      toast.error('Failed to enable notifications')
    }
  }

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    try {
      setLoading(true)
      const updatedSettings = { ...settings, ...newSettings }
      
      const response = await api.put('/users/notification-settings', {
        settings: updatedSettings
      })
      
      if (response.data.success) {
        setSettings(updatedSettings)
        toast.success('Notification settings updated')
      }
    } catch (error) {
      console.error('Failed to update notification settings:', error)
      toast.error('Failed to update settings')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async (data: QRCodeData) => {
    try {
      const qrData = {
        url: data.url,
        type: data.type,
        timestamp: new Date().toISOString(),
        userId: user?._id
      }
      
      const qrString = JSON.stringify(qrData)
      const qrUrl = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      setQrCodeUrl(qrUrl)
      return qrUrl
    } catch (error) {
      console.error('Failed to generate QR code:', error)
      toast.error('Failed to generate QR code')
      return null
    }
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return
    
    const link = document.createElement('a')
    link.download = 'mindsutra-qr-code.png'
    link.href = qrCodeUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const shareQRCode = async () => {
    if (!qrCodeUrl) return
    
    if (navigator.share) {
      try {
        const response = await fetch(qrCodeUrl)
        const blob = await response.blob()
        const file = new File([blob], 'mindsutra-qr-code.png', { type: 'image/png' })
        
        await navigator.share({
          title: 'MindSutra QR Code',
          text: 'Scan this QR code to access MindSutra mental health support',
          files: [file]
        })
      } catch (error) {
        console.error('Failed to share QR code:', error)
        toast.error('Failed to share QR code')
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.origin)
        toast.success('App URL copied to clipboard')
      } catch (error) {
        toast.error('Failed to copy URL')
      }
    }
  }

  const testNotification = () => {
    if (permission === 'granted') {
      new Notification('MindSutra Test', {
        body: 'This is a test notification from MindSutra',
        icon: '/favicon.ico',
        tag: 'test'
      })
      toast.success('Test notification sent!')
    } else {
      toast.error('Notifications not enabled')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications & QR Codes</h1>
          <p className="text-gray-600 mt-2">
            Manage your notification preferences and generate QR codes for easy access.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {permission === 'granted' ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Notifications Enabled</span>
            </div>
          ) : (
            <div className="flex items-center text-orange-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Notifications Disabled</span>
            </div>
          )}
        </div>
      </div>

      {/* Notification Permission */}
      {permission !== 'granted' && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Bell className="h-6 w-6 text-blue-600 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Enable Push Notifications
              </h3>
              <p className="text-blue-800 mb-4">
                Get timely reminders for mood logging, appointments, and important updates.
              </p>
              <Button onClick={requestNotificationPermission}>
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
          <Settings className="h-5 w-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Mood Logging Reminders</h4>
              <p className="text-sm text-gray-600">Daily reminders to log your mood</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.moodReminders}
                onChange={(e) => updateNotificationSettings({ moodReminders: e.target.checked })}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Appointment Reminders</h4>
              <p className="text-sm text-gray-600">Reminders for counselling sessions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.appointmentReminders}
                onChange={(e) => updateNotificationSettings({ appointmentReminders: e.target.checked })}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Streak Reminders</h4>
              <p className="text-sm text-gray-600">Motivational messages to maintain your streak</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.streakReminders}
                onChange={(e) => updateNotificationSettings({ streakReminders: e.target.checked })}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Crisis Alerts</h4>
              <p className="text-sm text-gray-600">Important safety and support notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.crisisAlerts}
                onChange={(e) => updateNotificationSettings({ crisisAlerts: e.target.checked })}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Weekly Reports</h4>
              <p className="text-sm text-gray-600">Weekly mood and wellness summaries</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.weeklyReports}
                onChange={(e) => updateNotificationSettings({ weeklyReports: e.target.checked })}
                className="sr-only peer"
                disabled={loading}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>

        {permission === 'granted' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={testNotification}
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}
      </Card>

      {/* QR Code Generator */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">QR Code Generator</h3>
          <QrCode className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Generate QR Codes</h4>
            <p className="text-sm text-gray-600">
              Create QR codes for easy access to different MindSutra features.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => generateQRCode({
                  url: `${window.location.origin}/chat`,
                  type: 'ai_chat',
                  title: 'AI Sathi Chat',
                  description: 'Start a conversation with AI Sathi'
                })}
                className="w-full justify-start"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                AI Sathi Chat
              </Button>

              <Button
                variant="outline"
                onClick={() => generateQRCode({
                  url: `${window.location.origin}/mood`,
                  type: 'mood_log',
                  title: 'Mood Passport',
                  description: 'Log your daily mood'
                })}
                className="w-full justify-start"
              >
                <Heart className="h-4 w-4 mr-2" />
                Mood Passport
              </Button>

              <Button
                variant="outline"
                onClick={() => generateQRCode({
                  url: `${window.location.origin}/booking`,
                  type: 'booking',
                  title: 'Book Counselling',
                  description: 'Schedule a counselling session'
                })}
                className="w-full justify-start"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Book Counselling
              </Button>

              <Button
                variant="outline"
                onClick={() => generateQRCode({
                  url: window.location.origin,
                  type: 'general',
                  title: 'MindSutra App',
                  description: 'Access MindSutra mental health platform'
                })}
                className="w-full justify-start"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                General Access
              </Button>
            </div>
          </div>

          {qrCodeUrl && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Generated QR Code</h4>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={downloadQRCode}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={shareQRCode}
                  >
                    <Share className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Usage Tips */}
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-start space-x-3">
          <Info className="h-6 w-6 text-green-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">💡 Usage Tips</h3>
            <div className="space-y-2 text-sm text-green-800">
              <p>• Print QR codes and place them around campus for easy access</p>
              <p>• Share QR codes with friends who might need mental health support</p>
              <p>• Use different QR codes for different features to track usage</p>
              <p>• Enable notifications to stay connected with your mental health journey</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
