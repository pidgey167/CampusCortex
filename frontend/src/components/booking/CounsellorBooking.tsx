'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Video, 
  Phone, 
  MessageCircle,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Counsellor {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  specialization: string[]
  experience: number
  rating: number
  bio: string
  availability: {
    days: string[]
    startTime: string
    endTime: string
  }
  location: {
    room?: string
    building?: string
    address?: string
  }
}

interface Booking {
  _id: string
  counsellor: Counsellor
  appointmentDate: string
  startTime: string
  endTime: string
  duration: number
  type: 'individual' | 'group' | 'crisis' | 'follow_up'
  mode: 'in_person' | 'online' | 'phone'
  location: {
    room?: string
    building?: string
    address?: string
    onlineLink?: string
    phoneNumber?: string
  }
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  reason: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  notes: {
    student?: string
    counsellor?: string
  }
  feedback?: {
    student: {
      rating: number
      comments: string
    }
  }
}

interface TimeSlot {
  start: string
  end: string
}

const appointmentTypes = [
  { value: 'individual', label: 'Individual Session', icon: User },
  { value: 'group', label: 'Group Session', icon: MessageCircle },
  { value: 'crisis', label: 'Crisis Support', icon: AlertCircle },
  { value: 'follow_up', label: 'Follow-up', icon: CheckCircle }
]

const appointmentModes = [
  { value: 'online', label: 'Online', icon: Video },
  { value: 'in_person', label: 'In-Person', icon: MapPin },
  { value: 'phone', label: 'Phone', icon: Phone }
]

const priorities = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'normal', label: 'Normal', color: 'text-blue-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
]

