'use client'

import { useState, useEffect } from 'react'
import { SessionProvider } from 'next-auth/react'
import Sidebar from './Sidebar'
import { Role } from '@prisma/client'

interface BudgetLayoutClientProps {
  children: React.ReactNode
  budgetId: string
  userRole: Role
}

export default function BudgetLayoutClient({
  children,
  budgetId,
  userRole,
}: BudgetLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Listen for close sidebar event from navigation
  useEffect(() => {
    const handleCloseSidebar = () => {
      setSidebarOpen(false)
    }
    window.addEventListener('closeSidebar', handleCloseSidebar)
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar)
  }, [])

  return (
    <SessionProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-700 dark:text-gray-300"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {sidebarOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Sidebar */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-40 transform ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        >
          <Sidebar budgetId={budgetId} userRole={userRole} />
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto w-full lg:w-auto">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}
