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

  const handleExport = async (format: string) => {
    setExporting(true)
    try {
      // TODO: API call to export results
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert(`Exporting to ${format.toUpperCase()}... (Demo mode)`)
    } catch (err: any) {
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
    { id: 'zones', name: 'Zone Results', icon: '🗺️' },
    { id: 'systems', name: 'System Sizing', icon: '❄️' },
    { id: 'plant', name: 'Plant Equipment', icon: '⚡' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Calculation Results: {results.project_name}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                📄 Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                📊 Export Excel
              </button>
              <button
                onClick={() => handleExport('gbxml')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                📐 Export gbXML
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

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className="ml-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Completed
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Calculated:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {new Date(results.calculated_at).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Credits Used:</span>
                <span className="ml-2 text-sm font-medium text-gray-900">
                  {results.credits_used}
                </span>
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
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'summary' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Building Summary</h2>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-600 font-medium">Total Floor Area</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {results.building_summary.total_floor_area.toFixed(1)}
                    </p>
                    <p className="text-sm text-blue-600">m²</p>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-600 font-medium">Peak Cooling Load</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                      {(results.building_summary.peak_cooling_total / 1000).toFixed(1)}
                    </p>
                    <p className="text-sm text-red-600">kW</p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-sm text-orange-600 font-medium">Peak Heating Load</p>
                    <p className="text-3xl font-bold text-orange-900 mt-2">
                      {(results.building_summary.peak_heating / 1000).toFixed(1)}
                    </p>
                    <p className="text-sm text-orange-600">kW</p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600 font-medium">Cooling Intensity</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {results.building_summary.cooling_w_per_m2.toFixed(1)}
                    </p>
                    <p className="text-sm text-green-600">W/m²</p>
                  </div>
                </div>

                {/* Load Breakdown Chart Placeholder */}
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Breakdown</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <div className="text-center text-gray-500">
                      <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p>Chart Placeholder</p>
                      <p className="text-sm">Cooling vs Heating Load Comparison</p>
                    </div>
                  </div>
                </div>

                {/* Load Components Table */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Components</h3>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Component</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cooling (W)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heating (W)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Sensible Cooling</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{results.building_summary.peak_cooling_sensible.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">81.7%</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Latent Cooling</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{results.building_summary.peak_cooling_latent.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">18.3%</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Total</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{results.building_summary.peak_cooling_total.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{results.building_summary.peak_heating.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'spaces' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Space-by-Space Results</h2>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Space Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Area (m²)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Volume (m³)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cooling (W)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Heating (W)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Airflow (L/s)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OA (L/s)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.space_results.map((space: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {space.space_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.floor_area.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.volume.toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.peak_cooling_total.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.peak_heating.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.supply_airflow_cooling.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {space.outdoor_airflow.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'zones' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Zone Results</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.zone_results.map((zone: any) => (
                    <div key={zone.zone_id} className="border rounded-lg p-6 bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{zone.zone_name}</h3>
                      <dl className="space-y-3">
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Floor Area:</dt>
                          <dd className="text-sm font-medium text-gray-900">{zone.total_floor_area.toFixed(1)} m²</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Peak Cooling:</dt>
                          <dd className="text-sm font-medium text-gray-900">{(zone.peak_cooling_total / 1000).toFixed(1)} kW</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-gray-600">Peak Heating:</dt>
                          <dd className="text-sm font-medium text-gray-900">{(zone.peak_heating / 1000).toFixed(1)} kW</dd>
                        </div>
                        <div className="flex justify-between border-t pt-3">
                          <dt className="text-sm font-semibold text-gray-900">Sized Cooling:</dt>
                          <dd className="text-sm font-bold text-blue-600">{(zone.sized_cooling_load / 1000).toFixed(1)} kW</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm font-semibold text-gray-900">Sized Heating:</dt>
                          <dd className="text-sm font-bold text-orange-600">{(zone.sized_heating_load / 1000).toFixed(1)} kW</dd>
                        </div>
                      </dl>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'systems' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">HVAC System Sizing</h2>

                {results.system_results.map((system: any) => (
                  <div key={system.system_id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{system.system_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{system.system_type}</p>
                      </div>
                      <span className="px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                        Primary System
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Cooling Capacity</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          {(system.sized_cooling_capacity / 1000).toFixed(1)} kW
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({(system.sized_cooling_capacity / 3517).toFixed(1)} tons)
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Heating Capacity</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">
                          {(system.sized_heating_capacity / 1000).toFixed(1)} kW
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Supply Airflow</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {system.total_supply_airflow.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">L/s</p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Cooling Coil Load</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {(system.cooling_coil_total / 1000).toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">kW</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'plant' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Central Plant Equipment</h2>

                {results.plant_results.map((plant: any) => (
                  <div key={plant.plant_id} className="space-y-6">
                    <div className="border rounded-lg p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Chiller Plant</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Total Capacity</p>
                          <p className="text-3xl font-bold text-blue-600 mt-2">
                            {plant.chiller_capacity_tons.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">tons ({(plant.chiller_capacity / 1000).toFixed(1)} kW)</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Number of Chillers</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {plant.num_chillers}
                          </p>
                          <p className="text-sm text-gray-600">units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Per Chiller</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {(plant.chiller_capacity_tons / plant.num_chillers).toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">tons each</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-6 bg-gradient-to-r from-orange-50 to-red-50">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">Boiler Plant</h3>
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Total Capacity</p>
                          <p className="text-3xl font-bold text-orange-600 mt-2">
                            {plant.boiler_capacity_kw.toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">kW ({(plant.boiler_capacity / 1000 * 3.412).toFixed(1)} MBH)</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Number of Boilers</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {plant.num_boilers}
                          </p>
                          <p className="text-sm text-gray-600">units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Per Boiler</p>
                          <p className="text-3xl font-bold text-gray-900 mt-2">
                            {(plant.boiler_capacity_kw / plant.num_boilers).toFixed(1)}
                          </p>
                          <p className="text-sm text-gray-600">kW each</p>
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
