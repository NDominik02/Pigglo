import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import PlannerPage from '@/components/PlannerPage'
import { TransactionType } from '@prisma/client'

async function getPlans(budgetId: string, year: number) {
  const plans = await prisma.plan.findMany({
    where: {
      budgetId,
      year,
    },
    select: {
      id: true,
      type: true,
      categoryId: true,
      category: {
        select: {
          id: true,
          name: true,
          emoji: true,
          type: true,
        },
      },
      year: true,
      month: true,
      amount: true,
      currency: true,
    },
    orderBy: {
      type: 'asc',
    },
  })

  return plans
}

async function getCategories(budgetId: string) {
  const categories = await prisma.category.findMany({
    where: { budgetId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return categories
}

async function getBudgetCurrency(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    select: { currency: true },
  })
  return budget?.currency || 'USD'
}

export default async function BudgetPlannerPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userRole } = await requireBudgetAccess(budgetId)
  const currentYear = new Date().getFullYear()
  const plans = await getPlans(budgetId, currentYear)
  const categories = await getCategories(budgetId)
  const currency = await getBudgetCurrency(budgetId)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <PlannerPage
        budgetId={budgetId}
        year={currentYear}
        initialPlans={plans}
        categories={categories}
        userRole={userRole}
        currency={currency as 'USD' | 'EUR' | 'HUF'}
      />
    </div>
  )
}
