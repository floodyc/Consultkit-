'use client'

import { useState } from 'react'
import { Filter, Plus, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  company: string
  budget: string
  score: number
  status: 'new' | 'qualified' | 'unqualified' | 'contacted' | 'converted'
  formName: string
  createdAt: string
}

const mockLeads: Lead[] = [
  { id: '1', name: 'John Smith', email: 'john@techcorp.com', company: 'TechCorp', budget: '$25k-50k', score: 85, status: 'qualified', formName: 'Website Inquiry', createdAt: '2 hours ago' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@startup.io', company: 'Startup.io', budget: '$10k-25k', score: 72, status: 'new', formName: 'Website Inquiry', createdAt: '5 hours ago' },
  { id: '3', name: 'Mike Chen', email: 'mike@bigco.com', company: 'BigCo', budget: '$50k+', score: 95, status: 'contacted', formName: 'Enterprise Form', createdAt: '1 day ago' },
  { id: '4', name: 'Lisa Park', email: 'lisa@small.biz', company: 'SmallBiz', budget: 'Under $5k', score: 35, status: 'unqualified', formName: 'Website Inquiry', createdAt: '2 days ago' },
]

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: Clock },
  qualified: { label: 'Qualified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  unqualified: { label: 'Unqualified', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  contacted: { label: 'Contacted', color: 'bg-yellow-100 text-yellow-800', icon: Users },
  converted: { label: 'Converted', color: 'bg-purple-100 text-purple-800', icon: TrendingUp },
}

export default function Dashboard() {
  const [leads] = useState<Lead[]>(mockLeads)

  const stats = {
    total: leads.length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    avgScore: Math.round(leads.reduce((acc, l) => acc + l.score, 0) / leads.length),
    conversionRate: Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Filter className="h-8 w-8 text-blue-500" />
          <span className="text-xl font-bold text-white">LeadGate</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <Users className="h-5 w-5" />
            Leads
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Filter className="h-5 w-5" />
            Forms
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600">Qualified leads from your intake forms.</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
            <Plus className="h-5 w-5" />
            New Form
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Leads</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Qualified</p>
            <p className="text-3xl font-bold text-green-600">{stats.qualified}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Avg Score</p>
            <p className="text-3xl font-bold text-gray-900">{stats.avgScore}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Conversion Rate</p>
            <p className="text-3xl font-bold text-blue-600">{stats.conversionRate}%</p>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Form</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leads.map((lead) => {
                const StatusIcon = statusConfig[lead.status].icon

                return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{lead.name}</p>
                        <p className="text-sm text-gray-500">{lead.email}</p>
                        <p className="text-sm text-gray-500">{lead.company}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{lead.budget}</td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${lead.score >= 70 ? 'text-green-600' : lead.score >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {lead.score}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded w-fit ${statusConfig[lead.status].color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig[lead.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.formName}</td>
                    <td className="px-6 py-4 text-gray-500">{lead.createdAt}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
