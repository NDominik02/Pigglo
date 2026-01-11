import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canDeleteBudget } from '@/lib/utils'
import { Role } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId } = await params
    await requireBudgetAccess(budgetId)

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId } = await params
    const { userRole } = await requireBudgetAccess(budgetId)

    // Only owners can update budget settings
    if (userRole !== Role.OWNER) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, currency } = await req.json()

    const updateData: { name?: string; currency?: string } = {}
    if (name !== undefined) {
      updateData.name = name.trim()
    }
    if (currency !== undefined) {
      const validCurrencies = ['USD', 'EUR', 'HUF']
      if (validCurrencies.includes(currency)) {
        updateData.currency = currency
      }
    }

    const budget = await prisma.budget.update({
      where: { id: budgetId },
      data: updateData,
    })

    return NextResponse.json({ budget })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId } = await params
    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canDeleteBudget(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.budget.delete({
      where: { id: budgetId },
    })

    return NextResponse.json({ message: 'Budget deleted' })
  } catch (error) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
