'use client'

import { useState } from 'react'

interface SpaceEditorProps {
  space?: any
  onSave: (data: any) => void
  onCancel: () => void
}

export default function EnhancedSpaceEditor({ space, onSave, onCancel }: SpaceEditorProps) {
  const [activeTab, setActiveTab] = useState('basic')
  const [formData, setFormData] = useState({
    // Basic
    name: space?.name || '',
    number: space?.number || '',
    floor: space?.floor_number || 1,
    area: space?.area || 0,
    height: space?.ceiling_height || 3.0,
    volume: space?.volume || 0,

    // Space Type
    space_type: space?.space_type || 'office_enclosed',
    occupancy_category: space?.occupancy_category || 'office',

    // Thermal
    cooling_setpoint: space?.cooling_setpoint || 24.0,
    heating_setpoint: space?.heating_setpoint || 21.0,
    humidity_setpoint: space?.humidity_setpoint || 50,

    // Envelope
    exterior_wall_area: space?.exterior_wall_area || 0,
    window_area: space?.window_area || 0,
    window_to_wall_ratio: space?.window_to_wall_ratio || 0.3,
    orientation: space?.orientation || 0,

    // Internal Loads
    occupancy: space?.occupancy || 0,
    occupant_density: space?.occupant_density || 10, // m² per person
    lighting_watts: space?.lighting_watts || 0,
    lighting_density: space?.lighting_power_density || 10.0, // W/m²
    equipment_watts: space?.equipment_watts || 0,
    equipment_density: space?.equipment_power_density || 10.0, // W/m²

    // Schedules
    occupied_hours_start: space?.occupied_hours_start || '08:00',
    occupied_hours_end: space?.occupied_hours_end || '18:00',
    occupied_days: space?.occupied_days || 'weekdays',

    // Ventilation
    outdoor_air_rate: space?.outdoor_air_rate || 10.0, // L/s per person
    exhaust_rate: space?.exhaust_rate || 0,

    // Special
    process_load: space?.process_load || 0,
    heat_recovery: space?.heat_recovery || false,
    notes: space?.notes || '',
  })

  const spaceTypes = [
    { value: 'office_enclosed', label: 'Office - Enclosed' },
    { value: 'office_open', label: 'Office - Open Plan' },
    { value: 'conference', label: 'Conference Room' },
    { value: 'meeting', label: 'Meeting Room' },
    { value: 'classroom', label: 'Classroom' },
    { value: 'auditorium', label: 'Auditorium' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'dining', label: 'Dining Area' },
    { value: 'retail', label: 'Retail Space' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'corridor', label: 'Corridor' },
    { value: 'restroom', label: 'Restroom' },
    { value: 'mechanical', label: 'Mechanical Room' },
    { value: 'electrical', label: 'Electrical Room' },
    { value: 'storage', label: 'Storage' },
    { value: 'lobby', label: 'Lobby' },
    { value: 'reception', label: 'Reception' },
    { value: 'server_room', label: 'Server Room' },
    { value: 'data_center', label: 'Data Center' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: '📋' },
    { id: 'thermal', name: 'Thermal', icon: '🌡️' },
    { id: 'envelope', name: 'Envelope', icon: '🏗️' },
    { id: 'loads', name: 'Internal Loads', icon: '💡' },
    { id: 'schedules', name: 'Schedules', icon: '📅' },
    { id: 'ventilation', name: 'Ventilation', icon: '💨' },
  ]

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {space ? 'Edit Space' : 'Add New Space'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex -mb-px space-x-4 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {activeTab === 'basic' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Conference Room A"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({...formData, number: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., 101"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.floor}
                      onChange={(e) => setFormData({...formData, floor: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Space Type *
                    </label>
                    <select
                      value={formData.space_type}
                      onChange={(e) => setFormData({...formData, space_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {spaceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Floor Area (m²) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={formData.area}
                      onChange={(e) => setFormData({...formData, area: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ceiling Height (m) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="0"
                      value={formData.height}
                      onChange={(e) => setFormData({...formData, height: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes or special requirements..."
                  />
                </div>
              </div>
            )}

            {activeTab === 'thermal' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cooling Setpoint (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.cooling_setpoint}
                      onChange={(e) => setFormData({...formData, cooling_setpoint: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical: 22-26°C</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heating Setpoint (°C)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.heating_setpoint}
                      onChange={(e) => setFormData({...formData, heating_setpoint: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical: 20-22°C</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Humidity Setpoint (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.humidity_setpoint}
                      onChange={(e) => setFormData({...formData, humidity_setpoint: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Typical: 40-60%</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'envelope' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exterior Wall Area (m²)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.exterior_wall_area}
                      onChange={(e) => setFormData({...formData, exterior_wall_area: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Window Area (m²)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.window_area}
                      onChange={(e) => setFormData({...formData, window_area: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Window-to-Wall Ratio
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={formData.window_to_wall_ratio}
                      onChange={(e) => setFormData({...formData, window_to_wall_ratio: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Fraction (0.0 - 1.0)</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orientation (degrees)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="360"
                      value={formData.orientation}
                      onChange={(e) => setFormData({...formData, orientation: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">0=North, 90=East, 180=South, 270=West</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'loads' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Occupancy</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Occupants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.occupancy}
                        onChange={(e) => setFormData({...formData, occupancy: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupant Density (m²/person)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.occupant_density}
                        onChange={(e) => setFormData({...formData, occupant_density: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Lighting</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Lighting (W)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.lighting_watts}
                        onChange={(e) => setFormData({...formData, lighting_watts: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Lighting Power Density (W/m²)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.lighting_density}
                        onChange={(e) => setFormData({...formData, lighting_density: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Office: 10-15 W/m²</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Equipment</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total Equipment (W)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.equipment_watts}
                        onChange={(e) => setFormData({...formData, equipment_watts: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equipment Power Density (W/m²)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={formData.equipment_density}
                        onChange={(e) => setFormData({...formData, equipment_density: parseFloat(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Office: 10-20 W/m²</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Special Loads</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Process Load (W)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.process_load}
                      onChange={(e) => setFormData({...formData, process_load: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">e.g., kitchen equipment, manufacturing processes</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupancy Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.occupied_hours_start}
                      onChange={(e) => setFormData({...formData, occupied_hours_start: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupancy End Time
                    </label>
                    <input
                      type="time"
                      value={formData.occupied_hours_end}
                      onChange={(e) => setFormData({...formData, occupied_hours_end: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Occupied Days
                    </label>
                    <select
                      value={formData.occupied_days}
                      onChange={(e) => setFormData({...formData, occupied_days: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="weekdays">Weekdays (Mon-Fri)</option>
                      <option value="weekdays_plus_sat">Weekdays + Saturday</option>
                      <option value="all_week">All Week (Mon-Sun)</option>
                      <option value="custom">Custom Schedule</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ventilation' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outdoor Air Rate (L/s·person)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.outdoor_air_rate}
                      onChange={(e) => setFormData({...formData, outdoor_air_rate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">ASHRAE 62.1: Office = 10 L/s·person</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exhaust Rate (L/s)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.exhaust_rate}
                      onChange={(e) => setFormData({...formData, exhaust_rate: parseFloat(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">For bathrooms, kitchens, labs</p>
                  </div>
                </div>

                <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Enable Heat Recovery</p>
                    <p className="text-sm text-gray-600">Energy recovery from exhaust air</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.heat_recovery}
                      onChange={(e) => setFormData({...formData, heat_recovery: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
            >
              {space ? 'Save Changes' : 'Add Space'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
