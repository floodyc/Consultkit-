'use client'

import { useState } from 'react'
import { LayoutDashboard, Plus, MessageSquare, ExternalLink, Settings } from 'lucide-react'

interface Project {
  id: string
  name: string
  clientName: string
  currentStage: string
  stages: string[]
  lastUpdate: string
  updatesCount: number
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    clientName: 'Acme Corp',
    currentStage: 'Development',
    stages: ['Discovery', 'Design', 'Development', 'Testing', 'Launch'],
    lastUpdate: '2 hours ago',
    updatesCount: 12
  },
  {
    id: '2',
    name: 'Mobile App MVP',
    clientName: 'StartupXYZ',
    currentStage: 'Design',
    stages: ['Planning', 'Design', 'Build', 'Beta', 'Launch'],
    lastUpdate: '1 day ago',
    updatesCount: 8
  },
  {
    id: '3',
    name: 'Brand Guidelines',
    clientName: 'RetailCo',
    currentStage: 'Review',
    stages: ['Research', 'Concepts', 'Refinement', 'Review', 'Delivery'],
    lastUpdate: '3 days ago',
    updatesCount: 5
  },
]

export default function Dashboard() {
  const [projects] = useState<Project[]>(mockProjects)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <LayoutDashboard className="h-8 w-8 text-green-500" />
          <span className="text-xl font-bold text-white">ClientBoard</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <LayoutDashboard className="h-5 w-5" />
            Projects
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Settings className="h-5 w-5" />
            Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Give clients visibility without giving up your time.</p>
          </div>
          <button className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Project Cards */}
        <div className="grid gap-6">
          {projects.map((project) => {
            const stageIndex = project.stages.indexOf(project.currentStage)
            const progress = ((stageIndex + 1) / project.stages.length) * 100

            return (
              <div key={project.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600">{project.clientName}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                      <ExternalLink className="h-4 w-4" />
                      Client Portal
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 border border-green-300 rounded hover:bg-green-50">
                      <MessageSquare className="h-4 w-4" />
                      Post Update
                    </button>
                  </div>
                </div>

                {/* Stage Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Current: {project.currentStage}</span>
                    <span>{Math.round(progress)}% complete</span>
                  </div>
                  <div className="flex gap-1">
                    {project.stages.map((stage, index) => (
                      <div
                        key={stage}
                        className={`flex-1 h-2 rounded ${
                          index <= stageIndex ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {project.stages.map((stage) => (
                      <span key={stage} className="truncate px-1">{stage}</span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{project.updatesCount} updates posted</span>
                  <span>Last update: {project.lastUpdate}</span>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
