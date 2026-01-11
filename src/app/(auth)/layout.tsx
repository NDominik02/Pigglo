import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // If user is already logged in, redirect to dashboard
  const session = await auth()
  
  if (session?.user?.id) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
