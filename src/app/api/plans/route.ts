import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canEditPlans } from '@/lib/utils'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('budgetId')
    const year = searchParams.get('year')

    if (!budgetId || !year) {
      return NextResponse.json(
        { error: 'budgetId and year are required' },
        { status: 400 }
      )
    }

    await requireBudgetAccess(budgetId)

    const plans = await prisma.plan.findMany({
      where: {
        budgetId,
        year: parseInt(year),
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId, type, categoryId, year, month, amount, currency } = await req.json()

    if (!budgetId || !type || !year || amount === undefined || !categoryId) {
      return NextResponse.json(
        { error: 'budgetId, type, year, amount, and categoryId are required' },
        { status: 400 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditPlans(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'HUF']
    const planCurrency = currency && validCurrencies.includes(currency) ? currency : 'USD'

    // Verify category exists and matches the type
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    })
    
    if (!category || category.budgetId !== budgetId || category.type !== type) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    const monthValue = month !== undefined && month !== null ? parseInt(month) : null
    
    // Find existing plan with same category (or both null)
    const existingPlan = await prisma.plan.findFirst({
      where: {
        budgetId,
        type,
        year: parseInt(year),
        month: monthValue,
        categoryId: categoryId || null,
      },
    })

    let plan
    if (existingPlan) {
      // Update existing plan
      plan = await prisma.plan.update({
        where: { id: existingPlan.id },
        data: {
          amount: parseFloat(amount),
          currency: planCurrency,
          categoryId,
        },
        include: {
          category: true,
        },
      })
    } else {
      // Create new plan
      plan = await prisma.plan.create({
        data: {
          budgetId,
          type,
          categoryId,
          year: parseInt(year),
          month: monthValue,
          amount: parseFloat(amount),
          currency: planCurrency,
        },
        include: {
          category: true,
        },
      })
    }

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
