'use client'

import { useState } from 'react'
import { Clock, Plus, Users, AlertTriangle, TrendingUp } from 'lucide-react'

interface Retainer {
  id: string
  clientName: string
  monthlyHours: number
  usedHours: number
  hourlyRate: number
  status: 'active' | 'paused' | 'ended'
}

const mockRetainers: Retainer[] = [
  { id: '1', clientName: 'TechStartup Inc', monthlyHours: 40, usedHours: 32, hourlyRate: 150, status: 'active' },
  { id: '2', clientName: 'Marketing Agency Co', monthlyHours: 20, usedHours: 18, hourlyRate: 125, status: 'active' },
  { id: '3', clientName: 'E-commerce Brand', monthlyHours: 30, usedHours: 12, hourlyRate: 175, status: 'active' },
]

export default function Dashboard() {
  const [retainers] = useState<Retainer[]>(mockRetainers)

  const getBurnRate = (used: number, total: number) => {
    const percentage = (used / total) * 100
    if (percentage >= 100) return 'text-red-600 bg-red-100'
    if (percentage >= 80) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const totalMonthlyValue = retainers.reduce((acc, r) => acc + (r.monthlyHours * r.hourlyRate), 0)
  const totalUsedHours = retainers.reduce((acc, r) => acc + r.usedHours, 0)
  const totalAvailableHours = retainers.reduce((acc, r) => acc + r.monthlyHours, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Clock className="h-8 w-8 text-cyan-500" />
          <span className="text-xl font-bold text-white">RetainerPulse</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <TrendingUp className="h-5 w-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Users className="h-5 w-5" />
            Retainers
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Track retainer hours across all clients.</p>
          </div>
          <button className="flex items-center gap-2 bg-cyan-500 text-white px-4 py-2 rounded-lg hover:bg-cyan-600">
            <Plus className="h-5 w-5" />
            New Retainer
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Active Retainers</p>
            <p className="text-3xl font-bold text-gray-900">{retainers.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Monthly Value</p>
            <p className="text-3xl font-bold text-gray-900">${totalMonthlyValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Hours Used</p>
            <p className="text-3xl font-bold text-gray-900">{totalUsedHours}/{totalAvailableHours}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Utilization</p>
            <p className="text-3xl font-bold text-cyan-600">{Math.round((totalUsedHours / totalAvailableHours) * 100)}%</p>
          </div>
        </div>

        {/* Retainer Cards */}
        <div className="grid grid-cols-3 gap-6">
          {retainers.map((retainer) => {
            const percentage = Math.round((retainer.usedHours / retainer.monthlyHours) * 100)
            const remaining = retainer.monthlyHours - retainer.usedHours

            return (
              <div key={retainer.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{retainer.clientName}</h3>
                    <p className="text-sm text-gray-600">${retainer.hourlyRate}/hr</p>
                  </div>
                  {percentage >= 80 && (
                    <AlertTriangle className={`h-5 w-5 ${percentage >= 100 ? 'text-red-500' : 'text-yellow-500'}`} />
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{retainer.usedHours}h used</span>
                    <span className="text-gray-600">{remaining}h remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium px-2 py-1 rounded ${getBurnRate(retainer.usedHours, retainer.monthlyHours)}`}>
                    {percentage}% used
                  </span>
                  <button className="text-sm text-cyan-600 hover:text-cyan-700">
                    Log Hours
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
