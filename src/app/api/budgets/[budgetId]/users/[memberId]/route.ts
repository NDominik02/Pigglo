import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canManageUsers } from '@/lib/utils'
import { Role } from '@prisma/client'

async function getMemberBudgetId(memberId: string): Promise<string | null> {
  const member = await prisma.budgetUser.findUnique({
    where: { id: memberId },
    select: { budgetId: true },
  })
  return member?.budgetId || null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string; memberId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId, memberId } = await params
    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canManageUsers(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { role } = await req.json()

    if (!role) {
      return NextResponse.json(
        { error: 'role is required' },
        { status: 400 }
      )
    }

    if (role === Role.OWNER) {
      return NextResponse.json(
        { error: 'Cannot assign OWNER role' },
        { status: 400 }
      )
    }

    const member = await prisma.budgetUser.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ member })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ budgetId: string; memberId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { budgetId, memberId } = await params
    const { userRole } = await requireBudgetAccess(budgetId)

    if (!canManageUsers(userRole as Role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const member = await prisma.budgetUser.findUnique({
      where: { id: memberId },
      select: { role: true },
    })

    if (member?.role === Role.OWNER) {
      return NextResponse.json(
        { error: 'Cannot remove owner' },
        { status: 400 }
      )
    }

    await prisma.budgetUser.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ message: 'Member removed' })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
