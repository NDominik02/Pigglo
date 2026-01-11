'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import Link from 'next/link'
import Button from './ui/Button'
import ThemeToggle from './ThemeToggle'

interface SidebarProps {
  budgetId: string
  userRole: 'OWNER' | 'ADMIN' | 'VISITOR'
}

export default function Sidebar({ budgetId, userRole }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const handleExit = () => {
    router.push('/dashboard')
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  // Close sidebar on mobile when route changes
  useEffect(() => {
    const handleRouteChange = () => {
      if (window.innerWidth < 1024) {
        // Trigger close by dispatching a custom event
        window.dispatchEvent(new CustomEvent('closeSidebar'))
      }
    }
    handleRouteChange()
  }, [pathname])

  const navItems = [
    { path: `/budget/${budgetId}`, label: 'Planner', icon: '📊' },
    { path: `/budget/${budgetId}/statistics`, label: 'Statistics', icon: '📈' },
    { path: `/budget/${budgetId}/transactions`, label: 'Transactions', icon: '💰' },
    { path: `/budget/${budgetId}/categories`, label: 'Categories', icon: '📁' },
  ]

  if (userRole === 'OWNER') {
    navItems.push({ path: `/budget/${budgetId}/settings`, label: 'Settings', icon: '⚙️' })
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen flex flex-col shadow-lg lg:shadow-none">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Button variant="ghost" size="sm" onClick={handleExit} className="w-full justify-start">
          ← Exit Budget
        </Button>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => {
              // Close sidebar on mobile when navigating
              if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                window.dispatchEvent(new CustomEvent('closeSidebar'))
              }
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
