import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { requireBudgetAccess } from '@/lib/budget-utils'
import { canEditTransaction, canDeleteTransaction } from '@/lib/utils'
import { Role } from '@prisma/client'

async function getTransactionBudgetId(
  transactionId: string
): Promise<string | null> {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { budgetId: true },
  })
  return transaction?.budgetId || null
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await params
    const budgetId = await getTransactionBudgetId(transactionId)

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (
      !canEditTransaction(
        userRole as Role,
        transaction.userId,
        session.user.id
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { type, categoryId, amount, currency, description, date } = await req.json()

    // Validate currency
    const validCurrencies = ['USD', 'EUR', 'HUF']
    const transactionCurrency = currency && validCurrencies.includes(currency) ? currency : 'USD'

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        type,
        categoryId: categoryId || null,
        amount: parseFloat(amount),
        currency: transactionCurrency,
        description: description || null,
        date: new Date(date),
      },
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
    })

    return NextResponse.json({ transaction: updatedTransaction })
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await params
    const budgetId = await getTransactionBudgetId(transactionId)

    if (!budgetId) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const { userRole } = await requireBudgetAccess(budgetId)

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    if (
      !canDeleteTransaction(
        userRole as Role,
        transaction.userId,
        session.user.id
      )
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    })

    return NextResponse.json({ message: 'Transaction deleted' })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
