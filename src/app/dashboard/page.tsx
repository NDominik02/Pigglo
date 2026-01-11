import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import BudgetCard from '@/components/BudgetCard'
import CreateBudgetCard from '@/components/CreateBudgetCard'

async function getBudgets(userId: string) {
  const ownedBudgets = await prisma.budget.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { transactions: true, members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const sharedBudgets = await prisma.budget.findMany({
    where: {
      members: {
        some: {
          userId,
          role: { not: 'OWNER' },
        },
      },
    },
    include: {
      _count: {
        select: { transactions: true, members: true },
      },
      members: {
        where: { userId },
        select: { role: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { ownedBudgets, sharedBudgets }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/login')
  }

  const { ownedBudgets, sharedBudgets } = await getBudgets(session.user.id)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
        Your Budgets
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
        <CreateBudgetCard />
        {ownedBudgets.map((budget) => (
          <BudgetCard
            key={budget.id}
            budget={{
              id: budget.id,
              name: budget.name,
              transactionCount: budget._count.transactions,
              memberCount: budget._count.members,
              role: 'OWNER',
            }}
          />
        ))}
      </div>

      {sharedBudgets.length > 0 && (
        <>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Shared With You
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sharedBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={{
                  id: budget.id,
                  name: budget.name,
                  transactionCount: budget._count.transactions,
                  memberCount: budget._count.members,
                  role: budget.members[0]?.role || 'VISITOR',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
