'use client'

import { useState } from 'react'
import { FolderOpen, Plus, Users, Mail, Phone, Building, Calendar, MoreVertical, Share2, FileText } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
  role: string
  roleColor: string
  isPrimary: boolean
}

interface Project {
  id: string
  name: string
  clientName: string
  status: 'draft' | 'active' | 'on_hold' | 'completed'
  startDate: string
  projectType: string
  contacts: Contact[]
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    clientName: 'TechCorp Inc.',
    status: 'active',
    startDate: 'Jan 15, 2025',
    projectType: 'Fixed',
    contacts: [
      { id: '1', name: 'John Smith', email: 'john@techcorp.com', phone: '555-0101', role: 'Primary Contact', roleColor: 'bg-blue-100 text-blue-800', isPrimary: true },
      { id: '2', name: 'Sarah Johnson', email: 'sarah@techcorp.com', phone: '555-0102', role: 'Approver', roleColor: 'bg-green-100 text-green-800', isPrimary: false },
    ]
  },
  {
    id: '2',
    name: 'Brand Strategy',
    clientName: 'StartupXYZ',
    status: 'active',
    startDate: 'Feb 1, 2025',
    projectType: 'Retainer',
    contacts: [
      { id: '3', name: 'Mike Chen', email: 'mike@startupxyz.com', phone: '555-0201', role: 'Primary Contact', roleColor: 'bg-blue-100 text-blue-800', isPrimary: true },
    ]
  },
  {
    id: '3',
    name: 'Q1 Marketing Campaign',
    clientName: 'BigCo',
    status: 'draft',
    startDate: 'Feb 10, 2025',
    projectType: 'Fixed',
    contacts: []
  },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  on_hold: { label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
}

export default function Dashboard() {
  const [projects] = useState<Project[]>(mockProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(mockProjects[0])

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    totalContacts: projects.reduce((acc, p) => acc + p.contacts.length, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-800">
          <FolderOpen className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold text-white">ProjectStart</span>
        </div>
        <nav className="px-4 py-6 space-y-2">
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-white bg-gray-800 rounded-lg">
            <FolderOpen className="h-5 w-5" />
            Projects
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg">
            <Users className="h-5 w-5" />
            Contacts
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600">Manage project info and team contacts.</p>
          </div>
          <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600">
            <Plus className="h-5 w-5" />
            New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-3xl font-bold text-emerald-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600 mb-1">Total Contacts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalContacts}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Projects List */}
          <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">All Projects</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 ${selectedProject?.id === project.id ? 'bg-emerald-50 border-l-2 border-emerald-500' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <p className="text-sm text-gray-500">{project.clientName}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${statusConfig[project.status].color}`}>
                      {statusConfig[project.status].label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Project Details */}
          <div className="col-span-2 space-y-6">
            {selectedProject ? (
              <>
                {/* Project Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedProject.name}</h2>
                      <p className="text-gray-600 flex items-center gap-2 mt-1">
                        <Building className="h-4 w-4" />
                        {selectedProject.clientName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <FileText className="h-5 w-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <span className={`inline-block mt-1 text-xs font-medium px-2 py-1 rounded ${statusConfig[selectedProject.status].color}`}>
                        {statusConfig[selectedProject.status].label}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Start Date</p>
                      <p className="text-gray-900 flex items-center gap-1 mt-1">
                        <Calendar className="h-4 w-4" />
                        {selectedProject.startDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Project Type</p>
                      <p className="text-gray-900 mt-1">{selectedProject.projectType}</p>
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Team Contacts</h3>
                    <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </button>
                  </div>
                  {selectedProject.contacts.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {selectedProject.contacts.map((contact) => (
                        <div key={contact.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 flex items-center gap-2">
                                {contact.name}
                                {contact.isPrimary && (
                                  <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">Primary</span>
                                )}
                              </p>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded ${contact.roleColor}`}>
                                {contact.role}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {contact.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-12 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No contacts yet</p>
                      <p className="text-sm">Add team members and stakeholders</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center text-gray-500">
                <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Select a project to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
