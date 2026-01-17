'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function Billing() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)

  const creditPackages = [
    {
      id: 'starter',
      name: 'Starter Pack',
      credits: 25,
      price: 24.99,
      pricePerCredit: 1.00,
      popular: false,
      features: [
        '25 calculation credits',
        'Basic support',
        '30-day validity',
        'Email delivery',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      credits: 100,
      price: 79.99,
      pricePerCredit: 0.80,
      popular: true,
      features: [
        '100 calculation credits',
        'Priority support',
        '90-day validity',
        'Advanced reports',
        'API access',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      credits: 500,
      price: 299.99,
      pricePerCredit: 0.60,
      popular: false,
      features: [
        '500 calculation credits',
        'Dedicated support',
        '1-year validity',
        'Custom reports',
        'API access',
        'Team collaboration',
        'Bulk export',
      ],
    },
  ]

  const transactions = [
    { id: 1, date: '2026-01-15', type: 'Purchase', amount: 100, credits: 100, balance: 105 },
    { id: 2, date: '2026-01-10', type: 'Usage', amount: 0, credits: -25, balance: 5 },
    { id: 3, date: '2026-01-05', type: 'Purchase', amount: 24.99, credits: 25, balance: 30 },
    { id: 4, date: '2026-01-01', type: 'Signup Bonus', amount: 0, credits: 5, balance: 5 },
  ]

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const userData = await api.getMe()
      setUser(userData)
    } catch (err) {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (packageId: string) => {
    setProcessing(true)
    setSelectedPackage(packageId)

    try {
      // TODO: Stripe integration
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Purchase successful! (Demo mode - Stripe integration pending)')
      loadUser()
    } catch (err: any) {
      alert(err.message || 'Purchase failed')
    } finally {
      setProcessing(false)
      setSelectedPackage(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">HVACplus</h1>
              <div className="flex space-x-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-sm font-medium text-gray-700 hover:text-indigo-600"
                >
                  Projects
                </button>
                <button
                  onClick={() => router.push('/billing')}
                  className="text-sm font-medium text-indigo-600 border-b-2 border-indigo-600"
                >
                  Billing
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.full_name} • {user?.credits} credits
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Current Balance */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Available Credits</p>
              <p className="text-5xl font-bold mt-2">{user?.credits || 0}</p>
              <p className="text-indigo-100 text-sm mt-2">
                Credits are used for HVAC load calculations
              </p>
            </div>
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <p className="text-sm text-indigo-100">Cost per calculation</p>
                <p className="text-2xl font-bold mt-1">1-5 credits</p>
                <p className="text-xs text-indigo-100 mt-1">Based on project size</p>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Packages */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Purchase Credits</h2>
            <p className="text-gray-600 mt-2">Choose a package that fits your needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-lg shadow-lg overflow-hidden ${
                  pkg.popular ? 'ring-2 ring-indigo-600' : ''
                }`}
              >
                {pkg.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg">
                    Most Popular
                  </div>
                )}

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900">{pkg.name}</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">${pkg.price}</span>
                  </div>
                  <p className="mt-2 text-gray-600">
                    {pkg.credits} credits • ${pkg.pricePerCredit.toFixed(2)} per credit
                  </p>

                  <ul className="mt-6 space-y-4">
                    {pkg.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <svg
                          className="h-6 w-6 text-green-500 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="ml-3 text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={processing}
                    className={`mt-8 w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                      pkg.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700'
                        : 'bg-gray-800 hover:bg-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing && selectedPackage === pkg.id ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Purchase Now'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Methods */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Accepted Payment Methods</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <svg className="h-8 w-12" viewBox="0 0 48 32">
                  <rect width="48" height="32" rx="4" fill="#1434CB"/>
                  <text x="24" y="20" fill="white" fontSize="12" textAnchor="middle" fontWeight="bold">VISA</text>
                </svg>
                <span className="text-sm text-gray-600">Visa</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <svg className="h-8 w-12" viewBox="0 0 48 32">
                  <rect width="48" height="32" rx="4" fill="#EB001B"/>
                  <circle cx="20" cy="16" r="10" fill="#FF5F00"/>
                  <circle cx="28" cy="16" r="10" fill="#F79E1B"/>
                </svg>
                <span className="text-sm text-gray-600">Mastercard</span>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg">
                <svg className="h-8 w-12" viewBox="0 0 48 32">
                  <rect width="48" height="32" rx="4" fill="#016FD0"/>
                  <text x="24" y="20" fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">AMEX</text>
                </svg>
                <span className="text-sm text-gray-600">American Express</span>
              </div>
              <div className="px-4 py-2 border border-gray-300 rounded-lg">
                <span className="text-sm font-semibold text-gray-700">🔒 Secure by Stripe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'Purchase'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'Usage'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.amount > 0 ? `$${transaction.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={transaction.credits > 0 ? 'text-green-600' : 'text-red-600'}>
                        {transaction.credits > 0 ? '+' : ''}{transaction.credits}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.balance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">How are credits calculated?</h4>
              <p className="text-gray-600 text-sm">
                Credits are based on project complexity. Simple projects (1-10 spaces) use 1 credit per space.
                Larger projects have volume discounts. Each calculation consumes credits based on the number of spaces being calculated.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Do credits expire?</h4>
              <p className="text-gray-600 text-sm">
                Credits expire based on your package. Starter packs expire in 30 days, Professional in 90 days,
                and Enterprise credits last for 1 year from purchase.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h4>
              <p className="text-gray-600 text-sm">
                Unused credits can be refunded within 7 days of purchase. Contact support@hvacplus.com for refund requests.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is my payment information secure?</h4>
              <p className="text-gray-600 text-sm">
                Yes! We use Stripe for payment processing, which is PCI DSS compliant. We never store your credit card information on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
