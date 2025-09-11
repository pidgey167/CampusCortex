'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/Button'
import { Heart, Users, MessageCircle, BookOpen, Calendar, Shield } from 'lucide-react'

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const { user } = useAuth()

  if (user) {
    // Redirect to dashboard if user is already logged in
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">CampusCortex</span>
            </div>
            <div className="flex space-x-4">
              <Button
                variant={activeTab === 'login' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('login')}
              >
                Login
              </Button>
              <Button
                variant={activeTab === 'register' ? 'primary' : 'outline'}
                onClick={() => setActiveTab('register')}
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Mental Health
                <span className="text-primary-600"> Companion</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                A comprehensive digital platform designed to support students' mental well-being 
                through AI-powered assistance, peer support, and professional counselling.
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Mood Passport</h3>
                  <p className="text-sm text-gray-600">Track your daily emotions and mental state</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-secondary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Sathi</h3>
                  <p className="text-sm text-gray-600">24/7 AI chatbot for immediate support</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-success-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Peer Pods</h3>
                  <p className="text-sm text-gray-600">Connect with peers in themed support groups</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-warning-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Resource Hub</h3>
                  <p className="text-sm text-gray-600">Access mental health resources and guides</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Counsellor Booking</h3>
                  <p className="text-sm text-gray-600">Schedule confidential counselling sessions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-danger-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Privacy First</h3>
                  <p className="text-sm text-gray-600">Your data is secure and anonymous</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">1000+</div>
                <div className="text-sm text-gray-600">Students Supported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-600">24/7</div>
                <div className="text-sm text-gray-600">AI Support</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">50+</div>
                <div className="text-sm text-gray-600">Resources</div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Forms */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'login'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'register'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 CampusCortex. All rights reserved.</p>
            <p className="mt-2 text-sm">
              Built with ❤️ for student mental health and well-being
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
