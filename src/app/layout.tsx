import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IES GEM-AI Loads Tool - Professional Load Calculations',
  description: 'ASHRAE heating and cooling load calculation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
