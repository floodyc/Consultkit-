'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function Results() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('summary')
  const [exporting, setExporting] = useState(false)
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set())
  const [randomSpace, setRandomSpace] = useState<any>(null)

  // Mock results data (will be replaced with API call)
  const mockResults = {
    project_id: projectId,
    project_name: 'Building A',
    calculated_at: '2026-01-17T04:30:00',
    status: 'completed',
    credits_used: 12,

    building_summary: {
      total_floor_area: 1250.5,
      total_volume: 3751.5,
      peak_cooling_sensible: 145280,
      peak_cooling_latent: 32450,
      peak_cooling_total: 177730,
      peak_heating: 198500,
      cooling_w_per_m2: 142.1,
      heating_w_per_m2: 158.7,
    },

    space_results: [
      {
        space_id: '1',
        space_name: 'Conference Room A',
        floor_area: 85.2,
        volume: 255.6,
        peak_cooling_total: 12340,
        peak_heating: 14560,
        supply_airflow_cooling: 1250,
        outdoor_airflow: 180,
      },
      {
        space_id: '2',
        space_name: 'Open Office',
        floor_area: 450.8,
        volume: 1352.4,
        peak_cooling_total: 65200,
        peak_heating: 72800,
        supply_airflow_cooling: 6800,
        outdoor_airflow: 950,
      },
      {
        space_id: '3',
        space_name: 'Reception',
        floor_area: 120.5,
        volume: 361.5,
        peak_cooling_total: 18900,
        peak_heating: 21400,
        supply_airflow_cooling: 1950,
        outdoor_airflow: 250,
      },
    ],

    zone_results: [
      {
        zone_id: '1',
        zone_name: 'Ground Floor',
        total_floor_area: 656.5,
        peak_cooling_total: 96440,
        peak_heating: 108760,
        sized_cooling_load: 110900,
        sized_heating_load: 130500,
      },
      {
        zone_id: '2',
        zone_name: 'First Floor',
        total_floor_area: 594.0,
        peak_cooling_total: 81290,
        peak_heating: 89740,
        sized_cooling_load: 93480,
        sized_heating_load: 107700,
      },
    ],

    system_results: [
      {
        system_id: '1',
        system_name: 'AHU-1 (VAV)',
        system_type: 'VAV with Reheat',
        block_cooling_total: 177730,
        block_heating: 198500,
        sized_cooling_capacity: 204400,
        sized_heating_capacity: 238200,
        total_supply_airflow: 18500,
        cooling_coil_total: 185600,
        heating_coil_load: 210400,
      },
    ],

    plant_results: [
      {
        plant_id: '1',
        plant_name: 'Central Plant',
        chiller_capacity: 204400,
        chiller_capacity_tons: 58.1,
        boiler_capacity: 238200,
        boiler_capacity_kw: 238.2,
        num_chillers: 2,
        num_boilers: 2,
      },
    ],

    warnings: [
      'Some spaces have very high lighting loads. Verify input data.',
      'Zone 2 has limited outdoor air. Consider demand-controlled ventilation.',
    ],
  }

  useEffect(() => {
    loadData()
  }, [projectId])

  const loadData = async () => {
    try {
      const projectData = await api.getProject(projectId)
      setProject(projectData)

      // Load actual calculation results
      try {
        const calculationResults = await api.getCalculationResults(projectId)
        console.log('📊 Loaded calculation results:', calculationResults)
        setResults(calculationResults)

        // Pick a random space for the walkthrough tab
        if (calculationResults.space_results && calculationResults.space_results.length > 0) {
          const randomIndex = Math.floor(Math.random() * calculationResults.space_results.length)
          setRandomSpace(calculationResults.space_results[randomIndex])
        }
      } catch (err: any) {
        console.warn('No calculation results found:', err.message)
        // If no results, show message to user
        setResults(null)
      }
    } catch (err) {
      router.push('/dashboard')
    } finally {
      setLoading(false)
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

  const pickRandomSpace = () => {
    if (results?.space_results && results.space_results.length > 0) {
      const randomIndex = Math.floor(Math.random() * results.space_results.length)
      setRandomSpace(results.space_results[randomIndex])
    }
  }

  const handleExport = async (format: string) => {
    setExporting(true)
    try {
      let blob: Blob
      let filename: string

      // Call appropriate export API based on format
      if (format === 'pdf') {
        blob = await api.exportPDF(projectId)
        filename = `${project?.name || 'project'}_HVACplus_Report.pdf`
      } else if (format === 'excel') {
        blob = await api.exportExcel(projectId)
        filename = `${project?.name || 'project'}_HVACplus_Results.xlsx`
      } else if (format === 'gbxml') {
        blob = await api.exportGbXML(projectId)
        filename = `${project?.name || 'project'}_HVACplus.xml`
      } else {
        throw new Error('Unknown export format')
      }

      // Download the file
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Success message
      alert(`Successfully exported ${format.toUpperCase()} file!`)
    } catch (err: any) {
      console.error('Export error:', err)
      alert(err.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading results...</div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">No calculation results found</p>
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'summary', name: 'Summary', icon: '📊' },
    { id: 'spaces', name: 'Space Results', icon: '🏢' },
    { id: 'walkthrough', name: 'Calculation Walkthrough', icon: '🔬' },
    { id: 'zones', name: 'Zone Results', icon: '🗺️' },
    { id: 'systems', name: 'System Sizing', icon: '❄️' },
    { id: 'plant', name: 'Plant Equipment', icon: '⚡' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="flex items-center text-gray-600 hover:text-indigo-600 font-medium transition-colors group"
              >
                <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                {results.project_name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 disabled:opacity-50 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                📄 PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                📊 Excel
              </button>
              <button
                onClick={() => handleExport('gbxml')}
                disabled={exporting}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
              >
                📐 gbXML
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
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
              className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600"
            >
              Results
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
        {/* Status Bar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Status</span>
                  <p className="text-sm font-bold text-green-600">Completed</p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Calculated</span>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(results.calculated_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Credits Used</span>
                  <p className="text-sm font-bold text-gray-900">{results.credits_used}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {results.warnings && results.warnings.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Warnings</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    {results.warnings.map((warning: string, idx: number) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex -mb-px overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-semibold border-b-3 transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-4 border-indigo-600 text-indigo-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Building Summary</h2>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg transform transition hover:scale-105">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-blue-100 font-semibold uppercase tracking-wide">Floor Area</p>
                      <span className="text-2xl">📐</span>
                    </div>
                    <p className="text-4xl font-bold text-white mt-3">
                      {results.building_summary.total_floor_area.toFixed(1)}
                    </p>
                    <p className="text-sm text-blue-100 mt-1">m²</p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl p-6 shadow-lg transform transition hover:scale-105">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-cyan-100 font-semibold uppercase tracking-wide">Peak Cooling</p>
                      <span className="text-2xl">❄️</span>
                    </div>
                    <p className="text-4xl font-bold text-white mt-3">
                      {(results.building_summary.peak_cooling_total / 1000).toFixed(1)}
                    </p>
                    <p className="text-sm text-cyan-100 mt-1">kW ({(results.building_summary.peak_cooling_total / 3517).toFixed(1)} tons)</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 shadow-lg transform transition hover:scale-105">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-orange-100 font-semibold uppercase tracking-wide">Peak Heating</p>
                      <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-4xl font-bold text-white mt-3">
                      {(results.building_summary.peak_heating / 1000).toFixed(1)}
                    </p>
                    <p className="text-sm text-orange-100 mt-1">kW</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg transform transition hover:scale-105">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-green-100 font-semibold uppercase tracking-wide">Intensity</p>
                      <span className="text-2xl">⚡</span>
                    </div>
                    <p className="text-4xl font-bold text-white mt-3">
                      {results.building_summary.cooling_w_per_m2.toFixed(1)}
                    </p>
                    <p className="text-sm text-green-100 mt-1">W/m²</p>
                  </div>
                </div>

                {/* Load Comparison Bar Charts */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg p-2 mr-3">📊</span>
                    Load Distribution by Space
                  </h3>
                  <div className="space-y-4">
                    {results.space_results.map((space: any, idx: number) => {
                      const maxLoad = Math.max(
                        ...results.space_results.map((s: any) => Math.max(s.peak_cooling_total, s.peak_heating))
                      )
                      const coolingPercent = (space.peak_cooling_total / maxLoad) * 100
                      const heatingPercent = (space.peak_heating / maxLoad) * 100

                      return (
                        <div key={idx} className="group hover:bg-gray-50 p-4 rounded-lg transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {space.space_name}
                            </span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-cyan-600 font-medium">
                                ❄️ {(space.peak_cooling_total / 1000).toFixed(1)} kW
                              </span>
                              <span className="text-orange-600 font-medium">
                                🔥 {(space.peak_heating / 1000).toFixed(1)} kW
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {/* Cooling Bar */}
                            <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="absolute h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                style={{ width: `${coolingPercent}%` }}
                              >
                                {coolingPercent > 15 && (
                                  <span className="text-xs font-bold text-white">Cooling</span>
                                )}
                              </div>
                            </div>
                            {/* Heating Bar */}
                            <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="absolute h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                style={{ width: `${heatingPercent}%` }}
                              >
                                {heatingPercent > 15 && (
                                  <span className="text-xs font-bold text-white">Heating</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Total Loads Comparison */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg p-2 mr-3">🎯</span>
                    Total Building Loads
                  </h3>
                  <div className="space-y-6">
                    {/* Total Cooling */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold text-gray-900">Total Cooling Load</span>
                        <span className="text-2xl font-bold text-cyan-600">
                          {(results.building_summary.peak_cooling_total / 1000).toFixed(1)} kW
                        </span>
                      </div>
                      <div className="relative h-12 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                        <div
                          className="absolute h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-xl flex items-center justify-center transition-all duration-1000 ease-out"
                          style={{ width: '100%' }}
                        >
                          <span className="text-white font-bold text-sm">
                            {(results.building_summary.peak_cooling_total / 3517).toFixed(1)} tons refrigeration
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Total Heating */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold text-gray-900">Total Heating Load</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {(results.building_summary.peak_heating / 1000).toFixed(1)} kW
                        </span>
                      </div>
                      <div className="relative h-12 bg-gray-100 rounded-xl overflow-hidden shadow-inner">
                        <div
                          className="absolute h-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-600 rounded-xl flex items-center justify-center transition-all duration-1000 ease-out"
                          style={{ width: `${(results.building_summary.peak_heating / results.building_summary.peak_cooling_total) * 100}%` }}
                        >
                          <span className="text-white font-bold text-sm">
                            {((results.building_summary.peak_heating / results.building_summary.peak_cooling_total) * 100).toFixed(1)}% of cooling
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Load Components */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <span className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg p-2 mr-3">📋</span>
                    Load Component Breakdown
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sensible Cooling */}
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">Sensible Cooling</span>
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                          {((results.building_summary.peak_cooling_sensible / results.building_summary.peak_cooling_total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600">
                        {(results.building_summary.peak_cooling_sensible / 1000).toFixed(1)}
                      </p>
                      <p className="text-sm text-blue-700 mt-1">kW</p>
                    </div>

                    {/* Latent Cooling */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold text-purple-900 uppercase tracking-wide">Latent Cooling</span>
                        <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                          {((results.building_summary.peak_cooling_latent / results.building_summary.peak_cooling_total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-3xl font-bold text-purple-600">
                        {(results.building_summary.peak_cooling_latent / 1000).toFixed(1)}
                      </p>
                      <p className="text-sm text-purple-700 mt-1">kW</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'spaces' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">Space-by-Space Results</h2>
                  <p className="text-sm text-gray-600">Click on any space to see detailed load breakdown</p>
                </div>

                {results.space_results.map((space: any, idx: number) => {
                  const isExpanded = expandedSpaces.has(space.space_id)
                  return (
                    <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 transform transition-all hover:shadow-xl">
                      {/* Space Header - Always visible, clickable */}
                      <div
                        className="p-6 cursor-pointer hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all"
                        onClick={() => toggleSpaceExpanded(space.space_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900 mb-3">{space.space_name}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-1">Area</span>
                                <span className="font-bold text-gray-900">{space.floor_area.toFixed(1)} m²</span>
                              </div>
                              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-3 border border-cyan-100">
                                <span className="text-xs text-cyan-700 uppercase tracking-wide font-semibold block mb-1">Cooling</span>
                                <span className="font-bold text-cyan-700">{(space.peak_cooling_total / 1000).toFixed(1)} kW</span>
                              </div>
                              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-100">
                                <span className="text-xs text-orange-700 uppercase tracking-wide font-semibold block mb-1">Heating</span>
                                <span className="font-bold text-orange-700">{(space.peak_heating / 1000).toFixed(1)} kW</span>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold block mb-1">Intensity</span>
                                <span className="font-bold text-gray-900">{space.cooling_w_per_m2?.toFixed(1) || 'N/A'} W/m²</span>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                <span className="text-xs text-purple-700 uppercase tracking-wide font-semibold block mb-1">Airflow</span>
                                <span className="font-bold text-purple-700">{space.supply_airflow_cooling.toFixed(1)} m³/s</span>
                              </div>
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                <span className="text-xs text-purple-700 uppercase tracking-wide font-semibold block mb-1">CFM</span>
                                <span className="font-bold text-purple-700">{(space.supply_airflow_cooling * 2118.88).toFixed(1)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isExpanded ? 'bg-indigo-100 text-indigo-600 rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cooling Load Breakdown */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Cooling Load Details
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Sensible Load:</span>
                                  <span className="font-medium">{(space.peak_cooling_sensible || space.peak_cooling_total * 0.7).toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Latent Load:</span>
                                  <span className="font-medium">{(space.peak_cooling_latent || space.peak_cooling_total * 0.3).toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm font-semibold border-t pt-2">
                                  <span className="text-gray-900">Total Cooling:</span>
                                  <span className="text-blue-600">{space.peak_cooling_total.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Tons Refrigeration:</span>
                                  <span className="font-medium">{(space.peak_cooling_total / 3517).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Cooling Intensity:</span>
                                  <span className="font-medium">{space.cooling_w_per_m2?.toFixed(1) || (space.peak_cooling_total / space.floor_area).toFixed(1)} W/m²</span>
                                </div>
                              </div>

                              {/* Load Components if available */}
                              {space.components && Object.keys(space.components).length > 0 && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">Load Component Breakdown:</h6>
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

                            {/* Heating & Envelope Info */}
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                Heating & Building Envelope
                              </h5>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Peak Heating:</span>
                                  <span className="font-medium text-red-600">{space.peak_heating.toFixed(1)} W</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Heating Intensity:</span>
                                  <span className="font-medium">{space.heating_w_per_m2?.toFixed(1) || (space.peak_heating / space.floor_area).toFixed(1)} W/m²</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600">Heating kW:</span>
                                  <span className="font-medium">{(space.peak_heating / 1000).toFixed(1)}</span>
                                </div>
                              </div>

                              {/* Airflow Requirements */}
                              <div className="mt-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Airflow Requirements:</h6>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Supply Air:</span>
                                    <span className="font-medium">{space.supply_airflow_cooling.toFixed(1)} m³/s ({(space.supply_airflow_cooling * 2118.88).toFixed(1)} CFM)</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Outdoor Air:</span>
                                    <span className="font-medium">{space.outdoor_airflow.toFixed(1)} m³/s ({(space.outdoor_airflow * 2118.88).toFixed(1)} CFM)</span>
                                  </div>
                                </div>
                              </div>

                              {/* Building Envelope */}
                              <div className="mt-4">
                                <h6 className="text-sm font-semibold text-gray-700 mb-2">Building Envelope:</h6>
                                <div className="space-y-1 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Floor Area:</span>
                                    <span className="font-medium">{space.floor_area.toFixed(1)} m²</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Volume:</span>
                                    <span className="font-medium">{space.volume.toFixed(1)} m³</span>
                                  </div>
                                  {space.exterior_wall_area !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Ext. Wall Area:</span>
                                      <span className="font-medium">{space.exterior_wall_area.toFixed(1)} m²</span>
                                    </div>
                                  )}
                                  {space.window_area !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Window Area:</span>
                                      <span className="font-medium">{space.window_area.toFixed(1)} m²</span>
                                    </div>
                                  )}
                                  {space.roof_area !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Roof Area:</span>
                                      <span className="font-medium">{space.roof_area.toFixed(1)} m²</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Peak Conditions */}
                              {space.peak_cooling_hour !== undefined && (
                                <div className="mt-4">
                                  <h6 className="text-sm font-semibold text-gray-700 mb-2">Peak Conditions:</h6>
                                  <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Peak Hour:</span>
                                      <span className="font-medium">{space.peak_cooling_hour}:00</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Outdoor Temp:</span>
                                      <span className="font-medium">{space.outdoor_temp_at_cooling_peak?.toFixed(1) || 'N/A'} °C</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {activeTab === 'walkthrough' && randomSpace && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Calculation Walkthrough</h2>
                  <button
                    onClick={pickRandomSpace}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                  >
                    🎲 Pick Another Random Space
                  </button>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Selected Space: {randomSpace.space_name}</h3>
                  <p className="text-sm text-gray-700">
                    This walkthrough shows the detailed ASHRAE heat balance calculations performed for this space.
                  </p>
                </div>

                {/* Input Parameters */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-indigo-100 text-indigo-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                    Input Parameters
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Floor Area (A):</span>
                      <span className="font-bold text-lg">{randomSpace.floor_area.toFixed(1)} m²</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Volume (V):</span>
                      <span className="font-bold text-lg">{randomSpace.volume.toFixed(1)} m³</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Ceiling Height (h):</span>
                      <span className="font-bold text-lg">{(randomSpace.volume / randomSpace.floor_area).toFixed(1)} m</span>
                    </div>
                    {randomSpace.exterior_wall_area !== undefined && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Ext. Wall Area (A<sub>wall</sub>):</span>
                        <span className="font-bold text-lg">{randomSpace.exterior_wall_area.toFixed(1)} m²</span>
                      </div>
                    )}
                    {randomSpace.window_area !== undefined && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Window Area (A<sub>win</sub>):</span>
                        <span className="font-bold text-lg">{randomSpace.window_area.toFixed(1)} m²</span>
                      </div>
                    )}
                    {randomSpace.roof_area !== undefined && (
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="text-gray-600 block">Roof Area (A<sub>roof</sub>):</span>
                        <span className="font-bold text-lg">{randomSpace.roof_area.toFixed(1)} m²</span>
                      </div>
                    )}
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Occupancy:</span>
                      <span className="font-bold text-lg">{randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)} people</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Lighting Power:</span>
                      <span className="font-bold text-lg">{randomSpace.lighting_w_per_m2 || 10.0} W/m²</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="text-gray-600 block">Equipment Power:</span>
                      <span className="font-bold text-lg">{randomSpace.equipment_w_per_m2 || 8.0} W/m²</span>
                    </div>
                  </div>
                </div>

                {/* Cooling Load Calculations */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                    Cooling Load Calculation (ASHRAE Heat Balance Method)
                  </h3>

                  {/* External Loads */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-md">A. External Heat Gains</h4>

                    {/* Walls */}
                    {randomSpace.exterior_wall_area !== undefined && randomSpace.exterior_wall_area > 0 && (
                      <div className="bg-blue-50 p-4 rounded mb-3">
                        <p className="font-medium text-gray-900 mb-2">Exterior Walls:</p>
                        <div className="font-mono text-sm space-y-1 text-gray-700">
                          <p>Q<sub>wall</sub> = A<sub>wall</sub> × U<sub>wall</sub> × CLTD</p>
                          <p>Q<sub>wall</sub> = {randomSpace.exterior_wall_area.toFixed(1)} m² × 0.45 W/(m²·K) × {randomSpace.cltd_wall || 12.0}°C</p>
                          <p className="font-bold text-blue-700">Q<sub>wall</sub> = {(randomSpace.exterior_wall_area * 0.45 * (randomSpace.cltd_wall || 12.0)).toFixed(1)} W</p>
                        </div>
                      </div>
                    )}

                    {/* Windows */}
                    {randomSpace.window_area !== undefined && randomSpace.window_area > 0 && (
                      <div className="bg-blue-50 p-4 rounded mb-3">
                        <p className="font-medium text-gray-900 mb-2">Windows (Solar + Conduction):</p>
                        <div className="font-mono text-sm space-y-1 text-gray-700">
                          <p>Q<sub>solar</sub> = A<sub>win</sub> × SHGC × SCL</p>
                          <p>Q<sub>solar</sub> = {randomSpace.window_area.toFixed(1)} m² × 0.40 × {randomSpace.solar_cooling_load || 500} W/m²</p>
                          <p className="font-bold text-blue-700">Q<sub>solar</sub> = {(randomSpace.window_area * 0.40 * (randomSpace.solar_cooling_load || 500)).toFixed(1)} W</p>
                          <div className="mt-2 pt-2 border-t border-blue-200">
                            <p>Q<sub>cond</sub> = A<sub>win</sub> × U<sub>win</sub> × ΔT</p>
                            <p>Q<sub>cond</sub> = {randomSpace.window_area.toFixed(1)} m² × 2.5 W/(m²·K) × {randomSpace.delta_t_window || 8.0}°C</p>
                            <p className="font-bold text-blue-700">Q<sub>cond</sub> = {(randomSpace.window_area * 2.5 * (randomSpace.delta_t_window || 8.0)).toFixed(1)} W</p>
                          </div>
                          <p className="font-bold text-blue-900 pt-2 border-t border-blue-300">Q<sub>window,total</sub> = {(randomSpace.window_area * 0.40 * (randomSpace.solar_cooling_load || 500) + randomSpace.window_area * 2.5 * (randomSpace.delta_t_window || 8.0)).toFixed(1)} W</p>
                        </div>
                      </div>
                    )}

                    {/* Roof */}
                    {randomSpace.roof_area !== undefined && randomSpace.roof_area > 0 && (
                      <div className="bg-blue-50 p-4 rounded mb-3">
                        <p className="font-medium text-gray-900 mb-2">Roof Heat Gain:</p>
                        <div className="font-mono text-sm space-y-1 text-gray-700">
                          <p>Q<sub>roof</sub> = A<sub>roof</sub> × U<sub>roof</sub> × CLTD<sub>roof</sub></p>
                          <p>Q<sub>roof</sub> = {randomSpace.roof_area.toFixed(1)} m² × 0.25 W/(m²·K) × {randomSpace.cltd_roof || 20.0}°C</p>
                          <p className="font-bold text-blue-700">Q<sub>roof</sub> = {(randomSpace.roof_area * 0.25 * (randomSpace.cltd_roof || 20.0)).toFixed(1)} W</p>
                        </div>
                      </div>
                    )}

                    {/* Infiltration */}
                    <div className="bg-blue-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Infiltration Load:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>inf,sens</sub> = V<sub>inf</sub> × ρ × c<sub>p</sub> × ΔT</p>
                        <p>V<sub>inf</sub> = {(randomSpace.volume * 0.5).toFixed(1)} m³/h (0.5 ACH)</p>
                        <p>Q<sub>inf,sens</sub> = {(randomSpace.volume * 0.5 / 3600).toFixed(4)} m³/s × 1.2 kg/m³ × 1005 J/(kg·K) × {randomSpace.delta_t_cooling || 12.0}°C</p>
                        <p className="font-bold text-blue-700">Q<sub>inf,sens</sub> = {(randomSpace.volume * 0.5 / 3600 * 1.2 * 1005 * (randomSpace.delta_t_cooling || 12.0)).toFixed(1)} W</p>
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <p>Q<sub>inf,lat</sub> = V<sub>inf</sub> × ρ × h<sub>fg</sub> × Δω</p>
                          <p>Q<sub>inf,lat</sub> = {(randomSpace.volume * 0.5 / 3600).toFixed(4)} m³/s × 1.2 kg/m³ × 2500000 J/kg × {randomSpace.delta_humidity || 0.005}</p>
                          <p className="font-bold text-blue-700">Q<sub>inf,lat</sub> = {(randomSpace.volume * 0.5 / 3600 * 1.2 * 2500000 * (randomSpace.delta_humidity || 0.005)).toFixed(1)} W</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Internal Loads */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 text-md">B. Internal Heat Gains</h4>

                    {/* People */}
                    <div className="bg-green-50 p-4 rounded mb-3">
                      <p className="font-medium text-gray-900 mb-2">Occupants:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>people,sens</sub> = N × q<sub>sens</sub></p>
                        <p>Q<sub>people,sens</sub> = {randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)} people × 75 W/person</p>
                        <p className="font-bold text-green-700">Q<sub>people,sens</sub> = {((randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)) * 75).toFixed(1)} W</p>
                        <div className="mt-2 pt-2 border-t border-green-200">
                          <p>Q<sub>people,lat</sub> = N × q<sub>lat</sub></p>
                          <p>Q<sub>people,lat</sub> = {randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)} people × 55 W/person</p>
                          <p className="font-bold text-green-700">Q<sub>people,lat</sub> = {((randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)) * 55).toFixed(1)} W</p>
                        </div>
                      </div>
                    </div>

                    {/* Lighting */}
                    <div className="bg-green-50 p-4 rounded mb-3">
                      <p className="font-medium text-gray-900 mb-2">Lighting:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>lights</sub> = A × LPD × F<sub>use</sub> × F<sub>ballast</sub></p>
                        <p>Q<sub>lights</sub> = {randomSpace.floor_area.toFixed(1)} m² × {randomSpace.lighting_w_per_m2 || 10.0} W/m² × 1.0 × 1.2</p>
                        <p className="font-bold text-green-700">Q<sub>lights</sub> = {(randomSpace.floor_area * (randomSpace.lighting_w_per_m2 || 10.0) * 1.0 * 1.2).toFixed(1)} W</p>
                      </div>
                    </div>

                    {/* Equipment */}
                    <div className="bg-green-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Equipment:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>equipment</sub> = A × EPD × F<sub>use</sub> × F<sub>rad</sub></p>
                        <p>Q<sub>equipment</sub> = {randomSpace.floor_area.toFixed(1)} m² × {randomSpace.equipment_w_per_m2 || 8.0} W/m² × 0.75 × 1.0</p>
                        <p className="font-bold text-green-700">Q<sub>equipment</sub> = {(randomSpace.floor_area * (randomSpace.equipment_w_per_m2 || 8.0) * 0.75 * 1.0).toFixed(1)} W</p>
                      </div>
                    </div>
                  </div>

                  {/* Total Cooling Load */}
                  <div className="bg-gradient-to-r from-blue-100 to-indigo-100 p-6 rounded-lg border-2 border-blue-300">
                    <h4 className="font-bold text-gray-900 mb-3 text-lg">C. Total Cooling Load</h4>
                    <div className="font-mono text-sm space-y-2">
                      <div className="flex justify-between">
                        <span>Sensible Load (Q<sub>sens</sub>):</span>
                        <span className="font-bold">{(randomSpace.peak_cooling_sensible || randomSpace.peak_cooling_total * 0.7).toFixed(1)} W</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latent Load (Q<sub>lat</sub>):</span>
                        <span className="font-bold">{(randomSpace.peak_cooling_latent || randomSpace.peak_cooling_total * 0.3).toFixed(1)} W</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t-2 border-blue-400 pt-2 mt-2">
                        <span>Total Cooling Load:</span>
                        <span className="text-blue-700">{randomSpace.peak_cooling_total.toFixed(1)} W = {(randomSpace.peak_cooling_total / 1000).toFixed(1)} kW</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tons Refrigeration:</span>
                        <span className="font-bold text-blue-600">{(randomSpace.peak_cooling_total / 3517).toFixed(1)} tons</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Cooling Intensity:</span>
                        <span className="font-bold text-blue-600">{(randomSpace.peak_cooling_total / randomSpace.floor_area).toFixed(1)} W/m²</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Heating Load Calculations */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-orange-100 text-orange-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">3</span>
                    Heating Load Calculation
                  </h3>

                  <div className="space-y-4">
                    {/* Transmission Losses */}
                    <div className="bg-orange-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Heat Loss Through Building Envelope:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>trans</sub> = (A<sub>wall</sub> × U<sub>wall</sub> + A<sub>win</sub> × U<sub>win</sub> + A<sub>roof</sub> × U<sub>roof</sub> + A<sub>floor</sub> × U<sub>floor</sub>) × ΔT</p>
                        <p>UA<sub>total</sub> = ({randomSpace.exterior_wall_area?.toFixed(1) || 0} × 0.45 + {randomSpace.window_area?.toFixed(1) || 0} × 2.5 + {randomSpace.roof_area?.toFixed(1) || 0} × 0.25 + {randomSpace.floor_area.toFixed(1)} × 0.30)</p>
                        <p>UA<sub>total</sub> = {(
                          (randomSpace.exterior_wall_area || 0) * 0.45 +
                          (randomSpace.window_area || 0) * 2.5 +
                          (randomSpace.roof_area || 0) * 0.25 +
                          randomSpace.floor_area * 0.30
                        ).toFixed(1)} W/K</p>
                        <p>Q<sub>trans</sub> = {(
                          (randomSpace.exterior_wall_area || 0) * 0.45 +
                          (randomSpace.window_area || 0) * 2.5 +
                          (randomSpace.roof_area || 0) * 0.25 +
                          randomSpace.floor_area * 0.30
                        ).toFixed(1)} W/K × {randomSpace.delta_t_heating || 25.0}°C</p>
                        <p className="font-bold text-orange-700">Q<sub>trans</sub> = {(
                          ((randomSpace.exterior_wall_area || 0) * 0.45 +
                          (randomSpace.window_area || 0) * 2.5 +
                          (randomSpace.roof_area || 0) * 0.25 +
                          randomSpace.floor_area * 0.30) * (randomSpace.delta_t_heating || 25.0)
                        ).toFixed(1)} W</p>
                      </div>
                    </div>

                    {/* Infiltration Heating */}
                    <div className="bg-orange-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Infiltration Heating Load:</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>Q<sub>inf,heat</sub> = V<sub>inf</sub> × ρ × c<sub>p</sub> × ΔT</p>
                        <p>V<sub>inf</sub> = {(randomSpace.volume * 0.7).toFixed(1)} m³/h (0.7 ACH for heating)</p>
                        <p>Q<sub>inf,heat</sub> = {(randomSpace.volume * 0.7 / 3600).toFixed(4)} m³/s × 1.2 kg/m³ × 1005 J/(kg·K) × {randomSpace.delta_t_heating || 25.0}°C</p>
                        <p className="font-bold text-orange-700">Q<sub>inf,heat</sub> = {(randomSpace.volume * 0.7 / 3600 * 1.2 * 1005 * (randomSpace.delta_t_heating || 25.0)).toFixed(1)} W</p>
                      </div>
                    </div>

                    {/* Total Heating Load */}
                    <div className="bg-gradient-to-r from-orange-100 to-red-100 p-6 rounded-lg border-2 border-orange-300">
                      <h4 className="font-bold text-gray-900 mb-3 text-lg">Total Heating Load</h4>
                      <div className="font-mono text-sm space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Peak Heating Load:</span>
                          <span className="text-orange-700">{randomSpace.peak_heating.toFixed(1)} W = {(randomSpace.peak_heating / 1000).toFixed(1)} kW</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Heating Intensity:</span>
                          <span className="font-bold text-orange-600">{(randomSpace.peak_heating / randomSpace.floor_area).toFixed(1)} W/m²</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Airflow Calculations */}
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">4</span>
                    Airflow Requirements
                  </h3>

                  <div className="space-y-4">
                    {/* Supply Air for Cooling */}
                    <div className="bg-purple-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Supply Airflow (Cooling):</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>V<sub>supply</sub> = Q<sub>sens</sub> / (ρ × c<sub>p</sub> × ΔT<sub>supply</sub>)</p>
                        <p>V<sub>supply</sub> = {(randomSpace.peak_cooling_sensible || randomSpace.peak_cooling_total * 0.7).toFixed(1)} W / (1.2 kg/m³ × 1005 J/(kg·K) × 10°C)</p>
                        <p className="font-bold text-purple-700">V<sub>supply</sub> = {randomSpace.supply_airflow_cooling.toFixed(1)} m³/s = {(randomSpace.supply_airflow_cooling * 2118.88).toFixed(1)} CFM</p>
                      </div>
                    </div>

                    {/* Outdoor Air */}
                    <div className="bg-purple-50 p-4 rounded">
                      <p className="font-medium text-gray-900 mb-2">Outdoor Air (Ventilation):</p>
                      <div className="font-mono text-sm space-y-1 text-gray-700">
                        <p>V<sub>oa</sub> = N × OA<sub>per person</sub> + A × OA<sub>per area</sub></p>
                        <p>V<sub>oa</sub> = {randomSpace.occupancy || Math.floor(randomSpace.floor_area / 10)} people × 0.010 m³/(s·person) + {randomSpace.floor_area.toFixed(1)} m² × 0.0003 m³/(s·m²)</p>
                        <p className="font-bold text-purple-700">V<sub>oa</sub> = {randomSpace.outdoor_airflow.toFixed(1)} m³/s = {(randomSpace.outdoor_airflow * 2118.88).toFixed(1)} CFM</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">📋 Calculation Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-300 mb-2">Space: <span className="font-bold text-white">{randomSpace.space_name}</span></p>
                      <p className="text-gray-300 mb-2">Floor Area: <span className="font-bold text-white">{randomSpace.floor_area.toFixed(1)} m²</span></p>
                      <p className="text-gray-300 mb-2">Volume: <span className="font-bold text-white">{randomSpace.volume.toFixed(1)} m³</span></p>
                    </div>
                    <div>
                      <p className="text-blue-300 mb-2">Peak Cooling: <span className="font-bold text-blue-100">{(randomSpace.peak_cooling_total / 1000).toFixed(1)} kW ({(randomSpace.peak_cooling_total / 3517).toFixed(1)} tons)</span></p>
                      <p className="text-orange-300 mb-2">Peak Heating: <span className="font-bold text-orange-100">{(randomSpace.peak_heating / 1000).toFixed(1)} kW</span></p>
                      <p className="text-purple-300 mb-2">Supply Airflow: <span className="font-bold text-purple-100">{randomSpace.supply_airflow_cooling.toFixed(1)} m³/s ({(randomSpace.supply_airflow_cooling * 2118.88).toFixed(1)} CFM)</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'zones' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Zone Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.zone_results.map((zone: any) => (
                    <div key={zone.zone_id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 transform transition-all hover:shadow-xl hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">{zone.zone_name}</h3>
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-xl flex items-center justify-center">
                          <span className="text-2xl">🗺️</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <dt className="text-sm text-gray-600 font-semibold">Floor Area</dt>
                            <dd className="text-lg font-bold text-gray-900">{zone.total_floor_area.toFixed(1)} m²</dd>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                            <dt className="text-xs text-cyan-700 font-semibold uppercase tracking-wide mb-1">Peak Cooling</dt>
                            <dd className="text-xl font-bold text-cyan-700">{(zone.peak_cooling_total / 1000).toFixed(1)} kW</dd>
                          </div>
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
                            <dt className="text-xs text-orange-700 font-semibold uppercase tracking-wide mb-1">Peak Heating</dt>
                            <dd className="text-xl font-bold text-orange-700">{(zone.peak_heating / 1000).toFixed(1)} kW</dd>
                          </div>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-4 mt-4">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
                            <div className="flex justify-between items-center mb-2">
                              <dt className="text-sm font-semibold">Sized Cooling Capacity</dt>
                              <dd className="text-2xl font-bold">{(zone.sized_cooling_load / 1000).toFixed(1)} kW</dd>
                            </div>
                            <div className="flex justify-between items-center">
                              <dt className="text-sm font-semibold">Sized Heating Capacity</dt>
                              <dd className="text-2xl font-bold">{(zone.sized_heating_load / 1000).toFixed(1)} kW</dd>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'systems' && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">HVAC System Sizing</h2>

                {results.system_results.map((system: any) => (
                  <div key={system.system_id} className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{system.system_name}</h3>
                        <p className="text-sm text-gray-600 mt-2 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {system.system_type}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md">
                          ⭐ Primary System
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold opacity-90">Cooling Capacity</p>
                          <span className="text-2xl">❄️</span>
                        </div>
                        <p className="text-3xl font-bold mt-2">
                          {(system.sized_cooling_capacity / 1000).toFixed(1)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">
                          kW ({(system.sized_cooling_capacity / 3517).toFixed(1)} tons)
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold opacity-90">Heating Capacity</p>
                          <span className="text-2xl">🔥</span>
                        </div>
                        <p className="text-3xl font-bold mt-2">
                          {(system.sized_heating_capacity / 1000).toFixed(1)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">kW</p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold opacity-90">Supply Airflow</p>
                          <span className="text-2xl">💨</span>
                        </div>
                        <p className="text-3xl font-bold mt-2">
                          {system.total_supply_airflow.toLocaleString()}
                        </p>
                        <p className="text-xs opacity-80 mt-1">L/s</p>
                      </div>

                      <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold opacity-90">Cooling Coil</p>
                          <span className="text-2xl">🌡️</span>
                        </div>
                        <p className="text-3xl font-bold mt-2">
                          {(system.cooling_coil_total / 1000).toFixed(1)}
                        </p>
                        <p className="text-xs opacity-80 mt-1">kW</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'plant' && (
              <div className="space-y-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Central Plant Equipment</h2>

                {results.plant_results.map((plant: any) => (
                  <div key={plant.plant_id} className="space-y-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-white flex items-center">
                            <span className="text-3xl mr-3">❄️</span>
                            Chiller Plant
                          </h3>
                          <span className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl text-sm font-bold">
                            Cooling
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
                            <p className="text-sm text-cyan-700 font-semibold uppercase tracking-wide mb-2">Total Capacity</p>
                            <p className="text-4xl font-bold text-cyan-700 mt-2">
                              {plant.chiller_capacity_tons.toFixed(1)}
                            </p>
                            <p className="text-sm text-cyan-600 mt-1">tons ({(plant.chiller_capacity / 1000).toFixed(1)} kW)</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">Chillers</p>
                            <p className="text-4xl font-bold text-gray-900 mt-2">
                              {plant.num_chillers}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">units</p>
                          </div>
                          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                            <p className="text-sm text-indigo-700 font-semibold uppercase tracking-wide mb-2">Per Chiller</p>
                            <p className="text-4xl font-bold text-indigo-700 mt-2">
                              {(plant.chiller_capacity_tons / plant.num_chillers).toFixed(1)}
                            </p>
                            <p className="text-sm text-indigo-600 mt-1">tons each</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                      <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-white flex items-center">
                            <span className="text-3xl mr-3">🔥</span>
                            Boiler Plant
                          </h3>
                          <span className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-xl text-sm font-bold">
                            Heating
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                            <p className="text-sm text-orange-700 font-semibold uppercase tracking-wide mb-2">Total Capacity</p>
                            <p className="text-4xl font-bold text-orange-700 mt-2">
                              {plant.boiler_capacity_kw.toFixed(1)}
                            </p>
                            <p className="text-sm text-orange-600 mt-1">kW ({(plant.boiler_capacity / 1000 * 3.412).toFixed(1)} MBH)</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <p className="text-sm text-gray-600 font-semibold uppercase tracking-wide mb-2">Boilers</p>
                            <p className="text-4xl font-bold text-gray-900 mt-2">
                              {plant.num_boilers}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">units</p>
                          </div>
                          <div className="bg-pink-50 rounded-xl p-6 border border-pink-200">
                            <p className="text-sm text-pink-700 font-semibold uppercase tracking-wide mb-2">Per Boiler</p>
                            <p className="text-4xl font-bold text-pink-700 mt-2">
                              {(plant.boiler_capacity_kw / plant.num_boilers).toFixed(1)}
                            </p>
                            <p className="text-sm text-pink-600 mt-1">kW each</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Equipment Schedule */}
                    <div className="border rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Schedule</h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity Each</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Redundancy</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Water-Cooled Chiller</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plant.num_chillers}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(plant.chiller_capacity_tons / plant.num_chillers).toFixed(1)} tons
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {plant.chiller_capacity_tons.toFixed(1)} tons
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">N+1</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hot Water Boiler</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plant.num_boilers}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {(plant.boiler_capacity_kw / plant.num_boilers).toFixed(1)} kW
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {plant.boiler_capacity_kw.toFixed(1)} kW
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">N+1</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Primary Chilled Water Pump</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">50% each</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">150%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">N+1</td>
                          </tr>
                          <tr className="bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Hot Water Pump</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">3</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">50% each</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">150%</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">N+1</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
