import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import CategoriesPage from '@/components/CategoriesPage'

async function getCategories(budgetId: string) {
  const categories = await prisma.category.findMany({
    where: { budgetId },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })

  return categories
}

export default async function BudgetCategoriesPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userRole } = await requireBudgetAccess(budgetId)
  const categories = await getCategories(budgetId)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Categories
      </h1>
      <CategoriesPage
        budgetId={budgetId}
        userRole={userRole}
        initialCategories={categories}
      />
    </div>
  )
}
