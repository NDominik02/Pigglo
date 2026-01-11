'use client'

import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'
import Button from './ui/Button'

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white dark:bg-black border-b border-amber-200 dark:border-amber-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Pigglo
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {session?.user?.name || session?.user?.email}
            </div>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
