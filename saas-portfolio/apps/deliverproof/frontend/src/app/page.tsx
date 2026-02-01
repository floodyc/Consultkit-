'use client'

import { useState } from 'react'
import { CheckCircle2, Plus, Upload, Clock, Check, X, FileImage, ExternalLink } from 'lucide-react'

interface Deliverable {
  id: string
  title: string
  projectName: string
  clientName: string
  version: number
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'revision_requested'
  requestedAt?: string
  approvedAt?: string
  approvedBy?: string
}

const mockDeliverables: Deliverable[] = [
  { id: '1', title: 'Homepage Design v3', projectName: 'Website Redesign', clientName: 'Acme Corp', version: 3, status: 'approved', requestedAt: '2024-01-20', approvedAt: '2024-01-21', approvedBy: 'John (Acme)' },
  { id: '2', title: 'Mobile App Wireframes', projectName: 'Mobile App MVP', clientName: 'StartupXYZ', version: 2, status: 'pending', requestedAt: '2024-01-25' },
  { id: '3', title: 'Brand Guidelines PDF', projectName: 'Branding Package', clientName: 'RetailCo', version: 1, status: 'revision_requested', requestedAt: '2024-01-24' },
  { id: '4', title: 'Logo Final Files', projectName: 'Branding Package', clientName: 'RetailCo', version: 4, status: 'approved', requestedAt: '2024-01-22', approvedAt: '2024-01-22', approvedBy: 'Sarah (RetailCo)' },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileImage },
  pending: { label: 'Awaiting Approval', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: Check },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: X },
  revision_requested: { label: 'Revision Requested', color: 'bg-orange-100 text-orange-800', icon: Clock },
}

export default function Dashboard() {
  const [deliverables] = useState<Deliverable[]>(mockDeliverables)

  const stats = {
    total: deliverables.length,
    pending: deliverables.filter(d => d.status === 'pending').length,
    approved: deliverables.filter(d => d.status === 'approved').length,
    needsRevision: deliverables.filter(d => d.status === 'revision_requested').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <CheckCircle2 className="h-8 w-8 text-red-500" />
          <span className="text-xl font-bold text-white">DeliverProof</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <FileImage className="h-5 w-5" />
            Deliverables
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
            Approvals
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deliverables</h1>
            <p className="text-gray-600">Upload deliverables and get client sign-offs.</p>
          </div>
          <button className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            <Upload className="h-5 w-5" />
            Upload Deliverable
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Deliverables</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Awaiting Approval</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Approved</p>
            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Needs Revision</p>
            <p className="text-3xl font-bold text-orange-600">{stats.needsRevision}</p>
          </div>
        </div>

        {/* Deliverables List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">All Deliverables</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {deliverables.map((deliverable) => {
              const StatusIcon = statusConfig[deliverable.status].icon

              return (
                <div key={deliverable.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileImage className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{deliverable.title}</h3>
                      <p className="text-sm text-gray-600">{deliverable.projectName} &middot; {deliverable.clientName}</p>
                      <p className="text-xs text-gray-500">Version {deliverable.version}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      {deliverable.approvedAt ? (
                        <>
                          <p className="text-sm text-green-600">Approved {deliverable.approvedAt}</p>
                          <p className="text-xs text-gray-500">by {deliverable.approvedBy}</p>
                        </>
                      ) : deliverable.requestedAt ? (
                        <p className="text-sm text-gray-500">Requested {deliverable.requestedAt}</p>
                      ) : null}
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${statusConfig[deliverable.status].color}`}>
                      <StatusIcon className="h-4 w-4" />
                      {statusConfig[deliverable.status].label}
                    </span>
                    {deliverable.status === 'approved' && (
                      <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                        <ExternalLink className="h-4 w-4" />
                        Proof
                      </button>
                    )}
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
