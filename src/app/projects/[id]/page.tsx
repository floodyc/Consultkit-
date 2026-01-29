'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'
import { applySpaceTypeDefaults, type DesignStandard } from '@/lib/spaceTypeDefaults'
import dynamic from 'next/dynamic'

// Dynamically import OBJViewer to avoid SSR issues with Three.js
const OBJViewer = dynamic(() => import('@/components/OBJViewer'), { ssr: false })

export default function ProjectDetail() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<any>(null)
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddSpace, setShowAddSpace] = useState(false)
  const [showEditSpace, setShowEditSpace] = useState(false)
  const [showBulkEdit, setShowBulkEdit] = useState(false)
  const [editingSpace, setEditingSpace] = useState<any>(null)
  const [selectedSpaces, setSelectedSpaces] = useState<Set<string>>(new Set())
  const [bulkEditData, setBulkEditData] = useState<any>({})
  const [calculating, setCalculating] = useState(false)
  const [calculationResults, setCalculationResults] = useState<any>(null)
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set())
  const [designStandard, setDesignStandard] = useState<DesignStandard>('ASHRAE_90_1')
  const [newSpace, setNewSpace] = useState({
    name: '',
    floor_number: 1,
    area: 0,
    ceiling_height: 9,
    occupancy: 0,
    lighting_watts: 0,
    space_type: 'office',
  })

  // GEM-AI state
  const [showGemAI, setShowGemAI] = useState(false)
  const [uploadingFloorplan, setUploadingFloorplan] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractionResult, setExtractionResult] = useState<any>(null)
  const [extractionApplied, setExtractionApplied] = useState(false)
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
      // Load design standard from project (default to ASHRAE 90.1)
      setDesignStandard(projectData.design_standard || 'ASHRAE_90_1')

      // Restore extraction result if it exists (makes floorplan/geometry persistent)
      if (projectData.extraction_result) {
        setExtractionResult(projectData.extraction_result)
        setExtractionApplied(true)
        setShowGemAI(true)  // Keep GEM-AI section open to show geometry
      }

      // Restore calculation results if they exist
      if (projectData.calculation_results) {
        setCalculationResults(projectData.calculation_results)
      }
    } catch (err) {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Apply defaults when space type changes
  const applyDefaultsForSpaceType = (spaceType: string, area: number, currentSpace: any) => {
    const defaults = applySpaceTypeDefaults(spaceType, area, designStandard)
    return {
      ...currentSpace,
      space_type: spaceType,
      ...defaults,
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
        space_type: 'office',
      })
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleEditSpace = (space: any) => {
    setEditingSpace({ ...space })
    setShowEditSpace(true)
  }

  const handleUpdateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.updateSpace(projectId, editingSpace.id, editingSpace)
      setShowEditSpace(false)
      setEditingSpace(null)
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
      console.log('✅ Calculation results received:', result)
      setCalculationResults(result)
      alert(`Calculation completed!\n\nTotal Cooling: ${result.building_summary.peak_cooling_total.toFixed(1)} W\nTotal Heating: ${result.building_summary.peak_heating.toFixed(1)} W\n\nScroll down to see detailed results.`)
    } catch (err: any) {
      console.error('❌ Calculation error:', err)
      alert(err.message)
    } finally {
      setCalculating(false)
    }
  }

  const toggleSpaceExpanded = (spaceId: string) => {
    const newExpanded = new Set(expandedSpaces)
    if (newExpanded.has(spaceId)) {
      newExpanded.delete(spaceId)
    } else {
      newExpanded.add(spaceId)
    }
    setExpandedSpaces(newExpanded)
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
    setExtractionApplied(false) // Reset applied state for new upload

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
      // Don't close GEM-AI section - keep geometry visible
      // Don't clear extractionResult - keep geometry visible
      setExtractionApplied(true)
      setFloorplanFile(null)
      loadData()
      alert(`Successfully added ${extractionResult.rooms?.length || 0} spaces from floorplan!`)
    } catch (err: any) {
      alert(err.message || 'Failed to apply geometry')
    }
  }

  const toggleSpaceSelection = (spaceId: string) => {
    const newSelected = new Set(selectedSpaces)
    if (newSelected.has(spaceId)) {
      newSelected.delete(spaceId)
    } else {
      newSelected.add(spaceId)
    }
    setSelectedSpaces(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedSpaces.size === spaces.length) {
      setSelectedSpaces(new Set())
    } else {
      setSelectedSpaces(new Set(spaces.map(s => s.id)))
    }
  }

  const handleBulkEdit = () => {
    if (selectedSpaces.size === 0) {
      alert('Please select at least one space')
      return
    }
    setBulkEditData({})
    setShowBulkEdit(true)
  }

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedSpaces.size === 0) return

    try {
      // Update each selected space
      const updatePromises = Array.from(selectedSpaces).map(spaceId => {
        const space = spaces.find(s => s.id === spaceId)
        if (!space) return Promise.resolve()

        // Merge bulk edit data with existing space data
        const updatedSpace = { ...space, ...bulkEditData }
        return api.updateSpace(projectId, spaceId, updatedSpace)
      })

      await Promise.all(updatePromises)

      setShowBulkEdit(false)
      setBulkEditData({})
      setSelectedSpaces(new Set())
      loadData()
      alert(`Successfully updated ${selectedSpaces.size} spaces`)
    } catch (err: any) {
      alert(err.message)
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
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">Project Details</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Design Standard:</label>
                <select
                  value={designStandard}
                  onChange={(e) => setDesignStandard(e.target.value as DesignStandard)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ASHRAE_90_1">ASHRAE 90.1-2019</option>
                  <option value="NECB_2020">NECB 2020</option>
                </select>
              </div>
            </div>
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
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Design Standard:</strong> {designStandard === 'ASHRAE_90_1' ? 'ASHRAE 90.1-2019' : 'NECB 2020'} defaults will be applied to new spaces (occupancy, lighting, equipment loads). You can override these values for any space.
              </p>
            </div>
          </div>

          {/* Calculation Results Summary */}
          {calculationResults && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 mb-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <span className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                  Calculation Results Summary
                </h3>
                <button
                  onClick={() => router.push(`/projects/${projectId}/results`)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md flex items-center"
                >
                  View Full Results
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Total Area</p>
                    <span className="text-xl">📐</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {calculationResults.building_summary?.total_floor_area?.toFixed(1) || '0.0'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">m²</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 shadow-sm border border-cyan-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-cyan-700 font-semibold uppercase tracking-wide">Peak Cooling</p>
                    <span className="text-xl">❄️</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-700">
                    {((calculationResults.building_summary?.peak_cooling_total || 0) / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-cyan-600 mt-1">
                    kW ({((calculationResults.building_summary?.peak_cooling_total || 0) / 3517).toFixed(1)} tons)
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 shadow-sm border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Peak Heating</p>
                    <span className="text-xl">🔥</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">
                    {((calculationResults.building_summary?.peak_heating || 0) / 1000).toFixed(1)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">kW</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 shadow-sm border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Spaces</p>
                    <span className="text-xl">🏢</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {calculationResults.space_results?.length || 0}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">analyzed</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg p-4 border border-green-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cooling Intensity:</span>
                    <span className="font-bold text-cyan-700">
                      {calculationResults.building_summary?.cooling_w_per_m2?.toFixed(1) || '0.0'} W/m²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heating Intensity:</span>
                    <span className="font-bold text-orange-700">
                      {calculationResults.building_summary?.heating_w_per_m2?.toFixed(1) || '0.0'} W/m²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calculated:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(calculationResults.calculated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

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

                      {/* 3D Visualization */}
                      {extractionResult.obj_content && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">🎨 3D Preview:</p>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <OBJViewer
                              objContent={extractionResult.obj_content}
                              rooms={extractionResult.rooms.map((room: any) => {
                                // Enrich room data with load values from calculation results if available
                                if (calculationResults) {
                                  const spaceResult = calculationResults.space_results.find(
                                    (sr: any) => sr.space_name === room.name || sr.space_id === room.id
                                  )
                                  if (spaceResult) {
                                    return {
                                      ...room,
                                      cooling_load: spaceResult.peak_cooling_total,
                                      heating_load: spaceResult.peak_heating,
                                    }
                                  }
                                }
                                return room
                              })}
                              width={600}
                              height={400}
                              showLoads={!!calculationResults}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Preview your extracted geometry in 3D before applying to project
                          </p>
                        </div>
                      )}

                      <div className="flex space-x-3">
                        {!extractionApplied ? (
                          <>
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
                          </>
                        ) : (
                          <div className="flex-1 px-4 py-3 bg-blue-50 text-blue-800 rounded-lg border-2 border-blue-200 font-semibold text-center">
                            ✓ Applied to Project - Spaces added to table below
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Spaces ({spaces.length})
              </h2>
              {selectedSpaces.size > 0 && (
                <span className="text-sm text-gray-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {selectedSpaces.size} selected
                </span>
              )}
            </div>
            <div className="flex space-x-2">
              {selectedSpaces.size > 0 && (
                <button
                  onClick={handleBulkEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  ✏️ Edit Selected ({selectedSpaces.size})
                </button>
              )}
              <button
                onClick={() => setShowAddSpace(true)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                ➕ Add Space Manually
              </button>
            </div>
          </div>

          {showEditSpace && editingSpace && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Edit Space: {editingSpace.name}</h3>
                <form onSubmit={handleUpdateSpace} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingSpace.name}
                      onChange={(e) =>
                        setEditingSpace({ ...editingSpace, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Conference Room A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Type *
                      <span className="text-xs text-gray-500 ml-2">(auto-fills defaults)</span>
                    </label>
                    <select
                      required
                      value={editingSpace.space_type || 'office'}
                      onChange={(e) =>
                        setEditingSpace(
                          applyDefaultsForSpaceType(e.target.value, editingSpace.area, editingSpace)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="office">Office</option>
                      <option value="office_enclosed">Office (Enclosed)</option>
                      <option value="office_open">Office (Open Plan)</option>
                      <option value="conference">Conference Room</option>
                      <option value="meeting">Meeting Room</option>
                      <option value="classroom">Classroom</option>
                      <option value="lobby">Lobby</option>
                      <option value="corridor">Corridor</option>
                      <option value="restroom">Restroom</option>
                      <option value="storage">Storage</option>
                      <option value="mechanical">Mechanical</option>
                      <option value="server">Server Room</option>
                      <option value="cafeteria">Cafeteria</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="retail">Retail</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Number *
                      </label>
                      <input
                        type="number"
                        required
                        value={editingSpace.floor_number}
                        onChange={(e) =>
                          setEditingSpace({
                            ...editingSpace,
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
                        value={editingSpace.area}
                        onChange={(e) => {
                          const newArea = parseFloat(e.target.value) || 0
                          setEditingSpace(
                            applyDefaultsForSpaceType(editingSpace.space_type, newArea, editingSpace)
                          )
                        }}
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
                      value={editingSpace.ceiling_height}
                      onChange={(e) =>
                        setEditingSpace({
                          ...editingSpace,
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
                        value={editingSpace.occupancy}
                        onChange={(e) =>
                          setEditingSpace({
                            ...editingSpace,
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
                        value={editingSpace.lighting_watts}
                        onChange={(e) =>
                          setEditingSpace({
                            ...editingSpace,
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
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditSpace(false)
                        setEditingSpace(null)
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

          {showBulkEdit && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4">Bulk Edit {selectedSpaces.size} Spaces</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Leave fields empty to keep existing values. Only filled fields will be updated.
                </p>
                <form onSubmit={handleBulkUpdate} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Type
                    </label>
                    <select
                      value={bulkEditData.space_type || ''}
                      onChange={(e) => setBulkEditData({
                        ...bulkEditData,
                        space_type: e.target.value || undefined
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">-- Keep existing --</option>
                      <option value="office">Office</option>
                      <option value="office_enclosed">Office (Enclosed)</option>
                      <option value="office_open">Office (Open Plan)</option>
                      <option value="conference">Conference Room</option>
                      <option value="meeting">Meeting Room</option>
                      <option value="classroom">Classroom</option>
                      <option value="lobby">Lobby</option>
                      <option value="corridor">Corridor</option>
                      <option value="restroom">Restroom</option>
                      <option value="storage">Storage</option>
                      <option value="mechanical">Mechanical</option>
                      <option value="server">Server Room</option>
                      <option value="cafeteria">Cafeteria</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="retail">Retail</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Floor Number
                      </label>
                      <input
                        type="number"
                        value={bulkEditData.floor_number || ''}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          floor_number: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Keep existing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ceiling Height (ft)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={bulkEditData.ceiling_height || ''}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          ceiling_height: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Keep existing"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupancy
                      </label>
                      <input
                        type="number"
                        value={bulkEditData.occupancy || ''}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          occupancy: e.target.value ? parseInt(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Keep existing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lighting (W)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={bulkEditData.lighting_watts || ''}
                        onChange={(e) => setBulkEditData({
                          ...bulkEditData,
                          lighting_watts: e.target.value ? parseFloat(e.target.value) : undefined
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Keep existing"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Update {selectedSpaces.size} Spaces
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBulkEdit(false)
                        setBulkEditData({})
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Type *
                      <span className="text-xs text-gray-500 ml-2">(auto-fills defaults)</span>
                    </label>
                    <select
                      required
                      value={newSpace.space_type || 'office'}
                      onChange={(e) =>
                        setNewSpace(
                          applyDefaultsForSpaceType(e.target.value, newSpace.area, newSpace)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="office">Office</option>
                      <option value="office_enclosed">Office (Enclosed)</option>
                      <option value="office_open">Office (Open Plan)</option>
                      <option value="conference">Conference Room</option>
                      <option value="meeting">Meeting Room</option>
                      <option value="classroom">Classroom</option>
                      <option value="lobby">Lobby</option>
                      <option value="corridor">Corridor</option>
                      <option value="restroom">Restroom</option>
                      <option value="storage">Storage</option>
                      <option value="mechanical">Mechanical</option>
                      <option value="server">Server Room</option>
                      <option value="cafeteria">Cafeteria</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="retail">Retail</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
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
                        onChange={(e) => {
                          const newArea = parseFloat(e.target.value) || 0
                          setNewSpace(
                            applyDefaultsForSpaceType(newSpace.space_type, newArea, newSpace)
                          )
                        }}
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
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedSpaces.size === spaces.length && spaces.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lighting (W)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spaces.map((space) => (
                    <tr
                      key={space.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSpaces.has(space.id)}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleSpaceSelection(space.id)
                          }}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {space.name}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {space.space_type?.replace(/_/g, ' ') || 'office'}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {space.floor_number}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {(space.area || 0).toFixed(1)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {(space.ceiling_height || 0).toFixed(1)}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {space.occupancy || 0}
                      </td>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                        onClick={() => handleEditSpace(space)}
                      >
                        {(space.lighting_watts || 0).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Calculation Results */}
          {calculationResults && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                📊 Calculation Results
              </h2>

              {/* Building Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Building Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Total Cooling Load</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {calculationResults.building_summary.peak_cooling_total.toFixed(1)} W
                    </div>
                    <div className="text-xs text-blue-600">
                      {(calculationResults.building_summary.peak_cooling_total / 3517).toFixed(1)} tons
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-red-600 font-medium">Total Heating Load</div>
                    <div className="text-2xl font-bold text-red-900">
                      {calculationResults.building_summary.peak_heating.toFixed(1)} W
                    </div>
                    <div className="text-xs text-red-600">
                      {(calculationResults.building_summary.peak_heating / 1000).toFixed(1)} kW
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Cooling Intensity</div>
                    <div className="text-2xl font-bold text-green-900">
                      {calculationResults.building_summary.cooling_w_per_m2.toFixed(1)} W/m²
                    </div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Heating Intensity</div>
                    <div className="text-2xl font-bold text-orange-900">
                      {calculationResults.building_summary.heating_w_per_m2.toFixed(1)} W/m²
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Space Results */}
              <div className="space-y-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Detailed Space Results</h3>
                {calculationResults.space_results.map((space: any, idx: number) => {
                  const isExpanded = expandedSpaces.has(space.space_id)
                  return (
                    <div key={idx} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {/* Space Header - Always visible */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSpaceExpanded(space.space_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-md font-semibold text-gray-900">{space.space_name}</h4>
                            <div className="mt-1 grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
                              <div>
                                <span className="text-gray-500">Area:</span>{' '}
                                <span className="font-medium">{space.floor_area.toFixed(1)} m²</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cooling:</span>{' '}
                                <span className="font-medium text-blue-600">{space.peak_cooling_total.toFixed(1)} W</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Heating:</span>{' '}
                                <span className="font-medium text-red-600">{space.peak_heating.toFixed(1)} W</span>
                              </div>
                              <div>
                                <span className="text-gray-500">W/m²:</span>{' '}
                                <span className="font-medium">{space.cooling_w_per_m2.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Airflow:</span>{' '}
                                <span className="font-medium">{space.supply_airflow_cooling.toFixed(1)} m³/s</span>
                              </div>
                              <div>
                                <span className="text-gray-500">CFM:</span>{' '}
                                <span className="font-medium">{(space.supply_airflow_cooling * 2118.88).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 text-gray-400">
                            {isExpanded ? '▼' : '▶'}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Load Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cooling Load Breakdown */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Cooling Load Breakdown
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Sensible:</span>
                                  <span className="font-medium">{space.peak_cooling_sensible.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Latent:</span>
                                  <span className="font-medium">{space.peak_cooling_latent.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                  <span className="text-gray-900">Total:</span>
                                  <span className="text-blue-600">{space.peak_cooling_total.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Tons:</span>
                                  <span className="font-medium">{(space.peak_cooling_total / 3517).toFixed(1)}</span>
                                </div>
                              </div>

                              {/* Load Components */}
                              {space.components && Object.keys(space.components).length > 0 && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">Component Breakdown:</h6>
                                  <div className="space-y-1">
                                    {Object.entries(space.components).map(([key, comp]: [string, any]) => (
                                      <div key={key} className="flex justify-between text-xs">
                                        <span className="text-gray-600" title={comp.description}>{comp.name}:</span>
                                        <span className="font-medium">{comp.total_cooling.toFixed(1)} W</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Heating & Other Info */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                Heating & Ventilation
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Peak Heating:</span>
                                  <span className="font-medium text-red-600">{space.peak_heating.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Heating W/m²:</span>
                                  <span className="font-medium">{space.heating_w_per_m2.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Heating kW:</span>
                                  <span className="font-medium">{(space.peak_heating / 1000).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Outdoor Air:</span>
                                  <span className="font-medium">{space.outdoor_airflow.toFixed(1)} m³/s</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">OA CFM:</span>
                                  <span className="font-medium">{(space.outdoor_airflow * 2118.88).toFixed(1)}</span>
                                </div>
                              </div>

                              {/* Building Envelope */}
                              <div className="mt-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Building Envelope:</h6>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Ext. Wall Area:</span>
                                    <span className="font-medium">{space.exterior_wall_area.toFixed(1)} m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Window Area:</span>
                                    <span className="font-medium">{space.window_area.toFixed(1)} m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Roof Area:</span>
                                    <span className="font-medium">{space.roof_area.toFixed(1)} m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Volume:</span>
                                    <span className="font-medium">{space.volume.toFixed(1)} m³</span>
                                  </div>
                                </div>
                              </div>

                              {/* Peak Conditions */}
                              <div className="mt-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Peak Conditions:</h6>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Peak Hour:</span>
                                    <span className="font-medium">{space.peak_cooling_hour}:00</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Outdoor Temp:</span>
                                    <span className="font-medium">{space.outdoor_temp_at_cooling_peak.toFixed(1)} °C</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Plant Equipment */}
              {calculationResults.plant_results && calculationResults.plant_results.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Plant Equipment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {calculationResults.plant_results.map((plant: any, idx: number) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{plant.plant_name}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Chiller Capacity:</span>
                            <span className="font-medium">{plant.chiller_capacity_tons.toFixed(1)} tons</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Number of Chillers:</span>
                            <span className="font-medium">{plant.num_chillers}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Boiler Capacity:</span>
                            <span className="font-medium">{plant.boiler_capacity_kw.toFixed(1)} kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Number of Boilers:</span>
                            <span className="font-medium">{plant.num_boilers}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
