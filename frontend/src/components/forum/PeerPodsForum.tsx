'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MessageCircle, 
  Heart, 
  ThumbsUp, 
  Eye,
  Flag,
  Pin,
  MoreHorizontal,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Forum {
  _id: string
  name: string
  description: string
  category: string
  memberCount: number
  postCount: number
  lastActivity: string
  createdBy: {
    firstName: string
    lastName: string
  }
  members: Array<{
    user: string
    isActive: boolean
  }>
  settings: {
    isPublic: boolean
    allowAnonymous: boolean
  }
}

interface ForumPost {
  _id: string
  title: string
  content: string
  authorNickname: string
  isAnonymous: boolean
  createdAt: string
  views: number
  reactions: Array<{
    type: string
    user: string
  }>
  comments: Array<{
    content: string
    authorNickname: string
    timestamp: string
  }>
  isPinned: boolean
  tags: string[]
}

const categories = [
  { value: 'stress', label: 'Stress Management', icon: '😰' },
  { value: 'sleep', label: 'Sleep Issues', icon: '😴' },
  { value: 'homesickness', label: 'Homesickness', icon: '🏠' },
  { value: 'exam_stress', label: 'Exam Stress', icon: '📚' },
  { value: 'relationships', label: 'Relationships', icon: '💕' },
  { value: 'academic', label: 'Academic Support', icon: '🎓' },
  { value: 'general', label: 'General Support', icon: '🤝' },
  { value: 'crisis_support', label: 'Crisis Support', icon: '🚨' }
]

export function PeerPodsForum() {
  const { user } = useAuth()
  const [forums, setForums] = useState<Forum[]>([])
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null)
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showCreateForum, setShowCreateForum] = useState(false)
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '', isAnonymous: true })

  useEffect(() => {
    loadForums()
  }, [searchTerm, selectedCategory])

  const loadForums = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedCategory) params.append('category', selectedCategory)
      
      const response = await api.get(`/forum?${params.toString()}`)
      if (response.data.success) {
        setForums(response.data.data.forums)
      }
    } catch (error) {
      console.error('Failed to load forums:', error)
      toast.error('Failed to load forums')
    } finally {
      setLoading(false)
    }
  }

  const loadForumPosts = async (forumId: string) => {
    try {
      setLoading(true)
      const response = await api.get(`/forum/${forumId}/posts`)
      if (response.data.success) {
        setPosts(response.data.data.posts)
      }
    } catch (error) {
      console.error('Failed to load forum posts:', error)
      toast.error('Failed to load forum posts')
    } finally {
      setLoading(false)
    }
  }

  const joinForum = async (forumId: string) => {
    try {
      const response = await api.post(`/forum/${forumId}/join`)
      if (response.data.success) {
        toast.success('Joined forum successfully')
        loadForums()
        if (selectedForum?._id === forumId) {
          loadForumPosts(forumId)
        }
      }
    } catch (error) {
      console.error('Failed to join forum:', error)
      toast.error('Failed to join forum')
    }
  }

  const leaveForum = async (forumId: string) => {
    try {
      const response = await api.post(`/forum/${forumId}/leave`)
      if (response.data.success) {
        toast.success('Left forum successfully')
        loadForums()
        if (selectedForum?._id === forumId) {
          setSelectedForum(null)
          setPosts([])
        }
      }
    } catch (error) {
      console.error('Failed to leave forum:', error)
      toast.error('Failed to leave forum')
    }
  }

  const createPost = async () => {
    if (!selectedForum || !newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const response = await api.post(`/forum/${selectedForum._id}/posts`, newPost)
      if (response.data.success) {
        toast.success('Post created successfully')
        setNewPost({ title: '', content: '', isAnonymous: true })
        setShowCreatePost(false)
        loadForumPosts(selectedForum._id)
      }
    } catch (error) {
      console.error('Failed to create post:', error)
      toast.error('Failed to create post')
    }
  }

  const isMember = (forum: Forum) => {
    return forum.members.some(member => 
      member.user === user?._id && member.isActive
    )
  }

  const getCategoryIcon = (category: string) => {
    return categories.find(cat => cat.value === category)?.icon || '🤝'
  }

  const getCategoryLabel = (category: string) => {
    return categories.find(cat => cat.value === category)?.label || 'General'
  }

  if (selectedForum) {
    return (
      <div className="space-y-6">
        {/* Forum Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getCategoryIcon(selectedForum.category)}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{selectedForum.name}</h1>
                <p className="text-gray-600">{selectedForum.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {selectedForum.memberCount} members
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {selectedForum.postCount} posts
                  </span>
                  <span>{getCategoryLabel(selectedForum.category)}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setSelectedForum(null)}
              >
                Back to Forums
              </Button>
              {isMember(selectedForum) ? (
                <Button
                  variant="outline"
                  onClick={() => leaveForum(selectedForum._id)}
                >
                  <UserMinus className="h-4 w-4 mr-2" />
                  Leave
                </Button>
              ) : (
                <Button
                  onClick={() => joinForum(selectedForum._id)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Join
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {isMember(selectedForum) && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Create New Post</h3>
                <Button
                  size="sm"
                  onClick={() => setShowCreatePost(!showCreatePost)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Post
                </Button>
              </div>
              
              {showCreatePost && (
                <div className="space-y-4">
                  <Input
                    placeholder="Post title..."
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  />
                  <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Share your thoughts..."
                    rows={4}
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPost.isAnonymous}
                        onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Post anonymously</span>
                    </label>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreatePost(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createPost}>
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {posts.map((post) => (
            <Card key={post._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {post.authorNickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{post.authorNickname}</span>
                      {post.isAnonymous && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">Anonymous</span>
                      )}
                      {post.isPinned && (
                        <Pin className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center space-x-4">
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-600">
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.reactions.filter(r => r.type === 'like').length}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-600">
                    <Heart className="h-4 w-4" />
                    <span>{post.reactions.filter(r => r.type === 'support').length}</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 hover:text-primary-600">
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments.length}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Eye className="h-4 w-4" />
                  <span>{post.views}</span>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <Card className="p-8 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-500">
                {isMember(selectedForum) 
                  ? "Be the first to share something in this forum!"
                  : "Join this forum to see and create posts."
                }
              </p>
            </Card>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Peer Pods</h1>
          <p className="text-gray-600 mt-2">
            Connect with peers in themed support groups. Share experiences, get support, and help others.
          </p>
        </div>
        <Button onClick={() => setShowCreateForum(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Forum
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search forums..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
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
          </div>
        </div>
      </Card>

      {/* Forums Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums.map((forum) => (
          <Card key={forum._id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">{getCategoryIcon(forum.category)}</span>
              </div>
              <div className="flex items-center space-x-1">
                {isMember(forum) && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Member
                  </span>
                )}
                <button className="p-1 hover:bg-gray-100 rounded">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="font-semibold text-lg mb-2">{forum.name}</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{forum.description}</p>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {forum.memberCount}
              </span>
              <span className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {forum.postCount}
              </span>
              <span>{getCategoryLabel(forum.category)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                Created by {forum.createdBy.firstName} {forum.createdBy.lastName}
              </span>
              <Button
                size="sm"
                variant={isMember(forum) ? "outline" : "primary"}
                onClick={() => setSelectedForum(forum)}
              >
                {isMember(forum) ? 'View' : 'Join'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {forums.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forums found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? "Try adjusting your search or filters."
              : "Be the first to create a forum for your peers!"
            }
          </p>
          <Button onClick={() => setShowCreateForum(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Forum
          </Button>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading forums...</p>
        </div>
      )}
    </div>
  )
}


