'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '@/lib/api'

export default function ProjectSettings() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('general')
  const [saving, setSaving] = useState(false)

  // Building Envelope State
  const [envelope, setEnvelope] = useState({
    // Wall U-values (W/m²K)
    exterior_wall_u_value: 0.35,
    interior_wall_u_value: 2.0,
    // Window U-values
    window_u_value: 1.8,
    window_shgc: 0.4, // Solar Heat Gain Coefficient
    // Roof U-value
    roof_u_value: 0.25,
    // Floor U-value
    floor_u_value: 0.30,
    // Door U-value
    door_u_value: 1.5,
    // Infiltration rate (ACH)
    infiltration_ach: 0.5,
  })

  // HVAC System State
  const [hvacSystem, setHvacSystem] = useState({
    system_type: 'vav_reheat',
    heating_type: 'hot_water',
    cooling_type: 'chilled_water',
    ventilation_type: 'demand_controlled',
    // Efficiency
    cooling_cop: 3.5,
    heating_efficiency: 0.85,
    fan_efficiency: 0.65,
    // Control
    economizer_enabled: true,
    heat_recovery_enabled: true,
    heat_recovery_effectiveness: 0.70,
    // Air distribution
    supply_air_temp_cooling: 13.0,
    supply_air_temp_heating: 35.0,
    min_outdoor_air_rate: 10.0, // L/s per person
  })

  // Design Conditions State
  const [designConditions, setDesignConditions] = useState({
    // Location
    latitude: 40.7128,
    longitude: -74.0060,
    elevation: 10,
    timezone: 'America/New_York',
    // Summer design
    cooling_db_004: 33.0, // 0.4% dry bulb
    cooling_wb_004: 24.0, // wet bulb
    cooling_daily_range: 10.0,
    // Winter design
    heating_db_996: -10.0, // 99.6% dry bulb
    heating_wb_996: -12.0,
    // Ground temperature
    ground_temp: 15.0,
  })

  // Calculation Parameters State
  const [calcParams, setCalcParams] = useState({
    calculation_method: 'heat_balance',
    time_step_minutes: 60,
    run_period_start: '1/1',
    run_period_end: '12/31',
    // Safety factors
    cooling_safety_factor: 1.15,
    heating_safety_factor: 1.20,
    // Diversity factors
    lighting_diversity: 0.85,
    equipment_diversity: 0.75,
    occupancy_diversity: 0.80,
  })

  useEffect(() => {
    loadProject()
  }, [projectId])

  const loadProject = async () => {
    try {
      const data = await api.getProject(projectId)
      setProject(data)
      // Load saved settings if they exist
      // ... populate state from project data
    } catch (err) {
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert('Settings saved successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', name: 'General', icon: '📋' },
    { id: 'envelope', name: 'Building Envelope', icon: '🏗️' },
    { id: 'hvac', name: 'HVAC Systems', icon: '❄️' },
    { id: 'design', name: 'Design Conditions', icon: '🌡️' },
    { id: 'calculation', name: 'Calculation', icon: '🧮' },
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
                Project Settings: {project?.name}
              </h1>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save Settings'}
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
              className="border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Overview
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}/settings`)}
              className="border-b-2 border-indigo-500 py-4 px-1 text-sm font-medium text-indigo-600"
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
        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 bg-white rounded-lg shadow p-4 h-fit">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-white rounded-lg shadow p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">General Information</h2>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Name
                    </label>
                    <input
                      type="text"
                      defaultValue={project?.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Number
                    </label>
                    <input
                      type="text"
                      defaultValue={project?.project_number || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Building Type
                    </label>
                    <select
                      defaultValue={project?.building_type}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="office">Office</option>
                      <option value="residential">Residential</option>
                      <option value="retail">Retail</option>
                      <option value="industrial">Industrial</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="education">Education</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="warehouse">Warehouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Floors
                    </label>
                    <input
                      type="number"
                      defaultValue={project?.num_floors || 1}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      defaultValue={project?.description}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name
                    </label>
                    <input
                      type="text"
                      defaultValue={project?.client_name || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit System
                    </label>
                    <select
                      defaultValue={project?.unit_system || 'SI'}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="SI">SI (Metric)</option>
                      <option value="IP">IP (Imperial)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'envelope' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Building Envelope Properties</h2>
                <p className="text-sm text-gray-600">
                  Configure thermal properties for building envelope components. U-values in W/m²K.
                </p>

                <div className="space-y-8">
                  {/* Walls Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Walls</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exterior Wall U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.exterior_wall_u_value}
                          onChange={(e) => setEnvelope({...envelope, exterior_wall_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical range: 0.25 - 0.50</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Interior Wall U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.interior_wall_u_value}
                          onChange={(e) => setEnvelope({...envelope, interior_wall_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical range: 1.5 - 2.5</p>
                      </div>
                    </div>
                  </div>

                  {/* Windows Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Windows & Glazing</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Window U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.window_u_value}
                          onChange={(e) => setEnvelope({...envelope, window_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Single: ~5.0, Double: ~2.8, Triple: ~1.4</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Solar Heat Gain Coefficient (SHGC)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={envelope.window_shgc}
                          onChange={(e) => setEnvelope({...envelope, window_shgc: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Range: 0.0 - 1.0 (lower = less solar gain)</p>
                      </div>
                    </div>
                  </div>

                  {/* Roof & Floor Section */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Roof & Floor</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Roof U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.roof_u_value}
                          onChange={(e) => setEnvelope({...envelope, roof_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical range: 0.15 - 0.35</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Floor U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.floor_u_value}
                          onChange={(e) => setEnvelope({...envelope, floor_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical range: 0.20 - 0.40</p>
                      </div>
                    </div>
                  </div>

                  {/* Doors & Infiltration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Doors & Air Leakage</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Door U-value (W/m²K)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.door_u_value}
                          onChange={(e) => setEnvelope({...envelope, door_u_value: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical range: 1.0 - 2.0</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Infiltration Rate (ACH)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={envelope.infiltration_ach}
                          onChange={(e) => setEnvelope({...envelope, infiltration_ach: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Air changes per hour. Typical: 0.3 - 0.7</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'hvac' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">HVAC System Configuration</h2>
                <p className="text-sm text-gray-600">
                  Configure HVAC system type and performance parameters
                </p>

                <div className="space-y-8">
                  {/* System Type */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Type</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary System Type
                        </label>
                        <select
                          value={hvacSystem.system_type}
                          onChange={(e) => setHvacSystem({...hvacSystem, system_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="vav_reheat">VAV with Reheat</option>
                          <option value="vav_no_reheat">VAV without Reheat</option>
                          <option value="cav">Constant Air Volume (CAV)</option>
                          <option value="fan_coil">Fan Coil Units (FCU)</option>
                          <option value="chilled_beam">Chilled Beams</option>
                          <option value="radiant">Radiant Ceiling/Floor</option>
                          <option value="doas_fan_coil">DOAS + Fan Coils</option>
                          <option value="vrf">Variable Refrigerant Flow (VRF)</option>
                          <option value="split_dx">Split DX Systems</option>
                          <option value="packaged">Packaged Rooftop Units</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Heating Source
                        </label>
                        <select
                          value={hvacSystem.heating_type}
                          onChange={(e) => setHvacSystem({...hvacSystem, heating_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="hot_water">Hot Water Boiler</option>
                          <option value="electric">Electric Resistance</option>
                          <option value="heat_pump">Heat Pump</option>
                          <option value="furnace">Gas Furnace</option>
                          <option value="district">District Heating</option>
                          <option value="none">No Heating</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cooling Source
                        </label>
                        <select
                          value={hvacSystem.cooling_type}
                          onChange={(e) => setHvacSystem({...hvacSystem, cooling_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="chilled_water">Chilled Water</option>
                          <option value="dx_cooling">DX Cooling</option>
                          <option value="district">District Cooling</option>
                          <option value="evaporative">Evaporative Cooling</option>
                          <option value="none">No Cooling</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ventilation Strategy
                        </label>
                        <select
                          value={hvacSystem.ventilation_type}
                          onChange={(e) => setHvacSystem({...hvacSystem, ventilation_type: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="demand_controlled">Demand Controlled (CO₂)</option>
                          <option value="constant">Constant Volume</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="natural">Natural Ventilation</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Efficiency */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cooling COP
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={hvacSystem.cooling_cop}
                          onChange={(e) => setHvacSystem({...hvacSystem, cooling_cop: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Coefficient of Performance (2.5 - 6.0)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Heating Efficiency
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={hvacSystem.heating_efficiency}
                          onChange={(e) => setHvacSystem({...hvacSystem, heating_efficiency: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fraction (0.75 - 0.98)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fan Efficiency
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={hvacSystem.fan_efficiency}
                          onChange={(e) => setHvacSystem({...hvacSystem, fan_efficiency: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fraction (0.50 - 0.75)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Minimum Outdoor Air Rate (L/s·person)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={hvacSystem.min_outdoor_air_rate}
                          onChange={(e) => setHvacSystem({...hvacSystem, min_outdoor_air_rate: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">ASHRAE 62.1 requirement</p>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Controls */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Controls</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Economizer</p>
                          <p className="text-sm text-gray-600">Free cooling with outdoor air</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hvacSystem.economizer_enabled}
                            onChange={(e) => setHvacSystem({...hvacSystem, economizer_enabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Heat Recovery</p>
                          <p className="text-sm text-gray-600">Energy recovery ventilation</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hvacSystem.heat_recovery_enabled}
                            onChange={(e) => setHvacSystem({...hvacSystem, heat_recovery_enabled: e.target.checked})}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {hvacSystem.heat_recovery_enabled && (
                        <div className="ml-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Heat Recovery Effectiveness
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={hvacSystem.heat_recovery_effectiveness}
                            onChange={(e) => setHvacSystem({...hvacSystem, heat_recovery_effectiveness: parseFloat(e.target.value)})}
                            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <p className="text-xs text-gray-500 mt-1">Typical: 0.60 - 0.80</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Supply Air Temp - Cooling (°C)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={hvacSystem.supply_air_temp_cooling}
                            onChange={(e) => setHvacSystem({...hvacSystem, supply_air_temp_cooling: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Supply Air Temp - Heating (°C)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={hvacSystem.supply_air_temp_heating}
                            onChange={(e) => setHvacSystem({...hvacSystem, supply_air_temp_heating: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'design' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Design Conditions</h2>
                <p className="text-sm text-gray-600">
                  Configure location and weather design conditions for load calculations
                </p>

                <div className="space-y-8">
                  {/* Location */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Latitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={designConditions.latitude}
                          onChange={(e) => setDesignConditions({...designConditions, latitude: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Longitude
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={designConditions.longitude}
                          onChange={(e) => setDesignConditions({...designConditions, longitude: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Elevation (m)
                        </label>
                        <input
                          type="number"
                          value={designConditions.elevation}
                          onChange={(e) => setDesignConditions({...designConditions, elevation: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Timezone
                        </label>
                        <select
                          value={designConditions.timezone}
                          onChange={(e) => setDesignConditions({...designConditions, timezone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="America/New_York">Eastern (US)</option>
                          <option value="America/Chicago">Central (US)</option>
                          <option value="America/Denver">Mountain (US)</option>
                          <option value="America/Los_Angeles">Pacific (US)</option>
                          <option value="Europe/London">GMT (London)</option>
                          <option value="Europe/Paris">CET (Paris)</option>
                          <option value="Asia/Tokyo">JST (Tokyo)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summer Design Conditions */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Summer Design (Cooling)</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dry Bulb 0.4% (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.cooling_db_004}
                          onChange={(e) => setDesignConditions({...designConditions, cooling_db_004: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Design dry bulb temperature</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wet Bulb 0.4% (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.cooling_wb_004}
                          onChange={(e) => setDesignConditions({...designConditions, cooling_wb_004: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Coincident wet bulb temperature</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Daily Temperature Range (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.cooling_daily_range}
                          onChange={(e) => setDesignConditions({...designConditions, cooling_daily_range: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical: 8 - 15°C</p>
                      </div>
                    </div>
                  </div>

                  {/* Winter Design Conditions */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Winter Design (Heating)</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dry Bulb 99.6% (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.heating_db_996}
                          onChange={(e) => setDesignConditions({...designConditions, heating_db_996: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Design heating temperature</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Wet Bulb 99.6% (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.heating_wb_996}
                          onChange={(e) => setDesignConditions({...designConditions, heating_wb_996: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ground Temperature */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ground & Soil</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Ground Temperature (°C)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={designConditions.ground_temp}
                          onChange={(e) => setDesignConditions({...designConditions, ground_temp: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Annual average</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'calculation' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Calculation Parameters</h2>
                <p className="text-sm text-gray-600">
                  Configure calculation method and parameters
                </p>

                <div className="space-y-8">
                  {/* Method */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Calculation Method</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Method
                        </label>
                        <select
                          value={calcParams.calculation_method}
                          onChange={(e) => setCalcParams({...calcParams, calculation_method: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="heat_balance">Heat Balance Method (ASHRAE)</option>
                          <option value="rts">Radiant Time Series (RTS)</option>
                          <option value="cltd">CLTD/CLF Method</option>
                          <option value="transfer_function">Transfer Function Method</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Heat Balance is most accurate</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time Step (minutes)
                        </label>
                        <select
                          value={calcParams.time_step_minutes}
                          onChange={(e) => setCalcParams({...calcParams, time_step_minutes: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Run Period Start
                        </label>
                        <input
                          type="text"
                          value={calcParams.run_period_start}
                          onChange={(e) => setCalcParams({...calcParams, run_period_start: e.target.value})}
                          placeholder="1/1"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Run Period End
                        </label>
                        <input
                          type="text"
                          value={calcParams.run_period_end}
                          onChange={(e) => setCalcParams({...calcParams, run_period_end: e.target.value})}
                          placeholder="12/31"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Safety Factors */}
                  <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety Factors</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cooling Safety Factor
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={calcParams.cooling_safety_factor}
                          onChange={(e) => setCalcParams({...calcParams, cooling_safety_factor: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical: 1.10 - 1.20 (10-20% oversizing)</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Heating Safety Factor
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={calcParams.heating_safety_factor}
                          onChange={(e) => setCalcParams({...calcParams, heating_safety_factor: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Typical: 1.15 - 1.25</p>
                      </div>
                    </div>
                  </div>

                  {/* Diversity Factors */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Diversity Factors</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Account for non-simultaneous operation of loads
                    </p>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lighting Diversity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={calcParams.lighting_diversity}
                          onChange={(e) => setCalcParams({...calcParams, lighting_diversity: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fraction of lights on simultaneously</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Equipment Diversity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={calcParams.equipment_diversity}
                          onChange={(e) => setCalcParams({...calcParams, equipment_diversity: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fraction of equipment on simultaneously</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Occupancy Diversity
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={calcParams.occupancy_diversity}
                          onChange={(e) => setCalcParams({...calcParams, occupancy_diversity: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Fraction of occupants present simultaneously</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
