import { redirect } from 'next/navigation'

export default function Home() {
  // Simple redirect to login - let login page handle auth check
  // This prevents interference with dashboard routing
  redirect('/login')
}
