'use client'

import { useState } from 'react'
import { Shield, ArrowLeft, Plus, Check, X, Download, Share2 } from 'lucide-react'
import Link from 'next/link'

interface ScopeItem {
  id: string
  title: string
  description: string
  estimatedHours: number
  estimatedCost: number
  status: 'included' | 'pending' | 'approved' | 'rejected'
  source: 'original' | 'change_request'
  createdAt: string
}

interface ChangeRequest {
  id: string
  title: string
  description: string
  requestedBy: string
  hoursDelta: number
  costDelta: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const mockProject = {
  id: '1',
  name: 'Website Redesign',
  clientName: 'Acme Corp',
  clientEmail: 'contact@acme.com',
}

const mockScopeItems: ScopeItem[] = [
  { id: '1', title: 'Homepage design', description: 'Complete redesign of homepage with new hero section', estimatedHours: 16, estimatedCost: 2400, status: 'included', source: 'original', createdAt: '2024-01-15' },
  { id: '2', title: 'About page', description: 'Team section and company history', estimatedHours: 8, estimatedCost: 1200, status: 'included', source: 'original', createdAt: '2024-01-15' },
  { id: '3', title: 'Contact form integration', description: 'Form with email notification', estimatedHours: 4, estimatedCost: 600, status: 'included', source: 'original', createdAt: '2024-01-15' },
  { id: '4', title: 'Blog section', description: 'Added blog with CMS', estimatedHours: 12, estimatedCost: 1800, status: 'approved', source: 'change_request', createdAt: '2024-01-20' },
]

const mockChangeRequests: ChangeRequest[] = [
  { id: '1', title: 'Add e-commerce functionality', description: 'Client wants to sell products directly on the site', requestedBy: 'John (Acme)', hoursDelta: 40, costDelta: 6000, status: 'pending', createdAt: '2024-01-25' },
  { id: '2', title: 'Multi-language support', description: 'French and Spanish translations', requestedBy: 'Sarah (Acme)', hoursDelta: 20, costDelta: 3000, status: 'pending', createdAt: '2024-01-26' },
]

export default function ProjectDetail({ params }: { params: { id: string } }) {
  const [scopeItems] = useState<ScopeItem[]>(mockScopeItems)
  const [changeRequests] = useState<ChangeRequest[]>(mockChangeRequests)
  const [showNewItemModal, setShowNewItemModal] = useState(false)

  const totalHours = scopeItems.filter(i => i.status === 'included' || i.status === 'approved').reduce((acc, i) => acc + i.estimatedHours, 0)
  const totalCost = scopeItems.filter(i => i.status === 'included' || i.status === 'approved').reduce((acc, i) => acc + i.estimatedCost, 0)
  const pendingHours = changeRequests.filter(cr => cr.status === 'pending').reduce((acc, cr) => acc + cr.hoursDelta, 0)
  const pendingCost = changeRequests.filter(cr => cr.status === 'pending').reduce((acc, cr) => acc + cr.costDelta, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-orange-500" />
                <span className="font-bold text-gray-900">ScopeStack</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Share2 className="h-4 w-4" />
                Client Portal
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Download className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{mockProject.name}</h1>
          <p className="text-gray-600">{mockProject.clientName} &middot; {mockProject.clientEmail}</p>
        </div>

        {/* Impact Summary */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Approved Scope</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours} hrs</p>
            <p className="text-sm text-gray-600">${totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Changes</p>
            <p className="text-2xl font-bold text-orange-500">+{pendingHours} hrs</p>
            <p className="text-sm text-orange-600">+${pendingCost.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">If All Approved</p>
            <p className="text-2xl font-bold text-gray-900">{totalHours + pendingHours} hrs</p>
            <p className="text-sm text-gray-600">${(totalCost + pendingCost).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Scope Items</p>
            <p className="text-2xl font-bold text-gray-900">{scopeItems.length}</p>
            <p className="text-sm text-gray-600">{changeRequests.filter(cr => cr.status === 'pending').length} pending</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Scope Items */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Scope Items</h2>
              <button
                onClick={() => setShowNewItemModal(true)}
                className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700"
              >
                <Plus className="h-4 w-4" />
                Add Item
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {scopeItems.map((item) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    {item.source === 'change_request' && (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                        Change
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{item.estimatedHours} hrs</span>
                    <span>${item.estimatedCost.toLocaleString()}</span>
                    <span className="text-gray-400">{item.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Change Requests */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Change Requests</h2>
              <button className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
                <Plus className="h-4 w-4" />
                New Request
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {changeRequests.map((request) => (
                <div key={request.id} className="px-6 py-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{request.title}</h3>
                      <p className="text-sm text-gray-600">{request.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>+{request.hoursDelta} hrs</span>
                    <span>+${request.costDelta.toLocaleString()}</span>
                    <span>by {request.requestedBy}</span>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
