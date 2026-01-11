import { requireBudgetAccess } from '@/lib/budget-utils'
import Sidebar from '@/components/Sidebar'
import { Role } from '@prisma/client'
import BudgetLayoutClient from '@/components/BudgetLayoutClient'

export default async function BudgetLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userRole } = await requireBudgetAccess(budgetId)

  return (
    <BudgetLayoutClient budgetId={budgetId} userRole={userRole as Role}>
      {children}
    </BudgetLayoutClient>
  )
}
