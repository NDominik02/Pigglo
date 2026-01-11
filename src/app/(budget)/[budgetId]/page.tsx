import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import PlannerPage from '@/components/PlannerPage'

async function getPlans(budgetId: string, year: number) {
  const plans = await prisma.plan.findMany({
    where: {
      budgetId,
      year,
    },
    orderBy: {
      type: 'asc',
    },
  })

  return plans
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

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Yearly Planner - {currentYear}
      </h1>
      <PlannerPage
        budgetId={budgetId}
        year={currentYear}
        initialPlans={plans}
        userRole={userRole}
      />
    </div>
  )
}
