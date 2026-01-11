import Navbar from '@/components/Navbar'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }
  
  return (
    <SessionProviderWrapper>
      <div className="min-h-screen bg-white dark:bg-black">
        <Navbar />
        <main>{children}</main>
      </div>
    </SessionProviderWrapper>
  )
}
