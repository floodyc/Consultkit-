'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function ProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSpace, setShowAddSpace] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [newSpace, setNewSpace] = useState({
    name: '',
    floor_number: 1,
    area: 0,
    ceiling_height: 9,
    occupancy: 0,
    lighting_watts: 0,
  })

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const [projectData, spacesData] = await Promise.all([
        api.getProject(projectId),
        api.getSpaces(projectId),
      ])
      setProject(projectData)
      setSpaces(spacesData)
    } catch (err) {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.createSpace(projectId, newSpace)
      setShowAddSpace(false)
      setNewSpace({
        name: '',
        floor_number: 1,
        area: 0,
        ceiling_height: 9,
        occupancy: 0,
        lighting_watts: 0,
      })
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRunCalculation = async () => {
    if (spaces.length === 0) {
      alert('Please add at least one space before running calculations')
      return
    }

    setCalculating(true)
    try {
      const result = await api.runCalculation(projectId, {
        design_temp_summer: 95,
        design_temp_winter: 5,
      })
      alert('Calculation completed! Check your results.')
      // In a real app, navigate to results page
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCalculating(false)
    }
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
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {project?.name}
              </h1>
            </div>
            <button
              onClick={handleRunCalculation}
              disabled={calculating || spaces.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculating ? 'Calculating...' : '🧮 Run Calculation'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Project Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Location:</span>{' '}
                <span className="font-medium">
                  {project?.location || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Building Type:</span>{' '}
                <span className="font-medium capitalize">
                  {project?.building_type}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Description:</span>{' '}
                <span className="font-medium">
                  {project?.description || 'No description'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Spaces ({spaces.length})
            </h2>
            <button
              onClick={() => setShowAddSpace(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              + Add Space
            </button>
          </div>

          {showAddSpace && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Add New Space/Room</h3>
                <form onSubmit={handleAddSpace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSpace.name}
                      onChange={(e) =>
                        setNewSpace({ ...newSpace, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Conference Room A"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Number *
                      </label>
                      <input
                        type="number"
                        required
                        value={newSpace.floor_number}
                        onChange={(e) =>
                          setNewSpace({
                            ...newSpace,
                            floor_number: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Area (sq ft) *
                      </label>
                      <input
                        type="number"
                        required
                        value={newSpace.area}
                        onChange={(e) =>
                          setNewSpace({
                            ...newSpace,
                            area: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ceiling Height (ft) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newSpace.ceiling_height}
                      onChange={(e) =>
                        setNewSpace({
                          ...newSpace,
                          ceiling_height: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupancy
                      </label>
                      <input
                        type="number"
                        value={newSpace.occupancy}
                        onChange={(e) =>
                          setNewSpace({
                            ...newSpace,
                            occupancy: parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lighting (W)
                      </label>
                      <input
                        type="number"
                        value={newSpace.lighting_watts}
                        onChange={(e) =>
                          setNewSpace({
                            ...newSpace,
                            lighting_watts: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Add Space
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSpace(false)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {spaces.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 text-lg mb-4">No spaces yet</p>
              <p className="text-gray-400">
                Add rooms/spaces to calculate HVAC loads
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Floor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area (sq ft)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Height (ft)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Occupancy
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spaces.map((space) => (
                    <tr key={space.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {space.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {space.floor_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {space.area}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {space.ceiling_height}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {space.occupancy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
