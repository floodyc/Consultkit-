import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScopeStack - Document Scope Changes Before They Kill Your Margin',
  description: 'Log every scope discussion. Track change requests. Get client approval. Protect your margins.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">{children}</body>
    </html>
  )
}
