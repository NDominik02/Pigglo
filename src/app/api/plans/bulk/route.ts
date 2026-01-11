import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canEditPlans } from '@/lib/utils'
import { Role, TransactionType } from '@prisma/client'

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('budgetId')
    const type = searchParams.get('type')
    const year = searchParams.get('year')

    if (!budgetId || !type || !year) {
      return NextResponse.json(
        { error: 'budgetId, type, and year are required' },
        { status: 400 }
      )
    }

    // Validate type
    if (!Object.values(TransactionType).includes(type as TransactionType)) {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditPlans(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete all plans of this type for this year
    const result = await prisma.plan.deleteMany({
      where: {
        budgetId,
        type: type as TransactionType,
        year: parseInt(year),
      },
    })

    return NextResponse.json({ 
      message: `Deleted ${result.count} plan(s)`,
      count: result.count 
    })
  } catch (error) {
    console.error('Error deleting plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
