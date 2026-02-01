import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ConsultKit - Tools for Client-Service Businesses',
  description: 'Six focused apps for agencies and consultancies. Stop scope creep. Eliminate status update emails. Get paid without disputes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
