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

  // Convert Date to string for client component
  return transactions.map((t) => ({
    ...t,
    date: t.date.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
  }))
}

async function getCategories(budgetId: string) {
  const categories = await prisma.category.findMany({
    where: { budgetId },
    orderBy: { name: 'asc' },
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

export default async function BudgetTransactionsPage({
  params,
}: {
  params: Promise<{ budgetId: string }>
}) {
  const { budgetId } = await params
  const { userId, userRole } = await requireBudgetAccess(budgetId)
  const transactions = await getTransactions(budgetId)
  const categories = await getCategories(budgetId)
  const currency = await getBudgetCurrency(budgetId)

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        Transactions
      </h1>
      <TransactionsPage
        budgetId={budgetId}
        userId={userId}
        userRole={userRole}
        initialTransactions={transactions}
        categories={categories}
        currency={currency as 'USD' | 'EUR' | 'HUF'}
      />
    </div>
  )
}
