'use client'

import {
  FolderOpen,
  Clock,
  FileText,
  LayoutDashboard,
  Shield,
  CheckCircle2,
  ArrowRight,
  ChevronDown
} from 'lucide-react'

const apps = [
  {
    id: 'projectstart',
    name: 'ProjectStart',
    tagline: 'Kick off projects the right way',
    description: 'Capture project info, team contacts, and roles in one place. Share with clients. The source of truth for every engagement.',
    price: 'CAD $29/mo',
    icon: FolderOpen,
    color: 'bg-emerald-500',
    href: 'https://projectstart.consultkit.com'
  },
  {
    id: 'proposalforge',
    name: 'ProposalForge',
    tagline: 'Send proposals in minutes, not hours',
    description: 'Build professional proposals with reusable blocks. Drag, drop, customize, send. Track opens and acceptances.',
    price: 'CAD $59/mo',
    icon: FileText,
    color: 'bg-purple-500',
    href: 'https://proposalforge.consultkit.com'
  },
  {
    id: 'scopestack',
    name: 'ScopeStack',
    tagline: 'Document scope changes before they kill your margin',
    description: 'Log every scope discussion with timestamps. Track change requests with approval workflow. Export for contracts and invoices.',
    price: 'CAD $49/mo',
    icon: Shield,
    color: 'bg-orange-500',
    href: 'https://scopestack.consultkit.com'
  },
  {
    id: 'retainerpulse',
    name: 'RetainerPulse',
    tagline: 'Track retainer hours with client visibility',
    description: 'Log hours by client with real-time burn rate. Alerts before overages. Client portal shows usage. No surprises at invoice time.',
    price: 'CAD $39/mo',
    icon: Clock,
    color: 'bg-cyan-500',
    href: 'https://retainerpulse.consultkit.com'
  },
  {
    id: 'clientboard',
    name: 'ClientBoard',
    tagline: 'End "where are we?" emails forever',
    description: 'Give clients a simple status portal. Post async updates. They see progress without calling you. Weekly digests keep them informed.',
    price: 'CAD $29/mo',
    icon: LayoutDashboard,
    color: 'bg-green-500',
    href: 'https://clientboard.consultkit.com'
  },
  {
    id: 'deliverproof',
    name: 'DeliverProof',
    tagline: 'Get sign-offs that stick',
    description: 'Upload deliverables, request approval, get timestamped sign-offs. When clients say "I never approved that," you have proof.',
    price: 'CAD $49/mo',
    icon: CheckCircle2,
    color: 'bg-red-500',
    href: 'https://deliverproof.consultkit.com'
  }
]

