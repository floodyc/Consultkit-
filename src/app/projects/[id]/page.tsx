'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function ProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // GEM-AI state
  const [showGemAI, setShowGemAI] = useState(false)
  const [uploadingFloorplan, setUploadingFloorplan] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<any>(null)
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null)
  const [extractionParams, setExtractionParams] = useState({
    pixels_per_metre: 50,
    floor_height_m: 3.0,
    detect_openings: true,
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

  // GEM-AI handlers
  const handleFloorplanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, TIFF, BMP) or PDF')
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB')
      return
    }

    setFloorplanFile(file)
    setUploadingFloorplan(true)
    setExtracting(true)

    try {
      // Step 1: Upload floorplan
      const uploadResult = await api.uploadFloorplan(projectId, file)

      // Step 2: Extract geometry
      const extractResult = await api.extractGeometry(
        uploadResult.file_id,
        projectId,
        extractionParams
      )

      console.log('[EXTRACTION] Full result:', extractResult)
      console.log('[EXTRACTION] Debug images keys:', Object.keys(extractResult.debug_images || {}))
      console.log('[EXTRACTION] Has rectangles?', !!extractResult.debug_images?.rectangles)
      console.log('[EXTRACTION] Has binary?', !!extractResult.debug_images?.binary)
      console.log('[EXTRACTION] Rectangles length:', extractResult.debug_images?.rectangles?.length || 0)

      setExtractionResult(extractResult)
      setUploadingFloorplan(false)
      setExtracting(false)
    } catch (err: any) {
      console.error('Floorplan processing error:', err)

      // Format error message
      let errorMessage = 'Failed to process floorplan'
      if (err.message) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      }

      alert(errorMessage)
      setUploadingFloorplan(false)
      setExtracting(false)
      setFloorplanFile(null)
    }
  }

  const handleApplyExtraction = async () => {
    if (!extractionResult) return

    try {
      await api.applyGeometryToProject(projectId, extractionResult)
      setShowGemAI(false)
      setExtractionResult(null)
      setFloorplanFile(null)
      loadData()
      alert(`Successfully added ${extractionResult.rooms?.length || 0} spaces from floorplan!`)
    } catch (err: any) {
      alert(err.message || 'Failed to apply geometry')
    }
  }

  const handleCancelExtraction = () => {
    setShowGemAI(false)
    setExtractionResult(null)
    setFloorplanFile(null)
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

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600"
            >
              Overview
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}/settings`)}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Settings
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}/results`)}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Results
            </button>
          </nav>
        </div>
      </div>

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

          {/* GEM-AI Floorplan Upload Section */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 mb-6 border-2 border-indigo-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  🤖 GEM-AI Geometry Extraction
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload a floorplan image and let AI extract room geometry automatically
                </p>
              </div>
              {!showGemAI && (
                <button
                  onClick={() => setShowGemAI(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md"
                >
                  📤 Upload Floorplan
                </button>
              )}
            </div>

            {showGemAI && (
              <div className="mt-4 space-y-4">
                {/* Extraction Parameters */}
                <div className="bg-white rounded-lg p-4 border border-indigo-200">
                  <h4 className="font-semibold text-gray-900 mb-3">⚙️ Extraction Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Scale (pixels per meter) *
                      </label>
                      <input
                        type="number"
                        value={extractionParams.pixels_per_metre}
                        onChange={(e) => setExtractionParams({
                          ...extractionParams,
                          pixels_per_metre: parseFloat(e.target.value) || 50
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        min="1"
                        step="1"
                        disabled={uploadingFloorplan || extracting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How many pixels = 1 meter in your drawing
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Height (m)
                      </label>
                      <input
                        type="number"
                        value={extractionParams.floor_height_m}
                        onChange={(e) => setExtractionParams({
                          ...extractionParams,
                          floor_height_m: parseFloat(e.target.value) || 3.0
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        min="2"
                        max="10"
                        step="0.1"
                        disabled={uploadingFloorplan || extracting}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ceiling height for volume calculation
                      </p>
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 pt-7">
                        <input
                          type="checkbox"
                          checked={extractionParams.detect_openings}
                          onChange={(e) => setExtractionParams({
                            ...extractionParams,
                            detect_openings: e.target.checked
                          })}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          disabled={uploadingFloorplan || extracting}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Detect doors/windows
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Experimental feature
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> To find your scale, measure a known distance in your drawing (e.g., a 5m wall)
                      and count the pixels, then divide pixels by meters (e.g., 250px ÷ 5m = 50 pixels/meter).
                    </p>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/tiff,image/bmp,application/pdf"
                  onChange={handleFloorplanUpload}
                  className="hidden"
                  disabled={uploadingFloorplan}
                />

                {!extractionResult ? (
                  <div>
                    <div
                      onClick={() => !uploadingFloorplan && !extracting && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-white"
                    >
                      {uploadingFloorplan || extracting ? (
                        <div className="space-y-3">
                          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-lg font-semibold text-gray-900">
                            {uploadingFloorplan ? '📤 Uploading floorplan...' : '🤖 Extracting geometry...'}
                          </p>
                          <p className="text-sm text-gray-600">
                            This may take a few seconds
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-6xl">📋</div>
                          <p className="text-lg font-semibold text-gray-900">
                            Click to upload floorplan
                          </p>
                          <p className="text-sm text-gray-600">
                            Supports PNG, JPG, TIFF, BMP, PDF (max 50MB)
                          </p>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleCancelExtraction}
                      className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-indigo-200">
                      <h4 className="font-semibold text-lg mb-3">✅ Extraction Complete!</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        <div className="bg-green-50 p-3 rounded">
                          <p className="text-gray-600">Rooms Detected</p>
                          <p className="text-2xl font-bold text-green-600">
                            {extractionResult.rooms?.length || 0}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded">
                          <p className="text-gray-600">Total Area</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {extractionResult.total_area_m2?.toFixed(1) || 0} m²
                          </p>
                        </div>
                      </div>

                      {extractionResult.debug_images?.rectangles && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Detected Rooms Preview:</p>
                          <img
                            src={`data:image/png;base64,${extractionResult.debug_images.rectangles}`}
                            alt="Detected rooms"
                            className="w-full rounded border border-gray-300"
                          />
                        </div>
                      )}

                      {extractionResult.debug_images?.binary && (
                        <details className="mb-4">
                          <summary className="text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                            Show Binary Threshold Image
                          </summary>
                          <img
                            src={`data:image/png;base64,${extractionResult.debug_images.binary}`}
                            alt="Binary threshold"
                            className="w-full rounded border border-gray-300 mt-2"
                          />
                        </details>
                      )}

                      {extractionResult.debug_images?.openings && (
                        <details className="mb-4">
                          <summary className="text-sm font-medium text-gray-700 mb-2 cursor-pointer">
                            Show Detected Openings (Doors/Windows)
                          </summary>
                          <img
                            src={`data:image/png;base64,${extractionResult.debug_images.openings}`}
                            alt="Detected openings"
                            className="w-full rounded border border-gray-300 mt-2"
                          />
                        </details>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={handleApplyExtraction}
                          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                        >
                          ✅ Apply to Project
                        </button>
                        <button
                          onClick={handleCancelExtraction}
                          className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Spaces ({spaces.length})
            </h2>
            <button
              onClick={() => setShowAddSpace(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              ✏️ Add Space Manually
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
