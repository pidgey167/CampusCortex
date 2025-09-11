'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  BookOpen, 
  Play, 
  Headphones, 
  FileText, 
  Link, 
  Search, 
  Filter, 
  Star, 
  Eye, 
  Download, 
  Heart,
  Clock,
  User,
  Globe,
  ChevronRight,
  PlayCircle,
  Volume2
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Resource {
  _id: string
  title: string
  description: string
  type: 'video' | 'audio' | 'article' | 'document' | 'link' | 'exercise' | 'meditation'
  category: string
  language: string
  content: {
    url: string
    duration: number
    fileSize: number
    format: string
    thumbnail?: string
  }
  tags: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  author: {
    name: string
    credentials?: string
    organization?: string
  }
  metadata: {
    views: number
    likes: number
    downloads: number
    rating: {
      average: number
      count: number
    }
  }
  isFeatured: boolean
  accessibility: {
    hasSubtitles: boolean
    hasTranscript: boolean
    isAudioDescribed: boolean
  }
}

const resourceTypes = [
  { value: 'video', label: 'Videos', icon: Play, color: 'text-red-600' },
  { value: 'audio', label: 'Audio', icon: Headphones, color: 'text-blue-600' },
  { value: 'article', label: 'Articles', icon: FileText, color: 'text-green-600' },
  { value: 'document', label: 'Documents', icon: BookOpen, color: 'text-purple-600' },
  { value: 'exercise', label: 'Exercises', icon: PlayCircle, color: 'text-orange-600' },
  { value: 'meditation', label: 'Meditations', icon: Volume2, color: 'text-indigo-600' }
]

const categories = [
  { value: 'stress_management', label: 'Stress Management', icon: '😌' },
  { value: 'anxiety_relief', label: 'Anxiety Relief', icon: '🧘' },
  { value: 'sleep_hygiene', label: 'Sleep Hygiene', icon: '😴' },
  { value: 'mindfulness', label: 'Mindfulness', icon: '🧠' },
  { value: 'crisis_support', label: 'Crisis Support', icon: '🚨' },
  { value: 'academic_stress', label: 'Academic Stress', icon: '📚' },
  { value: 'relationships', label: 'Relationships', icon: '💕' },
  { value: 'general_wellness', label: 'General Wellness', icon: '🌟' }
]

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'اردو', flag: '🇮🇳' }
]

export function ResourceHub() {
  const { user } = useAuth()
  const [resources, setResources] = useState<Resource[]>([])
  const [featuredResources, setFeaturedResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState(user?.preferences?.language || 'en')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadResources()
    loadFeaturedResources()
  }, [searchTerm, selectedType, selectedCategory, selectedLanguage, selectedDifficulty])

  const loadResources = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedType) params.append('type', selectedType)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedLanguage) params.append('language', selectedLanguage)
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty)
      
      const response = await api.get(`/resources?${params.toString()}`)
      if (response.data.success) {
        setResources(response.data.data.resources)
      }
    } catch (error) {
      console.error('Failed to load resources:', error)
      toast.error('Failed to load resources')
    } finally {
      setLoading(false)
    }
  }

  const loadFeaturedResources = async () => {
    try {
      const response = await api.get('/resources/popular?limit=6')
      if (response.data.success) {
        setFeaturedResources(response.data.data.resources)
      }
    } catch (error) {
      console.error('Failed to load featured resources:', error)
    }
  }

  const likeResource = async (resourceId: string) => {
    try {
      const response = await api.post(`/resources/${resourceId}/like`)
      if (response.data.success) {
        toast.success('Resource liked!')
        loadResources()
        loadFeaturedResources()
      }
    } catch (error) {
      console.error('Failed to like resource:', error)
      toast.error('Failed to like resource')
    }
  }

  const rateResource = async (resourceId: string, rating: number) => {
    try {
      const response = await api.post(`/resources/${resourceId}/rate`, { rating })
      if (response.data.success) {
        toast.success('Resource rated!')
        loadResources()
        loadFeaturedResources()
      }
    } catch (error) {
      console.error('Failed to rate resource:', error)
      toast.error('Failed to rate resource')
    }
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = resourceTypes.find(t => t.value === type)
    return typeConfig ? typeConfig.icon : BookOpen
  }

  const getTypeColor = (type: string) => {
    const typeConfig = resourceTypes.find(t => t.value === type)
    return typeConfig ? typeConfig.color : 'text-gray-600'
  }

  const getCategoryIcon = (category: string) => {
    return categories.find(cat => cat.value === category)?.icon || '🌟'
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || 'General'
  }

  const getLanguageName = (code: string) => {
    return languages.find(lang => lang.code === code)?.name || 'English'
  }

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const TypeIcon = getTypeIcon(resource.type)
    const typeColor = getTypeColor(resource.type)

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
        <div className="relative">
          {resource.content.thumbnail ? (
            <img
              src={resource.content.thumbnail}
              alt={resource.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-t-lg flex items-center justify-center">
              <TypeIcon className={`h-16 w-16 ${typeColor}`} />
            </div>
          )}
          
          {resource.isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
              Featured
            </div>
          )}
          
          <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {formatDuration(resource.content.duration)}
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <TypeIcon className={`h-5 w-5 ${typeColor}`} />
              <span className="text-sm text-gray-500 capitalize">{resource.type}</span>
            </div>
            <div className="flex items-center space-x-1">
              {renderStars(resource.metadata.rating.average)}
              <span className="text-sm text-gray-500 ml-1">
                ({resource.metadata.rating.count})
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {resource.title}
          </h3>
          
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {resource.description}
          </p>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <span className="flex items-center">
              <span className="mr-1">{getCategoryIcon(resource.category)}</span>
              {getCategoryLabel(resource.category)}
            </span>
            <span className="flex items-center">
              <Globe className="h-4 w-4 mr-1" />
              {getLanguageName(resource.language)}
            </span>
          </div>

          {resource.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  +{resource.tags.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                {resource.metadata.views}
              </span>
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {resource.metadata.likes}
              </span>
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-1" />
                {resource.metadata.downloads}
              </span>
            </div>
            <Button size="sm" variant="outline">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Hub</h1>
          <p className="text-gray-600 mt-2">
            Access mental health resources, guided meditations, articles, and more.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List
          </Button>
        </div>
      </div>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Resources</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredResources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full"
            >
              <option value="">All Types</option>
              {resourceTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.icon} {category.label}
              </option>
            ))}
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.flag} {lang.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Resources Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => (
            <ResourceCard key={resource._id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource._id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {React.createElement(getTypeIcon(resource.type), {
                    className: `h-8 w-8 ${getTypeColor(resource.type)}`
                  })}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{resource.title}</h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      {renderStars(resource.metadata.rating.average)}
                      <span className="text-sm text-gray-500 ml-1">
                        ({resource.metadata.rating.count})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="mr-1">{getCategoryIcon(resource.category)}</span>
                        {getCategoryLabel(resource.category)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(resource.content.duration)}
                      </span>
                      <span className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {resource.metadata.views}
                      </span>
                    </div>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {resources.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedType || selectedCategory 
              ? "Try adjusting your search or filters."
              : "Resources will appear here once they're added."
            }
          </p>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading resources...</p>
        </div>
      )}
    </div>
  )
}
