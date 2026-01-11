import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { TransactionType } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('budgetId')
    const year = searchParams.get('year') || new Date().getFullYear().toString()

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId is required' },
        { status: 400 }
      )
    }

    await requireBudgetAccess(budgetId)

    const yearNum = parseInt(year)
    const startDate = new Date(yearNum, 0, 1)
    const endDate = new Date(yearNum, 11, 31, 23, 59, 59)

    // Get all transactions for the year
    const transactions = await prisma.transaction.findMany({
      where: {
        budgetId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    })

    // Get all plans for the year
    const plans = await prisma.plan.findMany({
      where: {
        budgetId,
        year: yearNum,
      },
    })

    // Calculate totals by type
    const calculateTotals = (type: TransactionType) => {
      const actual = transactions
        .filter((t) => t.type === type)
        .reduce((sum, t) => sum + t.amount, 0)

      const planned = plans
        .filter((p) => p.type === type && p.month === null)
        .reduce((sum, p) => sum + p.amount, 0)

      const monthlyPlanned = plans
        .filter((p) => p.type === type && p.month !== null)
        .reduce((sum, p) => sum + p.amount, 0)

      const totalPlanned = planned || monthlyPlanned

      return { actual, planned: totalPlanned }
    }

    const income = calculateTotals(TransactionType.INCOME)
    const expense = calculateTotals(TransactionType.EXPENSE)
    const debt = calculateTotals(TransactionType.DEBT)
    const savings = calculateTotals(TransactionType.SAVINGS)

    // Calculate monthly data
    const monthlyData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthStart = new Date(yearNum, i, 1)
      const monthEnd = new Date(yearNum, i + 1, 0, 23, 59, 59)

      const monthTransactions = transactions.filter(
        (t) => t.date >= monthStart && t.date <= monthEnd
      )

      const monthPlans = plans.filter((p) => p.month === month)

      return {
        month,
        monthName: monthStart.toLocaleString('default', { month: 'short' }),
        income: {
          actual: monthTransactions
            .filter((t) => t.type === TransactionType.INCOME)
            .reduce((sum, t) => sum + t.amount, 0),
          planned:
            monthPlans
              .find((p) => p.type === TransactionType.INCOME)
              ?.amount || 0,
        },
        expense: {
          actual: monthTransactions
            .filter((t) => t.type === TransactionType.EXPENSE)
            .reduce((sum, t) => sum + t.amount, 0),
          planned:
            monthPlans
              .find((p) => p.type === TransactionType.EXPENSE)
              ?.amount || 0,
        },
        debt: {
          actual: monthTransactions
            .filter((t) => t.type === TransactionType.DEBT)
            .reduce((sum, t) => sum + t.amount, 0),
          planned:
            monthPlans.find((p) => p.type === TransactionType.DEBT)?.amount ||
            0,
        },
        savings: {
          actual: monthTransactions
            .filter((t) => t.type === TransactionType.SAVINGS)
            .reduce((sum, t) => sum + t.amount, 0),
          planned:
            monthPlans
              .find((p) => p.type === TransactionType.SAVINGS)
              ?.amount || 0,
        },
      }
    })

    // Calculate category breakdown
    const categoryBreakdown = transactions.reduce(
      (acc, t) => {
        if (!t.category) return acc
        const key = t.category.id
        if (!acc[key]) {
          acc[key] = {
            id: t.category.id,
            name: t.category.name,
            emoji: t.category.emoji,
            type: t.category.type,
            amount: 0,
          }
        }
        acc[key].amount += t.amount
        return acc
      },
      {} as Record<
        string,
        { id: string; name: string; emoji: string | null; type: TransactionType; amount: number }
      >
    )

    const categoryData = Object.values(categoryBreakdown).sort(
      (a, b) => b.amount - a.amount
    )

    // Calculate monthly statistics
    const calculateMonthlyStats = (type: TransactionType) => {
      const monthlyActuals = monthlyData.map((m) => {
        switch (type) {
          case TransactionType.INCOME:
            return m.income.actual
          case TransactionType.EXPENSE:
            return m.expense.actual
          case TransactionType.DEBT:
            return m.debt.actual
          case TransactionType.SAVINGS:
            return m.savings.actual
          default:
            return 0
        }
      })

      const monthlyPlanned = monthlyData.map((m) => {
        switch (type) {
          case TransactionType.INCOME:
            return m.income.planned
          case TransactionType.EXPENSE:
            return m.expense.planned
          case TransactionType.DEBT:
            return m.debt.planned
          case TransactionType.SAVINGS:
            return m.savings.planned
          default:
            return 0
        }
      })

      const actualAvg =
        monthlyActuals.reduce((sum, val) => sum + val, 0) /
        monthlyActuals.length
      const plannedAvg =
        monthlyPlanned.reduce((sum, val) => sum + val, 0) /
        monthlyPlanned.length

      const actualMax = Math.max(...monthlyActuals, 0)
      const positiveValues = monthlyActuals.filter((v) => v > 0)
      const actualMin = positiveValues.length > 0 ? Math.min(...positiveValues) : 0

      return {
        plannedAvg: plannedAvg || 0,
        actualAvg: actualAvg || 0,
        highest: actualMax || 0,
        lowest: actualMin || 0,
      }
    }

    return NextResponse.json({
      year: yearNum,
      totals: {
        income,
        expense,
        debt,
        savings,
      },
      monthlyData,
      categoryData,
      monthlyStats: {
        income: calculateMonthlyStats(TransactionType.INCOME),
        expense: calculateMonthlyStats(TransactionType.EXPENSE),
        debt: calculateMonthlyStats(TransactionType.DEBT),
        savings: calculateMonthlyStats(TransactionType.SAVINGS),
      },
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
