'use client'

import { useState } from 'react'
import { Shield, Plus, FileText, Users, Settings, LogOut } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  clientName: string
  scopeItems: number
  pendingChanges: number
  status: 'active' | 'archived'
}

const mockProjects: Project[] = [
  { id: '1', name: 'Website Redesign', clientName: 'Acme Corp', scopeItems: 12, pendingChanges: 2, status: 'active' },
  { id: '2', name: 'Mobile App MVP', clientName: 'StartupXYZ', scopeItems: 8, pendingChanges: 0, status: 'active' },
  { id: '3', name: 'E-commerce Integration', clientName: 'RetailCo', scopeItems: 15, pendingChanges: 1, status: 'active' },
]

export default function Dashboard() {
  const [projects] = useState<Project[]>(mockProjects)

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <Shield className="h-8 w-8 text-orange-500" />
          <span className="text-xl font-bold text-white">ScopeStack</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <FileText className="h-5 w-5" />
            Projects
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Users className="h-5 w-5" />
            Client Portals
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Settings className="h-5 w-5" />
            Settings
          </a>
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <button className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white w-full">
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Track scope and change requests across all your projects.</p>
          </div>
          <Link
            href="/projects/new"
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
          >
            <Plus className="h-5 w-5" />
            New Project
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Active Projects</p>
            <p className="text-3xl font-bold text-gray-900">{projects.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Scope Items</p>
            <p className="text-3xl font-bold text-gray-900">{projects.reduce((acc, p) => acc + p.scopeItems, 0)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Pending Changes</p>
            <p className="text-3xl font-bold text-orange-500">{projects.reduce((acc, p) => acc + p.pendingChanges, 0)}</p>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">All Projects</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.clientName}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{project.scopeItems} items</p>
                    <p className="text-sm text-gray-600">in scope</p>
                  </div>
                  {project.pendingChanges > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-3 py-1 rounded-full">
                      {project.pendingChanges} pending
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
