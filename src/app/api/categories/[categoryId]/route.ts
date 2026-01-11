import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canEditCategories } from '@/lib/utils'
import { Role } from '@prisma/client'

async function getCategoryBudgetId(categoryId: string): Promise<string | null> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { budgetId: true },
  })
  return category?.budgetId || null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId } = await params
    const budgetId = await getCategoryBudgetId(categoryId)

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditCategories(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, emoji, type } = await req.json()

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        emoji: emoji?.trim() || null,
        type,
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryId } = await params
    const budgetId = await getCategoryBudgetId(categoryId)

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canEditCategories(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ message: 'Category deleted' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
