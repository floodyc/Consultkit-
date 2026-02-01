'use client'

import { useState } from 'react'
import { FileText, Plus, Send, Eye, Check, X, Clock } from 'lucide-react'

interface Proposal {
  id: string
  title: string
  clientName: string
  value: number
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined'
  sentAt?: string
  viewedAt?: string
}

const mockProposals: Proposal[] = [
  { id: '1', title: 'Website Redesign Proposal', clientName: 'Acme Corp', value: 15000, status: 'accepted', sentAt: '2024-01-20', viewedAt: '2024-01-21' },
  { id: '2', title: 'Mobile App Development', clientName: 'StartupXYZ', value: 45000, status: 'viewed', sentAt: '2024-01-25', viewedAt: '2024-01-26' },
  { id: '3', title: 'Brand Strategy Package', clientName: 'RetailCo', value: 8000, status: 'sent', sentAt: '2024-01-28' },
  { id: '4', title: 'E-commerce Integration', clientName: 'FoodBrand', value: 22000, status: 'draft' },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText },
  sent: { label: 'Sent', color: 'bg-blue-100 text-blue-800', icon: Send },
  viewed: { label: 'Viewed', color: 'bg-yellow-100 text-yellow-800', icon: Eye },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: Check },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: X },
}

export default function Dashboard() {
  const [proposals] = useState<Proposal[]>(mockProposals)

  const stats = {
    total: proposals.length,
    sent: proposals.filter(p => p.status !== 'draft').length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    totalValue: proposals.filter(p => p.status === 'accepted').reduce((acc, p) => acc + p.value, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <FileText className="h-8 w-8 text-purple-500" />
          <span className="text-xl font-bold text-white">ProposalForge</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <FileText className="h-5 w-5" />
            Proposals
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Clock className="h-5 w-5" />
            Block Library
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-600">Create and track your client proposals.</p>
          </div>
          <button className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600">
            <Plus className="h-5 w-5" />
            New Proposal
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Proposals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Sent</p>
            <p className="text-3xl font-bold text-gray-900">{stats.sent}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Accepted</p>
            <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Won Value</p>
            <p className="text-3xl font-bold text-purple-600">${stats.totalValue.toLocaleString()}</p>
          </div>
        </div>

        {/* Proposals List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">All Proposals</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {proposals.map((proposal) => {
              const StatusIcon = statusConfig[proposal.status].icon

              return (
                <div key={proposal.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{proposal.title}</h3>
                      <p className="text-sm text-gray-600">{proposal.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium text-gray-900">${proposal.value.toLocaleString()}</p>
                      {proposal.sentAt && (
                        <p className="text-sm text-gray-500">Sent {proposal.sentAt}</p>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${statusConfig[proposal.status].color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusConfig[proposal.status].label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
