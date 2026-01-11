import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import StatisticsPage from '@/components/StatisticsPage'

async function getBudgetCurrency(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    select: { currency: true },
  })
  return budget?.currency || 'USD'
}

export default async function BudgetStatisticsPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  await requireBudgetAccess(budgetId)
  const currentYear = new Date().getFullYear()
  const currency = await getBudgetCurrency(budgetId)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <StatisticsPage 
        budgetId={budgetId} 
        initialYear={currentYear}
        currency={currency as 'USD' | 'EUR' | 'HUF'}
      />
    </div>
  )
}
