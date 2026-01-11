import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import { Role } from '@prisma/client'
import { redirect } from 'next/navigation'
import SettingsPage from '@/components/SettingsPage'

async function getBudgetMembers(budgetId: string) {
  const members = await prisma.budgetUser.findMany({
    where: { budgetId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { role: 'desc' },
      { createdAt: 'asc' },
    ],
  })

  return members
}

async function getBudget(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    select: {
      id: true,
      name: true,
      currency: true,
      ownerId: true,
    },
  })

  return budget
}

export default async function BudgetSettingsPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userId, userRole } = await requireBudgetAccess(budgetId)

  // Only owners can access settings
  if (userRole !== Role.OWNER) {
    redirect(`/budget/${budgetId}`)
  }

  const members = await getBudgetMembers(budgetId)
  const budget = await getBudget(budgetId)

  if (!budget) {
    redirect('/dashboard')
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        Settings
      </h1>
      <SettingsPage
        budgetId={budgetId}
        budgetName={budget.name}
        budgetCurrency={budget.currency}
        members={members}
      />
    </div>
  )
}