const bundles = [
  {
    name: 'Project Kickoff',
    apps: ['ProjectStart', 'ProposalForge'],
    discount: '20%',
    price: 'CAD $70/mo',
    originalPrice: 'CAD $88'
  },
  {
    name: 'Scope Protection',
    apps: ['ScopeStack', 'DeliverProof'],
    discount: '20%',
    price: 'CAD $78/mo',
    originalPrice: 'CAD $98'
  },
  {
    name: 'Client Visibility',
    apps: ['RetainerPulse', 'ClientBoard'],
    discount: '20%',
    price: 'CAD $54/mo',
    originalPrice: 'CAD $68'
  },
  {
    name: 'Full Suite',
    apps: ['All 6 apps'],
    discount: '35%',
    price: 'CAD $165/mo',
    originalPrice: 'CAD $254'
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">ConsultKit</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#apps" className="text-gray-600 hover:text-gray-900">Apps</a>
              <a href="#bundles" className="text-gray-600 hover:text-gray-900">Bundles</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it Works</a>
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Tools that protect your margins<br />and your sanity
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Six focused apps for agencies and consultancies. Stop scope creep.
              Eliminate status update emails. Get paid without disputes.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="#apps"
                className="bg-gray-900 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-800 flex items-center"
              >
                See All Tools
                <ChevronDown className="ml-2 h-5 w-5" />
              </a>
              <a
                href="#projectstart"
                className="border-2 border-gray-900 text-gray-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100"
              >
                Start with ProjectStart
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Built for how client work actually happens
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Each app stands alone. Use one or use all six. No bloated platforms.
            No features you'll never use.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm">
            <span className="bg-white px-4 py-2 rounded-full text-gray-600">New project</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-medium">ProjectStart</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">ProposalForge</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-medium">ScopeStack</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-cyan-100 text-cyan-800 px-4 py-2 rounded-full font-medium">RetainerPulse</span>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">ClientBoard</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-medium">DeliverProof</span>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <span className="bg-white px-4 py-2 rounded-full text-gray-600">Get Paid</span>
          </div>
        </div>
      </section>

      {/* Apps Grid */}
      <section id="apps" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            Six apps. Six problems solved.
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-16">
            Each tool does one thing well. Start where it hurts most.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apps.map((app) => (
              <div
                key={app.id}
                id={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`${app.color} w-12 h-12 rounded-lg flex items-center justify-center mb-6`}>
                  <app.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{app.name}</h3>
                <p className="text-gray-600 font-medium mb-4">{app.tagline}</p>
                <p className="text-gray-500 text-sm mb-6">{app.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{app.price}</span>
                  <a
                    href={app.href}
                    className="text-gray-900 font-medium hover:underline flex items-center"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bundles Section */}
      <section id="bundles" className="bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-4">
            Better together (but not required)
          </h2>
          <p className="text-center text-gray-400 max-w-2xl mx-auto mb-16">
            Apps that naturally pair together. Save when you bundle.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((bundle) => (
              <div
                key={bundle.name}
                className="bg-gray-800 rounded-xl p-6 border border-gray-700"
              >
                <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-4">
                  {bundle.discount} OFF
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{bundle.name}</h3>
                <p className="text-gray-400 text-sm mb-4">
                  {bundle.apps.join(' + ')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{bundle.price}</span>
                  <span className="text-gray-500 line-through text-sm">{bundle.originalPrice}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            How ConsultKit Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pick Your Pain</h3>
              <p className="text-gray-600">
                Start with the app that solves your most expensive problem.
                Most agencies start with ProjectStart or ScopeStack.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Start Free</h3>
              <p className="text-gray-600">
                Every app has a free tier. Use it for real projects.
                Upgrade when you hit limits or need team features.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-gray-900">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Add What Helps</h3>
              <p className="text-gray-600">
                Using ScopeStack? Add DeliverProof to close the loop on approvals.
                Each app makes the others more valuable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Which problem hurts most?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Every tool has a 14-day free trial. No credit card required to start.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#projectstart" className="bg-emerald-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-600">
              Project Kickoff
            </a>
            <a href="#scopestack" className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600">
              Scope Creep
            </a>
            <a href="#clientboard" className="bg-green-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-600">
              Status Updates
            </a>
            <a href="#deliverproof" className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600">
              Approval Disputes
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold text-gray-900">ConsultKit</span>
              <p className="text-gray-600 mt-4 text-sm">
                Operational tools for agencies and consultancies.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Apps</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#projectstart" className="hover:text-gray-900">ProjectStart</a></li>
                <li><a href="#proposalforge" className="hover:text-gray-900">ProposalForge</a></li>
                <li><a href="#scopestack" className="hover:text-gray-900">ScopeStack</a></li>
                <li><a href="#retainerpulse" className="hover:text-gray-900">RetainerPulse</a></li>
                <li><a href="#clientboard" className="hover:text-gray-900">ClientBoard</a></li>
                <li><a href="#deliverproof" className="hover:text-gray-900">DeliverProof</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">About</a></li>
                <li><a href="#" className="hover:text-gray-900">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-600">
            &copy; 2026 ConsultKit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