export function CounsellorBooking() {
  const { user } = useAuth()
  const [counsellors, setCounsellors] = useState<Counsellor[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedCounsellor, setSelectedCounsellor] = useState<Counsellor | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState<'counsellors' | 'calendar' | 'bookings'>('counsellors')
  const [newBooking, setNewBooking] = useState({
    counsellorId: '',
    appointmentDate: '',
    startTime: '',
    endTime: '',
    type: 'individual' as const,
    mode: 'online' as const,
    reason: '',
    priority: 'normal' as const,
    notes: ''
  })

  useEffect(() => {
    loadCounsellors()
    loadBookings()
  }, [])

  useEffect(() => {
    if (selectedCounsellor && selectedDate) {
      loadAvailableSlots(selectedCounsellor._id, selectedDate)
    }
  }, [selectedCounsellor, selectedDate])

  const loadCounsellors = async () => {
    try {
      setLoading(true)
      const response = await api.get('/users?role=counsellor')
      if (response.data.success) {
        setCounsellors(response.data.data.users)
      }
    } catch (error) {
      console.error('Failed to load counsellors:', error)
      toast.error('Failed to load counsellors')
    } finally {
      setLoading(false)
    }
  }

  const loadBookings = async () => {
    try {
      const response = await api.get('/booking/student')
      if (response.data.success) {
        setBookings(response.data.data.bookings)
      }
    } catch (error) {
      console.error('Failed to load bookings:', error)
      toast.error('Failed to load bookings')
    }
  }

  const loadAvailableSlots = async (counsellorId: string, date: string) => {
    try {
      const response = await api.get(`/booking/available-slots/${counsellorId}?date=${date}`)
      if (response.data.success) {
        setAvailableSlots(response.data.data.slots)
      }
    } catch (error) {
      console.error('Failed to load available slots:', error)
      toast.error('Failed to load available slots')
    }
  }

  const createBooking = async () => {
    if (!newBooking.counsellorId || !newBooking.appointmentDate || !newBooking.startTime || !newBooking.reason) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/booking', newBooking)
      if (response.data.success) {
        toast.success('Appointment booked successfully!')
        setShowBookingForm(false)
        setNewBooking({
          counsellorId: '',
          appointmentDate: '',
          startTime: '',
          endTime: '',
          type: 'individual',
          mode: 'online',
          reason: '',
          priority: 'normal',
          notes: ''
        })
        loadBookings()
      }
    } catch (error) {
      console.error('Failed to create booking:', error)
      toast.error('Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const response = await api.put(`/booking/${bookingId}/cancel`)
      if (response.data.success) {
        toast.success('Appointment cancelled successfully')
        loadBookings()
      }
    } catch (error) {
      console.error('Failed to cancel booking:', error)
      toast.error('Failed to cancel booking')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100'
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-purple-600 bg-purple-100'
      case 'completed': return 'text-gray-600 bg-gray-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      case 'no_show': return 'text-orange-600 bg-orange-100'
      case 'rescheduled': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getPriorityColor = (priority: string) => {
    return priorities.find(p => p.value === priority)?.color || 'text-gray-600'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  if (currentView === 'counsellors') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Counselling Session</h1>
            <p className="text-gray-600 mt-2">
              Schedule a confidential appointment with our qualified counsellors.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={currentView === 'counsellors' ? 'primary' : 'outline'}
              onClick={() => setCurrentView('counsellors')}
            >
              Counsellors
            </Button>
            <Button
              variant={currentView === 'bookings' ? 'primary' : 'outline'}
              onClick={() => setCurrentView('bookings')}
            >
              My Bookings
            </Button>
          </div>
        </div>

        {/* Counsellors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counsellors.map((counsellor) => (
            <Card key={counsellor._id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {counsellor.firstName} {counsellor.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">{counsellor.specialization.join(', ')}</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {counsellor.rating.toFixed(1)} ({counsellor.experience} years)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                {counsellor.bio}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Available: {counsellor.availability.days.join(', ')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {counsellor.location.room ? 
                    `Room ${counsellor.location.room}` : 
                    'Online sessions available'
                  }
                </div>
              </div>

              <Button
                onClick={() => {
                  setSelectedCounsellor(counsellor)
                  setNewBooking({ ...newBooking, counsellorId: counsellor._id })
                  setCurrentView('calendar')
                }}
                className="w-full"
              >
                Book Appointment
              </Button>
            </Card>
          ))}
        </div>

        {counsellors.length === 0 && !loading && (
          <Card className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No counsellors available</h3>
            <p className="text-gray-500">Please check back later or contact support.</p>
          </Card>
        )}
      </div>
    )
  }

  if (currentView === 'calendar') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600 mt-2">
              Select a date and time for your session with {selectedCounsellor?.firstName} {selectedCounsellor?.lastName}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentView('counsellors')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Counsellors
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Date and Time Selection */}
          <Card className="p-6">
            <h3 className="font-semibold text-lg mb-4">Select Date & Time</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                />
              </div>

              {selectedDate && availableSlots.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Time Slots
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setNewBooking({
                            ...newBooking,
                            appointmentDate: selectedDate,
                            startTime: slot.start,
                            endTime: slot.end
                          })
                          setShowBookingForm(true)
                        }}
                        className="p-3 border border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-sm"
                      >
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && availableSlots.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No available slots for this date</p>
                </div>
              )}
            </div>
          </Card>

          {/* Counsellor Info */}
          {selectedCounsellor && (
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Counsellor Details</h3>
              
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-semibold">
                    {selectedCounsellor.firstName} {selectedCounsellor.lastName}
                  </h4>
                  <p className="text-gray-600 text-sm">{selectedCounsellor.specialization.join(', ')}</p>
                  <div className="flex items-center mt-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">
                      {selectedCounsellor.rating.toFixed(1)} ({selectedCounsellor.experience} years)
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-700 text-sm mb-4">{selectedCounsellor.bio}</p>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Available: {selectedCounsellor.availability.days.join(', ')}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {selectedCounsellor.location.room ? 
                    `Room ${selectedCounsellor.location.room}` : 
                    'Online sessions available'
                  }
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-4">Confirm Appointment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Type
                    </label>
                    <select
                      value={newBooking.type}
                      onChange={(e) => setNewBooking({ ...newBooking, type: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {appointmentTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Mode
                    </label>
                    <select
                      value={newBooking.mode}
                      onChange={(e) => setNewBooking({ ...newBooking, mode: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {appointmentModes.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Session *
                    </label>
                    <textarea
                      value={newBooking.reason}
                      onChange={(e) => setNewBooking({ ...newBooking, reason: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      placeholder="Briefly describe what you'd like to discuss..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newBooking.priority}
                      onChange={(e) => setNewBooking({ ...newBooking, priority: e.target.value as any })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={newBooking.notes}
                      onChange={(e) => setNewBooking({ ...newBooking, notes: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={2}
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createBooking}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    )
  }

  if (currentView === 'bookings') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
            <p className="text-gray-600 mt-2">
              View and manage your counselling appointments.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={currentView === 'counsellors' ? 'primary' : 'outline'}
              onClick={() => setCurrentView('counsellors')}
            >
              Book New
            </Button>
            <Button
              variant={currentView === 'bookings' ? 'primary' : 'outline'}
              onClick={() => setCurrentView('bookings')}
            >
              My Bookings
            </Button>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking._id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-lg">
                      {booking.counsellor.firstName} {booking.counsellor.lastName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className={`text-sm font-medium ${getPriorityColor(booking.priority)}`}>
                      {booking.priority}
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(booking.appointmentDate)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        {booking.mode === 'online' ? (
                          <Video className="h-4 w-4 mr-2" />
                        ) : booking.mode === 'phone' ? (
                          <Phone className="h-4 w-4 mr-2" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-2" />
                        )}
                        {booking.mode.replace('_', ' ')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">Reason: </span>
                        <span className="text-gray-600">{booking.reason}</span>
                      </div>
                      {booking.notes.student && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Notes: </span>
                          <span className="text-gray-600">{booking.notes.student}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-2">
                  {booking.status === 'scheduled' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => cancelBooking(booking._id)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  
                  {booking.status === 'completed' && !booking.feedback?.student && (
                    <Button size="sm" variant="outline">
                      <Star className="h-4 w-4 mr-1" />
                      Rate
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {bookings.length === 0 && (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
            <p className="text-gray-500 mb-4">
              Book your first counselling session to get started.
            </p>
            <Button onClick={() => setCurrentView('counsellors')}>
              Book Appointment
            </Button>
          </Card>
        )}
      </div>
    )
  }

  return null
}

