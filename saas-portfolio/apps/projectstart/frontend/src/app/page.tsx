'use client'

import { useState } from 'react'
import { FolderOpen, Mail, ArrowRight, Check } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSubmitted(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <FolderOpen className="h-10 w-10 text-emerald-500" />
            <span className="text-2xl font-bold text-white">ProjectStart</span>
          </div>
          <p className="text-gray-400 mt-2">Part of ConsultKit</p>
        </div>

        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Kick off every project<br />the right way
          </h1>
          <p className="text-xl text-gray-400">
            Capture contacts, roles, and project details in one place.
            Share with clients. Stay organized from day one.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Free forever - no credit card required</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Unlimited projects and contacts</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Shareable client view links</span>
            </div>
            <div className="flex items-center gap-3 text-gray-300">
              <Check className="h-5 w-5 text-emerald-500" />
              <span>Export project briefs as PDF</span>
            </div>
          </div>
        </div>

        <div className="text-gray-500 text-sm">
          &copy; 2026 ConsultKit. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <FolderOpen className="h-10 w-10 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900">ProjectStart</span>
          </div>

          {!isSubmitted ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Get started free
              </h2>
              <p className="text-gray-600 mb-8">
                Enter your email to sign in or create an account
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Work email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-500 text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Continue with email
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-50 text-gray-500">or</span>
                  </div>
                </div>

                <button className="mt-6 w-full border border-gray-300 bg-white text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>

              <p className="mt-8 text-center text-sm text-gray-500">
                By continuing, you agree to our{' '}
                <a href="#" className="text-emerald-600 hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-emerald-600 hover:underline">Privacy Policy</a>
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Check your email
              </h2>
              <p className="text-gray-600 mb-6">
                We sent a magic link to<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
              <p className="text-sm text-gray-500">
                Click the link in the email to sign in. No password needed.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="mt-8 text-emerald-600 hover:underline font-medium"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
