import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canEditCategories } from '@/lib/utils'
import { Role } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const budgetId = searchParams.get('budgetId')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'budgetId is required' },
        { status: 400 }
      )
    }

    await requireBudgetAccess(budgetId)

    const categories = await prisma.category.findMany({
      where: { budgetId },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
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

    const { budgetId, name, emoji, type } = await req.json()

    if (!budgetId || !name || !type) {
      return NextResponse.json(
        { error: 'budgetId, name, and type are required' },
        { status: 400 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditCategories(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const category = await prisma.category.create({
      data: {
        budgetId,
        name: name.trim(),
        emoji: emoji?.trim() || null,
        type,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
