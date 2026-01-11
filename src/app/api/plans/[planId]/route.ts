import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { canEditPlans } from '@/lib/utils'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { Role } from '@prisma/client'

async function getPlanBudgetId(planId: string): Promise<string | null> {
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
    select: { budgetId: true },
  })
  return plan?.budgetId || null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const budgetId = await getPlanBudgetId(planId)

    if (!budgetId) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditPlans(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { amount, categoryId, month, currency } = await req.json()

    if (amount === undefined) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      )
    }

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'HUF']
    const planCurrency = currency && validCurrencies.includes(currency) ? currency : 'USD'

    // Get the plan to check its type
    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    // If categoryId is provided, verify it exists and matches the type
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      })
      
      if (!category || category.budgetId !== existingPlan.budgetId || category.type !== existingPlan.type) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: { 
        amount: parseFloat(amount),
        currency: planCurrency,
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        month: month !== undefined ? (month !== null ? parseInt(month) : null) : undefined,
      },
      include: {
        category: true,
      },
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await params
    const budgetId = await getPlanBudgetId(planId)

    if (!budgetId) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditPlans(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.plan.delete({
      where: { id: planId },
    })

    return NextResponse.json({ message: 'Plan deleted' })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
