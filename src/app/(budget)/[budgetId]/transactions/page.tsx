import { requireBudgetAccess } from '@/lib/budget-utils'
import { prisma } from '@/lib/db'
import TransactionsPage from '@/components/TransactionsPage'

async function getTransactions(budgetId: string) {
  const transactions = await prisma.transaction.findMany({
    where: { budgetId },
    include: {
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { date: 'desc' },
  })

  return transactions
}

async function getCategories(budgetId: string) {
  const categories = await prisma.category.findMany({
    where: { budgetId },
    orderBy: { name: 'asc' },
  })

  return categories
}

export default async function BudgetTransactionsPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userId, userRole } = await requireBudgetAccess(budgetId)
  const transactions = await getTransactions(budgetId)
  const categories = await getCategories(budgetId)

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Transactions
      </h1>
      <TransactionsPage
        budgetId={budgetId}
        userId={userId}
        userRole={userRole}
        initialTransactions={transactions}
        categories={categories}
      />
    </div>
  )
}
