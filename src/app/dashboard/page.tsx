'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    location: '',
    building_type: 'office',
  })
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [renameValue, setRenameValue] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userData, projectsData] = await Promise.all([
        api.getMe(),
        api.getProjects(),
      ])
      setUser(userData)
      setProjects(projectsData)
    } catch (err) {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createProject(newProject)
      setShowNewProject(false)
      setNewProject({ name: '', description: '', location: '', building_type: 'office' })
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleLogout = () => {
    api.clearToken()
    router.push('/')
  }

  const handleRenameProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProject) return

    try {
      await api.updateProject(selectedProject.id, { name: renameValue })
      setShowRenameModal(false)
      setSelectedProject(null)
      setRenameValue('')
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to rename project')
    }
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return

    try {
      await api.deleteProject(selectedProject.id)
      setShowDeleteModal(false)
      setSelectedProject(null)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Failed to delete project')
    }
  }

  const openRenameModal = (project: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProject(project)
    setRenameValue(project.name)
    setShowRenameModal(true)
  }

  const openDeleteModal = (project: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">IES GEM-AI Loads Tool</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Projects
                </button>
                <button
                  onClick={() => router.push('/billing')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Billing
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.full_name} • {user?.credits} credits
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Your Projects</h2>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              + New Project
            </button>
          </div>

          {showNewProject && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Create New Project</h3>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProject.name}
                      onChange={(e) =>
                        setNewProject({ ...newProject, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Office Building A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) =>
                        setNewProject({ ...newProject, description: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      rows={3}
                      placeholder="3-story office building..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newProject.location}
                      onChange={(e) =>
                        setNewProject({ ...newProject, location: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="New York, NY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Building Type
                    </label>
                    <select
                      value={newProject.building_type}
                      onChange={(e) =>
                        setNewProject({ ...newProject, building_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="office">Office</option>
                      <option value="residential">Residential</option>
                      <option value="retail">Retail</option>
                      <option value="industrial">Industrial</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                    </select>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewProject(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Rename Project Modal */}
          {showRenameModal && selectedProject && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4">Rename Project</h3>
                <form onSubmit={handleRenameProject} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Project Name
                    </label>
                    <input
                      type="text"
                      required
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter new name"
                      autoFocus
                    />
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRenameModal(false)
                        setSelectedProject(null)
                        setRenameValue('')
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Project Modal */}
          {showDeleteModal && selectedProject && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h3 className="text-xl font-bold mb-4 text-red-600">Delete Project</h3>
                <p className="text-gray-700 mb-4">
                  Are you sure you want to delete <strong>{selectedProject.name}</strong>?
                  This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteProject}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setSelectedProject(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No projects yet</p>
              <p className="text-gray-400">Create your first project to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 relative"
                >
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={(e) => openRenameModal(project, e)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                      title="Rename project"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => openDeleteModal(project, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Project content - clickable */}
                  <div onClick={() => router.push(`/projects/${project.id}`)} className="cursor-pointer">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 pr-20">
                      {project.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {project.description || 'No description'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{project.location || 'No location'}</span>
                      <span className="capitalize">{project.building_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
