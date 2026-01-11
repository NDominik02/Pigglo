import { auth } from './auth'
import { prisma } from './db'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'

export async function getUserBudgetRole(
  budgetId: string,
  userId: string
): Promise<Role | null> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      owner: true,
      members: {
        where: { userId },
      },
    },
  })

  if (!budget) {
    return null
  }

  // Owner has OWNER role
  if (budget.ownerId === userId) {
    return Role.OWNER
  }

  // Check membership
  const membership = budget.members.find((m) => m.userId === userId)
  return membership?.role || null
}

// Helper to check if error is a Next.js redirect
function isRedirectError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      'digest' in error &&
      typeof (error as any).digest === 'string' &&
      (error as any).digest.startsWith('NEXT_REDIRECT')
    )
  }
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as any).digest === 'string' &&
    (error as any).digest.startsWith('NEXT_REDIRECT')
  )
}

export async function requireBudgetAccess(
  budgetId: string,
  requiredRole?: Role
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      redirect('/login')
    }

    const userRole = await getUserBudgetRole(budgetId, session.user.id)

    if (!userRole) {
      redirect('/dashboard')
    }

    if (requiredRole) {
      const roleHierarchy = { OWNER: 3, ADMIN: 2, VISITOR: 1 }
      const userRoleLevel = roleHierarchy[userRole]
      const requiredRoleLevel = roleHierarchy[requiredRole]

      if (userRoleLevel < requiredRoleLevel) {
        redirect('/dashboard')
      }
    }

    return { userId: session.user.id, userRole }
  } catch (error: any) {
    // Re-throw redirect errors - they're expected and handled by Next.js
    // Redirect errors have a digest property starting with 'NEXT_REDIRECT'
    // Check both digest and message properties
    const digest = error?.digest
    const message = error?.message
    const isRedirect = 
      (digest && typeof digest === 'string' && digest.includes('NEXT_REDIRECT')) ||
      (message && typeof message === 'string' && message.includes('NEXT_REDIRECT'))
    
    if (isRedirect) {
      throw error
    }
    // Only log actual errors, not redirects
    console.error('Auth error in requireBudgetAccess:', error)
    redirect('/login')
  }
}
